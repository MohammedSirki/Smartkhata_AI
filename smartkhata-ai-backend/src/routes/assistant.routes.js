const express = require('express');

const { chat } = require('../controllers/assistant.controller');
const protect = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/chat', protect, chat);

module.exports = router;
