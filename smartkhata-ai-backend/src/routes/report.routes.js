const express = require('express');

const { getReportSummary, getReports } = require('../controllers/report.controller');
const protect = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', protect, getReports);
router.get('/summary', protect, getReportSummary);

module.exports = router;
