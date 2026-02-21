// controllers/user.controller.js
const User = require('../models/User');

const sanitizeUser = (user) => {
    if (!user) return null;
    const safeUser = typeof user.toObject === 'function' ? user.toObject() : { ...user };
    delete safeUser.password;
    delete safeUser.otp;
    delete safeUser.otpExpire;
    delete safeUser.resetPasswordToken;
    delete safeUser.resetPasswordExpire;
    return safeUser;
};

// GET /api/user/profile
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ user: sanitizeUser(user) });
    } catch (error) {
        console.error('GET PROFILE ERROR:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// PUT /api/user/update
exports.updateProfile = async (req, res) => {
    try {
        const { username, phoneNumber, location, about } = req.body;
        const updateData = {
            ...(username !== undefined ? { username } : {}),
            ...(phoneNumber !== undefined ? { phoneNumber } : {}),
            ...(location !== undefined ? { location } : {}),
            ...(about !== undefined ? { about } : {}),
        };

        const updatedUser = await User.findByIdAndUpdate(
            req.userId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedUser) return res.status(404).json({ message: 'User not found' });

        res.json({ message: 'Profile updated successfully', user: sanitizeUser(updatedUser) });
    } catch (error) {
        console.error('UPDATE PROFILE ERROR:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
