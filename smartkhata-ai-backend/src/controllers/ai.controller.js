const { buildBusinessContext } = require('../services/business-context.service');
const {
  generateBusinessInsightsWithGroq,
  parseTransactionWithGroq,
  testGroqConnection,
} = require('../services/groq.service');
const parseTransaction = require('../utils/transactionParser');

const fallbackInsights = (context) => {
  const dashboard = context.dashboard || {};
  const lowItems = (context.inventory || []).filter((item) => ['low', 'critical'].includes(item.status));
  const insights = [];

  if ((dashboard.monthlyRevenue || 0) > 0) {
    insights.push({
      type: 'success',
      title: 'Revenue is being tracked',
      message: `Monthly revenue is INR ${dashboard.monthlyRevenue}.`,
    });
  } else {
    insights.push({
      type: 'info',
      title: 'Start with your first sale',
      message: 'Record a sale to see your shop income here.',
    });
  }

  insights.push(
    lowItems.length
      ? {
          type: 'warning',
          title: 'Low stock items need attention',
          message: `${lowItems[0].name} has ${lowItems[0].stock} units left.`,
        }
      : {
          type: 'success',
          title: 'Inventory looks healthy',
          message: 'No urgent stock warning right now.',
        },
  );

  insights.push({
    type: (dashboard.monthlyProfit || 0) >= 0 ? 'success' : 'warning',
    title: 'Profit summary',
    message: `Current monthly profit is INR ${dashboard.monthlyProfit || 0}.`,
  });

  return insights;
};

const test = async (req, res) => {
  if (!process.env.GROQ_API_KEY) {
    return res.json({
      success: true,
      data: {
        reply: 'Groq API key is not configured. SmartKhata fallback mode is active.',
      },
    });
  }

  const reply = await testGroqConnection();

  return res.json({
    success: true,
    data: {
      reply,
    },
  });
};

const parseTransactionRoute = async (req, res) => {
  const { rawText = '' } = req.body;

  if (!rawText.trim()) {
    return res.status(400).json({
      success: false,
      message: 'rawText is required.',
    });
  }

  if (process.env.GROQ_API_KEY) {
    try {
      const transaction = await parseTransactionWithGroq(rawText);
      if (transaction.type !== 'unknown') {
        return res.json({
          success: true,
          data: {
            parsedBy: 'groq',
            transaction,
          },
        });
      }
    } catch (error) {
      // Fall through to the local parser.
    }
  }

  try {
    const transaction = parseTransaction(rawText);
    return res.json({
      success: true,
      data: {
        parsedBy: 'regex',
        transaction,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Could not understand this transaction. Please add item, quantity, and amount.',
    });
  }
};

const insights = async (req, res, next) => {
  try {
    const context = await buildBusinessContext(req.user._id);

    if (process.env.GROQ_API_KEY) {
      try {
        const aiInsights = await generateBusinessInsightsWithGroq(context);
        return res.json({
          success: true,
          data: {
            insights: aiInsights,
            generatedBy: 'groq',
          },
        });
      } catch (error) {
        // Fall back to deterministic insights below.
      }
    }

    return res.json({
      success: true,
      data: {
        insights: fallbackInsights(context),
        generatedBy: 'fallback',
      },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  insights,
  parseTransaction: parseTransactionRoute,
  test,
};
