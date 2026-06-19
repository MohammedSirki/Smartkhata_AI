const InventoryItem = require('../models/InventoryItem');
const Transaction = require('../models/Transaction');
const { buildBusinessContext } = require('../services/business-context.service');
const { askBusinessAssistantWithGroq } = require('../services/groq.service');

const sumTotals = (transactions, types) =>
  transactions.filter((transaction) => types.includes(transaction.type)).reduce((sum, transaction) => sum + transaction.total, 0);

const chat = async (req, res, next) => {
  try {
    const { message = '' } = req.body;

    if (!message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'message is required.',
      });
    }

    if (process.env.GROQ_API_KEY) {
      try {
        const context = await buildBusinessContext(req.user._id);
        const reply = await askBusinessAssistantWithGroq(message, context);

        return res.json({
          success: true,
          data: {
            reply,
            response: reply,
            answeredBy: 'groq',
          },
          response: reply,
        });
      } catch (error) {
        // Fall back to the local rule-based assistant.
      }
    }

    const question = message.toLowerCase();
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [monthlyTransactions, lowStockItems] = await Promise.all([
      Transaction.find({ user: req.user._id, createdAt: { $gte: monthStart } }),
      InventoryItem.find({ user: req.user._id, status: { $in: ['low', 'critical'] } }).sort({ stock: 1 }),
    ]);

    const monthlyRevenue = sumTotals(monthlyTransactions, ['sale']);
    const monthlyExpenses = sumTotals(monthlyTransactions, ['expense', 'purchase']);
    let response = 'I can help with profit, sales, expenses, and low inventory using your current SmartKhata data.';

    if (question.includes('profit')) {
      response = `Your monthly profit is INR ${monthlyRevenue - monthlyExpenses}.`;
    } else if (question.includes('sale') || question.includes('revenue')) {
      response = `Your monthly revenue is INR ${monthlyRevenue}.`;
    } else if (question.includes('expense') || question.includes('cost') || question.includes('spend')) {
      response = `Your monthly expenses are INR ${monthlyExpenses}.`;
    } else if (question.includes('inventory') || question.includes('stock') || question.includes('low')) {
      response = lowStockItems.length
        ? `Low stock items: ${lowStockItems.map((item) => `${item.name} (${item.stock})`).join(', ')}.`
        : 'No low stock items found right now.';
    }

    return res.json({
      success: true,
      data: {
        reply: response,
        response,
        answeredBy: 'fallback',
      },
      response,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  chat,
};
