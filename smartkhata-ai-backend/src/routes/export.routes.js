const express = require('express');

const { exportInventory, exportReports, exportTransactions } = require('../controllers/export.controller');
const protect = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/transactions', protect, exportTransactions);
router.get('/inventory', protect, exportInventory);
router.get('/reports', protect, exportReports);

module.exports = router;
