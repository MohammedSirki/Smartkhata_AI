const Transaction = require('../models/Transaction');
const { parseTransactionWithGroq } = require('../services/groq.service');
const parseTransaction = require('../utils/transactionParser');
const { normalizeItemName } = require('../utils/itemMatcher');
const { recalculateInventory } = require('../services/inventory-recalculation.service');
const { recalculateReports } = require('../services/report-recalculation.service');

const getBusinessId = (user) => user.business?._id || user.business;

const normalizePaymentMode = (paymentMode) => {
  if (!paymentMode || paymentMode === 'unknown') return 'cash';
  return ['cash', 'upi', 'card', 'bank', 'credit', 'other'].includes(paymentMode) ? paymentMode : 'other';
};

const parseRawTransaction = async (rawText) => {
  if (process.env.GROQ_API_KEY) {
    try {
      const transaction = await parseTransactionWithGroq(rawText);
      if (transaction.type !== 'unknown') {
        return {
          parsed: transaction,
          parsedBy: 'groq',
        };
      }
    } catch (error) {
      // Fall back to the existing regex parser.
    }
  }

  return {
    parsed: parseTransaction(rawText),
    parsedBy: 'regex',
  };
};

const normalizeTransactionPayload = async (body) => {
  const { parsed, parsedBy } = body.rawText
    ? await parseRawTransaction(body.rawText)
    : { parsed: {}, parsedBy: 'manual' };
  const payload = {
    ...parsed,
    ...body,
  };

  payload.rawText = payload.rawText || payload.description || '';
  payload.description = payload.description || parsed.description || payload.rawText;
  payload.item = payload.item ? normalizeItemName(payload.item) : payload.item;
  payload.quantity = Number(payload.quantity ?? parsed.quantity ?? (payload.type === 'expense' ? 1 : 1));
  payload.unitPrice = Number(payload.unitPrice ?? parsed.unitPrice ?? payload.total ?? 0);
  payload.total = payload.total === undefined || payload.total === null || payload.total === ''
    ? payload.quantity * payload.unitPrice
    : Number(payload.total);
  payload.paymentMode = normalizePaymentMode(payload.paymentMode || parsed.paymentMode);
  payload.parsedBy = parsedBy;

  return payload;
};

const sendValidationError = (res, message) =>
  res.status(400).json({
    success: false,
    message,
  });

const sendInventoryError = (res, error) => {
  const details = error.details || {};

  if (error.code === 'ITEM_NOT_IN_STOCK' || details.code === 'ITEM_NOT_IN_STOCK') {
    return res.status(400).json({
      success: false,
      message: 'This item is not in your inventory yet. Please purchase/add stock first.',
      suggestion: details.suggestion || error.suggestion || 'Try recording a purchase first, for example: Purchased 10 [item name] for Rs.100 each',
    });
  }

  if (error.code === 'INSUFFICIENT_STOCK' || details.code === 'INSUFFICIENT_STOCK' || error.message.startsWith('Insufficient stock')) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  if (error.code === 'WEAK_INVENTORY_MATCH' || details.code === 'WEAK_INVENTORY_MATCH') {
    return res.status(400).json({
      success: false,
      message: error.message,
      suggestion: details.matchedItem
        ? `Did you mean "${details.matchedItem}"? Please record the sale using that inventory name.`
        : 'Please record the sale using the exact inventory item name.',
    });
  }

  return null;
};

const getTransactions = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    return next(error);
  }
};

const getTransactionById = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found.',
      });
    }

    return res.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    return next(error);
  }
};

const createTransaction = async (req, res, next) => {
  try {
    const payload = await normalizeTransactionPayload(req.body);

    if (!payload.type || !['sale', 'purchase', 'expense', 'return'].includes(payload.type)) {
      return sendValidationError(res, 'Could not understand this transaction. Please clarify the type, item, quantity, and amount.');
    }

    if (!payload.item) {
      return sendValidationError(res, 'item is required.');
    }

    if (!Number.isFinite(payload.quantity) || payload.quantity <= 0) {
      return sendValidationError(res, 'quantity must be greater than 0.');
    }

    if (!Number.isFinite(payload.unitPrice) || payload.unitPrice < 0 || !Number.isFinite(payload.total) || payload.total < 0) {
      return sendValidationError(res, 'unitPrice and total must be valid positive numbers.');
    }

    const transaction = new Transaction({
      rawText: payload.rawText,
      type: payload.type,
      item: payload.item,
      quantity: payload.quantity,
      unitPrice: payload.unitPrice,
      total: payload.total,
      paymentMode: payload.paymentMode || 'cash',
      description: payload.description,
      user: req.user._id,
      business: getBusinessId(req.user),
    });

    await transaction.save();

    try {
      await recalculateInventory({ userId: req.user._id, businessId: getBusinessId(req.user) });
      await recalculateReports({ userId: req.user._id, businessId: getBusinessId(req.user) });
    } catch (error) {
      await Transaction.findByIdAndDelete(transaction._id);
      await recalculateInventory({ userId: req.user._id, businessId: getBusinessId(req.user) });
      throw error;
    }

    return res.status(201).json({
      success: true,
      message: 'Transaction recorded successfully',
      parsedBy: payload.parsedBy,
      data: {
        transaction,
        inventoryUpdated: true,
      },
    });
  } catch (error) {
    if (error.message.includes('parse transaction')) {
      return res.status(400).json({
        success: false,
        message: 'Could not understand this transaction. Please clarify the type, item, quantity, and amount.',
      });
    }

    const inventoryResponse = sendInventoryError(res, error);
    if (inventoryResponse) return inventoryResponse;

    return next(error);
  }
};

const deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found.',
      });
    }

    await transaction.deleteOne();
    await recalculateInventory({ userId: req.user._id, businessId: getBusinessId(req.user) });
    await recalculateReports({ userId: req.user._id, businessId: getBusinessId(req.user) });

    return res.json({
      success: true,
      message: 'Transaction deleted.',
      data: transaction,
    });
  } catch (error) {
    return next(error);
  }
};

const undoLastTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      user: req.user._id,
      business: getBusinessId(req.user),
    }).sort({ createdAt: -1, _id: -1 });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'No transaction available to undo.',
      });
    }

    await transaction.deleteOne();
    await recalculateInventory({ userId: req.user._id, businessId: getBusinessId(req.user) });
    await recalculateReports({ userId: req.user._id, businessId: getBusinessId(req.user) });

    return res.json({
      success: true,
      message: 'Last transaction undone',
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createTransaction,
  deleteTransaction,
  getTransactionById,
  getTransactions,
  undoLastTransaction,
};
