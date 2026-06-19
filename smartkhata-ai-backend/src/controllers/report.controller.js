const { recalculateReports } = require('../services/report-recalculation.service');

const getBusinessId = (user) => user.business?._id || user.business;

const getReports = async (req, res, next) => {
  try {
    const data = await recalculateReports({ userId: req.user._id, businessId: getBusinessId(req.user) });

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return next(error);
  }
};

const getReportSummary = async (req, res, next) => {
  try {
    const data = await recalculateReports({ userId: req.user._id, businessId: getBusinessId(req.user) });

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getReportSummary,
  getReports,
};
