const express = require('express');

const { createTransaction, getTransactions } = require('../controllers/transaction.controller');
const protect = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', protect, getTransactions);
router.post('/', protect, createTransaction);

module.exports = router;
