const express = require('express');

const { getInventory } = require('../controllers/inventory.controller');
const protect = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', protect, getInventory);

module.exports = router;
