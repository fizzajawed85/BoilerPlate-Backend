const Notification = require('../models/Notification');

exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.userId });
        // Sort by date descending
        notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.status(200).json(notifications);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) return res.status(404).json({ message: 'Notification not found' });

        if (notification.userId !== req.userId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        notification.read = true;
        await Notification.update(req.params.id, notification);
        res.status(200).json(notification);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.markAllRead = async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.userId, read: false });
        for (let n of notifications) {
            n.read = true;
            await Notification.update(n.id, n);
        }
        res.status(200).json({ message: 'All notifications marked as read' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createNotification = async (userId, title, message, type) => {
    try {
        return await Notification.create({
            userId,
            title,
            message,
            type, // 'appointment', 'record', 'general'
            read: false,
            createdAt: new Date().toISOString()
        });
    } catch (err) {
        console.error('Error creating notification:', err.message);
    }
};
