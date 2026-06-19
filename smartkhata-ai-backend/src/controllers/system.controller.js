const mongoose = require('mongoose');

const InventoryItem = require('../models/InventoryItem');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

const health = async (req, res, next) => {
  try {
    const [userCount, transactionCount, inventoryCount] = await Promise.all([
      User.countDocuments(),
      Transaction.countDocuments(),
      InventoryItem.countDocuments(),
    ]);

    return res.json({
      success: true,
      data: {
        databaseStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        userCount,
        transactionCount,
        inventoryCount,
        serverUptime: process.uptime(),
      },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  health,
};
