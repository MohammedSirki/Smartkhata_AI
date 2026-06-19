const Business = require('../models/Business');
const InventoryItem = require('../models/InventoryItem');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { recalculateReports } = require('./report-recalculation.service');

const sumTotals = (transactions, types) =>
  transactions.filter((transaction) => types.includes(transaction.type)).reduce((sum, transaction) => sum + transaction.total, 0);

const getBusinessId = (user) => user.business?._id || user.business;

const mapTransaction = (transaction) => ({
  type: transaction.type,
  item: transaction.item,
  quantity: transaction.quantity,
  unitPrice: transaction.unitPrice,
  total: transaction.total,
  paymentMode: transaction.paymentMode,
  description: transaction.description,
  createdAt: transaction.createdAt,
});

const mapInventoryItem = (item) => ({
  name: item.name,
  stock: item.stock,
  costPrice: item.costPrice,
  sellingPrice: item.sellingPrice,
  status: item.status,
});

const buildBusinessContext = async (userId) => {
  const user = await User.findById(userId).select('fullName email business role').populate('business');
  if (!user) {
    throw new Error('User not found.');
  }

  const businessId = getBusinessId(user);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [business, monthlyTransactions, todayTransactions, recentTransactions, inventory, reports] = await Promise.all([
    businessId ? Business.findById(businessId).select('businessName gstNumber phone currency language') : null,
    Transaction.find({ user: userId, business: businessId, createdAt: { $gte: monthStart } }),
    Transaction.find({ user: userId, business: businessId, createdAt: { $gte: todayStart } }),
    Transaction.find({ user: userId, business: businessId }).sort({ createdAt: -1 }).limit(20),
    InventoryItem.find({ user: userId, business: businessId }).sort({ status: 1, stock: 1 }).limit(50),
    recalculateReports({ userId, businessId }),
  ]);

  const inventoryCount = inventory.length;
  const healthyCount = inventory.filter((item) => item.status === 'healthy').length;
  const monthlyRevenue = sumTotals(monthlyTransactions, ['sale']);
  const monthlyExpenses = sumTotals(monthlyTransactions, ['expense', 'purchase']);

  return {
    generatedAt: now.toISOString(),
    profile: {
      ownerName: user.fullName,
      email: user.email,
      role: user.role,
    },
    business: business
      ? {
          businessName: business.businessName,
          gstNumber: business.gstNumber,
          phone: business.phone,
          currency: business.currency,
          language: business.language,
        }
      : null,
    dashboard: {
      todayRevenue: sumTotals(todayTransactions, ['sale']),
      todaySalesCount: todayTransactions.filter((transaction) => transaction.type === 'sale').length,
      monthlyRevenue,
      monthlyExpenses,
      monthlyProfit: monthlyRevenue - monthlyExpenses,
      monthlyExpenseCount: monthlyTransactions.filter((transaction) => ['expense', 'purchase'].includes(transaction.type)).length,
      transactionCount: reports.transactionCount,
      inventoryCount,
      lowStockCount: inventory.filter((item) => ['low', 'critical'].includes(item.status)).length,
      inventoryHealth: inventoryCount ? Math.round((healthyCount / inventoryCount) * 100) : 100,
    },
    recentTransactions: recentTransactions.map(mapTransaction),
    inventory: inventory.map(mapInventoryItem),
    reports: {
      totalSales: reports.totalSales,
      totalPurchases: reports.totalPurchases,
      totalExpenses: reports.totalExpenses,
      netProfit: reports.netProfit,
      transactionCount: reports.transactionCount,
      inventoryValue: reports.inventoryValue,
      monthlyBreakdown: reports.monthlyBreakdown.slice(0, 6),
    },
  };
};

module.exports = {
  buildBusinessContext,
};
