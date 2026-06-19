const InventoryItem = require('../models/InventoryItem');
const Transaction = require('../models/Transaction');
const {
  addAlias,
  matchInventoryItems,
  normalizeItemName,
} = require('../utils/itemMatcher');

const ITEM_NOT_IN_STOCK_MESSAGE = 'This item is not in your inventory yet. Please purchase/add stock first.';

const emptyItem = (transaction) => ({
  user: transaction.user,
  business: transaction.business,
  name: normalizeItemName(transaction.item),
  normalizedName: normalizeItemName(transaction.item),
  aliases: [],
  stock: 0,
  costPrice: 0,
  sellingPrice: 0,
});

const createInventoryError = (message, details = {}) => {
  const error = new Error(message);
  error.code = details.code || 'INVENTORY_ERROR';
  error.details = details;
  return error;
};

const upsertInventoryMapItem = (inventoryMap, item) => {
  for (const [key, value] of inventoryMap.entries()) {
    if (value === item) inventoryMap.delete(key);
  }
  inventoryMap.set(item.normalizedName || normalizeItemName(item.name), item);
};

const recalculateInventory = async ({ userId, businessId }) => {
  const transactions = await Transaction.find({
    user: userId,
    business: businessId,
  }).sort({ createdAt: 1, _id: 1 });

  const inventoryMap = new Map();

  for (const transaction of transactions) {
    if (transaction.type === 'expense') continue;

    const name = normalizeItemName(transaction.item);
    if (!name) continue;

    let item = inventoryMap.get(name);
    const items = Array.from(inventoryMap.values());
    const match = item
      ? { item, strength: 'strong', normalizedName: name, score: 1 }
      : matchInventoryItems(transaction.item, items);
    const quantity = Number(transaction.quantity || 0);

    if (transaction.type === 'purchase') {
      item = match.strength === 'strong' ? match.item : emptyItem(transaction);
      item.stock += quantity;
      if (transaction.unitPrice > 0) item.costPrice = transaction.unitPrice;
      if (transaction.sellingPrice > 0) item.sellingPrice = transaction.sellingPrice;
      if (match.strength === 'strong') addAlias(item, transaction.item);
    }

    if (transaction.type === 'sale') {
      if (!match.item) {
        throw createInventoryError(ITEM_NOT_IN_STOCK_MESSAGE, {
          code: 'ITEM_NOT_IN_STOCK',
          itemName: transaction.item,
          suggestion: `Try recording a purchase first, for example: Purchased 10 ${transaction.item} for Rs.100 each`,
        });
      }

      if (match.strength === 'weak') {
        throw createInventoryError(
          `Possible inventory match found for "${transaction.item}", but it is not confident enough. Please clarify the item name.`,
          {
            code: 'WEAK_INVENTORY_MATCH',
            itemName: transaction.item,
            matchedItem: match.item.name,
            score: match.score,
          },
        );
      }

      item = match.item;
      const nextStock = item.stock - quantity;
      if (nextStock < 0) {
        throw createInventoryError(`Insufficient stock. Available stock: ${item.stock}`, {
          code: 'INSUFFICIENT_STOCK',
          itemName: transaction.item,
          availableStock: item.stock,
        });
      }
      item.stock = nextStock;
      if (transaction.unitPrice > 0) item.sellingPrice = transaction.unitPrice;
      addAlias(item, transaction.item);
    }

    if (transaction.type === 'return') {
      item = match.strength === 'strong' ? match.item : emptyItem(transaction);
      item.stock += quantity;
      if (match.strength === 'strong') addAlias(item, transaction.item);
      if (match.strength !== 'strong') addAlias(item, `return ${transaction.item}`);
    }

    upsertInventoryMapItem(inventoryMap, item);
  }

  await InventoryItem.deleteMany({ user: userId, business: businessId });

  const items = Array.from(inventoryMap.values());
  if (!items.length) {
    return [];
  }

  return InventoryItem.insertMany(items);
};

module.exports = {
  recalculateInventory,
};
