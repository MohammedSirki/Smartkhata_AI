const getDashboard = async (req, res) => {
  return res.json({
    success: true,
    data: {
      revenue: 0,
      expenses: 0,
      profit: 0,
      inventoryHealth: 100,
      recentTransactions: [],
      insights: [
        'Backend foundation is connected.',
        'Record transactions to generate live dashboard metrics.',
      ],
    },
  });
};

module.exports = {
  getDashboard,
};
