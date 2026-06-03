const getInventory = async (req, res) => {
  return res.json({
    success: true,
    data: [],
  });
};

module.exports = {
  getInventory,
};
