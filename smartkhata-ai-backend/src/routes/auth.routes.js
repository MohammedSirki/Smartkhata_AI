const express = require('express');

const { getMe, googleLogin, login, register } = require('../controllers/auth.controller');
const protect = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.get('/me', protect, getMe);

module.exports = router;
