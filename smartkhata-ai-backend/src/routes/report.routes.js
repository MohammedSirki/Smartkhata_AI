const express = require('express');

const { getReports } = require('../controllers/report.controller');
const protect = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', protect, getReports);

module.exports = router;
