const getReports = async (req, res) => {
  return res.json({
    success: true,
    data: {
      daily: {
        revenue: 0,
        expenses: 0,
        profit: 0,
        transactionCount: 0,
      },
      weekly: {
        revenue: 0,
        expenses: 0,
        profit: 0,
        transactionCount: 0,
      },
      monthly: {
        revenue: 0,
        expenses: 0,
        profit: 0,
        transactionCount: 0,
      },
      yearly: {
        revenue: 0,
        expenses: 0,
        profit: 0,
        transactionCount: 0,
      },
    },
  });
};

module.exports = {
  getReports,
};
