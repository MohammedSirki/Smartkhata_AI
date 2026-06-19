const express = require('express');

const {
  createTransaction,
  deleteTransaction,
  getTransactionById,
  getTransactions,
  undoLastTransaction,
} = require('../controllers/transaction.controller');
const protect = require('../middleware/auth.middleware');

const router = express.Router();

router.route('/').get(protect, getTransactions).post(protect, createTransaction);
router.post('/undo', protect, undoLastTransaction);
router.route('/:id').get(protect, getTransactionById).delete(protect, deleteTransaction);

module.exports = router;
