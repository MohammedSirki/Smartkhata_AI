const express = require('express');

const {
  createInventoryItem,
  deleteInventoryItem,
  getInventory,
  updateInventoryItem,
} = require('../controllers/inventory.controller');
const protect = require('../middleware/auth.middleware');

const router = express.Router();

router.route('/').get(protect, getInventory).post(protect, createInventoryItem);
router.route('/:id').put(protect, updateInventoryItem).delete(protect, deleteInventoryItem);

module.exports = router;
