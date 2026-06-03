const Transaction = require('../models/Transaction');
const parseTransaction = require('../utils/transactionParser');

const getTransactions = async (req, res) => {
  return res.json({
    success: true,
    data: [],
  });
};

const createTransaction = async (req, res, next) => {
  try {
    const { description, paymentMode } = req.body;

    if (!description) {
      return res.status(400).json({
        success: false,
        message: 'description is required.',
      });
    }

    const parsed = parseTransaction(description);
    const transaction = await Transaction.create({
      ...parsed,
      paymentMode: paymentMode || 'cash',
      user: req.user._id,
      business: req.user.business._id || req.user.business,
    });

    return res.status(201).json({
      success: true,
      message: 'Transaction placeholder created.',
      data: transaction,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createTransaction,
  getTransactions,
};
