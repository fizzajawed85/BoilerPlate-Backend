const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth.middleware');
const { getProfile, updateProfile } = require('../controllers/user.controller');

router.get('/profile', protect, getProfile);
router.put('/update', protect, updateProfile);

module.exports = router;
