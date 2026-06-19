const InventoryItem = require('../models/InventoryItem');
const Transaction = require('../models/Transaction');

const monthName = (monthIndex) => new Date(2000, monthIndex, 1).toLocaleString('en-US', { month: 'short' });

const sumTransactions = (transactions, type) =>
  transactions.filter((transaction) => transaction.type === type).reduce((sum, transaction) => sum + transaction.total, 0);

const recalculateReports = async ({ userId, businessId }) => {
  const [transactions, inventoryItems] = await Promise.all([
    Transaction.find({ user: userId, business: businessId }).sort({ createdAt: -1 }),
    InventoryItem.find({ user: userId, business: businessId }),
  ]);

  const totalSales = sumTransactions(transactions, 'sale');
  const totalPurchases = sumTransactions(transactions, 'purchase');
  const totalExpenses = sumTransactions(transactions, 'expense');
  const inventoryValue = inventoryItems.reduce((sum, item) => sum + item.stock * item.costPrice, 0);
  const monthlyMap = new Map();

  for (const transaction of transactions) {
    const createdAt = new Date(transaction.createdAt);
    const key = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`;
    const current = monthlyMap.get(key) || {
      month: `${monthName(createdAt.getMonth())} ${createdAt.getFullYear()}`,
      sales: 0,
      purchases: 0,
      expenses: 0,
      netProfit: 0,
      transactionCount: 0,
    };

    if (transaction.type === 'sale') current.sales += transaction.total;
    if (transaction.type === 'purchase') current.purchases += transaction.total;
    if (transaction.type === 'expense') current.expenses += transaction.total;
    current.netProfit = current.sales - current.purchases - current.expenses;
    current.transactionCount += 1;
    monthlyMap.set(key, current);
  }

  return {
    totalSales,
    totalPurchases,
    totalExpenses,
    netProfit: totalSales - totalPurchases - totalExpenses,
    transactionCount: transactions.length,
    inventoryValue,
    monthlyBreakdown: Array.from(monthlyMap.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([, value]) => value),
  };
};

module.exports = {
  recalculateReports,
};
