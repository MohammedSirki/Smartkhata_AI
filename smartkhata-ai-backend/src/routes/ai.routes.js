const express = require('express');

const { insights, parseTransaction, test } = require('../controllers/ai.controller');
const protect = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/test', test);
router.post('/parse-transaction', protect, parseTransaction);
router.get('/insights', protect, insights);

module.exports = router;
