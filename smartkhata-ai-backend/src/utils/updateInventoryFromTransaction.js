const InventoryItem = require('../models/InventoryItem');
const {
  addAlias,
  findMatchingInventoryItem,
  normalizeItemName,
} = require('./itemMatcher');

const ITEM_NOT_IN_STOCK_MESSAGE = 'This item is not in your inventory yet. Please purchase/add stock first.';

const updateInventoryFromTransaction = async (transaction) => {
  if (!transaction || transaction.type === 'expense') return null;

  const name = normalizeItemName(transaction.item);
  if (!name) {
    throw new Error('Inventory item name is required.');
  }

  const match = await findMatchingInventoryItem(transaction.item, transaction.user, transaction.business);
  let item = match.item;

  if (transaction.type === 'purchase') {
    if (!item || match.strength !== 'strong') {
      item = new InventoryItem({
        user: transaction.user,
        business: transaction.business,
        name,
        normalizedName: name,
        aliases: [],
        stock: 0,
        costPrice: 0,
        sellingPrice: 0,
      });
    }
    item.stock += transaction.quantity || 0;
    if (transaction.unitPrice) item.costPrice = transaction.unitPrice;
    addAlias(item, transaction.item);
  }

  if (transaction.type === 'sale') {
    if (!item) {
      const error = new Error(ITEM_NOT_IN_STOCK_MESSAGE);
      error.code = 'ITEM_NOT_IN_STOCK';
      error.suggestion = `Try recording a purchase first, for example: Purchased 10 ${transaction.item} for Rs.100 each`;
      throw error;
    }

    if (match.strength === 'weak') {
      const error = new Error(`Possible inventory match found for "${transaction.item}", but it is not confident enough. Please clarify the item name.`);
      error.code = 'WEAK_INVENTORY_MATCH';
      throw error;
    }

    const nextStock = item.stock - (transaction.quantity || 0);
    if (nextStock < 0) {
      const error = new Error(`Insufficient stock. Available stock: ${item.stock}`);
      error.code = 'INSUFFICIENT_STOCK';
      throw error;
    }
    item.stock = nextStock;
    if (transaction.unitPrice) item.sellingPrice = transaction.unitPrice;
    addAlias(item, transaction.item);
  }

  if (transaction.type === 'return') {
    if (!item || match.strength !== 'strong') {
      item = new InventoryItem({
        user: transaction.user,
        business: transaction.business,
        name,
        normalizedName: name,
        aliases: [`return ${name}`],
        stock: 0,
        costPrice: 0,
        sellingPrice: 0,
      });
    }
    item.stock += transaction.quantity || 0;
    addAlias(item, transaction.item);
  }

  await item.save();
  return item;
};

module.exports = updateInventoryFromTransaction;
