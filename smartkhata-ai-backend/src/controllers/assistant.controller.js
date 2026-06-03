const chat = async (req, res) => {
  const { message } = req.body;

  return res.json({
    success: true,
    response: message
      ? `SmartKhata AI received: "${message}". Backend AI context will be connected in the next phase.`
      : 'Ask me about profit, expenses, inventory, reports, or sales.',
  });
};

module.exports = {
  chat,
};
