const { recalculateReports } = require('../services/report-recalculation.service');
const InventoryItem = require('../models/InventoryItem');
const Transaction = require('../models/Transaction');

const getBusinessId = (user) => user.business?._id || user.business;

const csvEscape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const toCsv = (rows) => {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  return [headers.join(','), ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(','))].join('\n');
};

const sendExport = (req, res, name, rows) => {
  const format = String(req.query.format || 'csv').toLowerCase();

  if (format === 'json') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${name}.json"`);
    return res.send(JSON.stringify(rows, null, 2));
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${name}.csv"`);
  return res.send(toCsv(rows));
};

const exportTransactions = async (req, res, next) => {
  try {
    const rows = await Transaction.find({ user: req.user._id, business: getBusinessId(req.user) }).sort({ createdAt: -1 }).lean();
    return sendExport(req, res, 'transactions', rows);
  } catch (error) {
    return next(error);
  }
};

const exportInventory = async (req, res, next) => {
  try {
    const rows = await InventoryItem.find({ user: req.user._id, business: getBusinessId(req.user) }).sort({ updatedAt: -1 }).lean();
    return sendExport(req, res, 'inventory', rows);
  } catch (error) {
    return next(error);
  }
};

const exportReports = async (req, res, next) => {
  try {
    const summary = await recalculateReports({ userId: req.user._id, businessId: getBusinessId(req.user) });
    const rows = [
      {
        totalSales: summary.totalSales,
        totalPurchases: summary.totalPurchases,
        totalExpenses: summary.totalExpenses,
        netProfit: summary.netProfit,
        inventoryValue: summary.inventoryValue,
        transactionCount: summary.transactionCount,
      },
      ...summary.monthlyBreakdown,
    ];

    return sendExport(req, res, 'reports', rows);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  exportInventory,
  exportReports,
  exportTransactions,
};
