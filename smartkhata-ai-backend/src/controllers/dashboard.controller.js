const InventoryItem = require('../models/InventoryItem');
const Transaction = require('../models/Transaction');

const sumTotals = (transactions, types) =>
  transactions.filter((transaction) => types.includes(transaction.type)).reduce((sum, transaction) => sum + transaction.total, 0);

const getDashboard = async (req, res, next) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [monthlyTransactions, todayTransactions, inventoryItems, recentTransactions, transactionCount] = await Promise.all([
      Transaction.find({ user: req.user._id, createdAt: { $gte: monthStart } }),
      Transaction.find({ user: req.user._id, createdAt: { $gte: todayStart } }),
      InventoryItem.find({ user: req.user._id }),
      Transaction.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(5),
      Transaction.countDocuments({ user: req.user._id }),
    ]);

    const todayRevenue = sumTotals(todayTransactions, ['sale']);
    const monthlyRevenue = sumTotals(monthlyTransactions, ['sale']);
    const monthlyExpenses = sumTotals(monthlyTransactions, ['expense', 'purchase']);
    const inventoryCount = inventoryItems.length;
    const healthyCount = inventoryItems.filter((item) => item.status === 'healthy').length;
    const todaySalesCount = todayTransactions.filter((transaction) => transaction.type === 'sale').length;
    const monthlyExpenseCount = monthlyTransactions.filter((transaction) => ['expense', 'purchase'].includes(transaction.type)).length;

    return res.json({
      success: true,
      data: {
        todayRevenue,
        todaySalesCount,
        monthlyRevenue,
        monthlyExpenses,
        monthlyProfit: monthlyRevenue - monthlyExpenses,
        monthlyExpenseCount,
        transactionCount,
        inventoryCount,
        lowStockCount: inventoryItems.filter((item) => ['low', 'critical'].includes(item.status)).length,
        recentTransactions,
        inventoryHealth: inventoryCount ? Math.round((healthyCount / inventoryCount) * 100) : 100,
      },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getDashboard,
};
