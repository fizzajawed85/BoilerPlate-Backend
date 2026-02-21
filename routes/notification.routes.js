const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const auth = require('../middleware/auth.middleware');

router.get('/', auth, notificationController.getNotifications);
router.put('/mark-all-read', auth, notificationController.markAllRead);
router.put('/:id/read', auth, notificationController.markAsRead);

module.exports = router;
