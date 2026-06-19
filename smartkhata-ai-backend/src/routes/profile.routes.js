const express = require('express');

const { getProfile, updateProfile } = require('../controllers/profile.controller');
const protect = require('../middleware/auth.middleware');

const router = express.Router();

router.route('/').get(protect, getProfile).put(protect, updateProfile);

module.exports = router;
