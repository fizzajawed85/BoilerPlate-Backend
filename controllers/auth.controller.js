const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

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

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  return process.env.JWT_SECRET;
};

const signAuthToken = (userId) => jwt.sign({ id: userId }, getJwtSecret(), { expiresIn: '7d' });

// REGISTER
exports.registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    const token = signAuthToken(user._id);
    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error('REGISTER ERROR:', error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'Field';
      return res.status(400).json({
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
      });
    }

    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// LOGIN
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user || !user.password) {
      return res.status(400).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Wrong password' });
    }

    const token = signAuthToken(user._id);
    return res.json({
      message: 'Login successful',
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error('LOGIN ERROR:', error);
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// SOCIAL LOGIN
exports.socialLogin = async (req, res) => {
  try {
    const { provider, socialId, username, email } = req.body;
    if (!provider || !socialId || !username || !email) {
      return res.status(400).json({ message: 'Missing data for social login' });
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        username,
        email,
        password: '',
        socialProvider: provider,
        socialId,
      });
    }

    const token = signAuthToken(user._id);
    return res.json({
      message: 'Social login successful',
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error('SOCIAL LOGIN ERROR:', error);
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// FORGOT PASSWORD (with OTP)
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpire = Date.now() + 10 * 60 * 1000;
    await user.save();

    await sendEmail({
      to: email,
      subject: 'Your App Password Reset OTP',
      html: `
        <h2>Password Reset OTP</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>This OTP will expire in 10 minutes.</p>
      `,
    });

    return res.json({ message: 'OTP sent to your email' });
  } catch (error) {
    console.error('FORGOT PASSWORD ERROR:', error);
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// VERIFY OTP
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP required' });
    }

    const user = await User.findOne({
      email,
      otp,
      otpExpire: { $gt: Date.now() },
    });
    if (!user) return res.status(400).json({ message: 'Invalid or expired OTP' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save();

    return res.json({ message: 'OTP verified', resetToken });
  } catch (error) {
    console.error('VERIFY OTP ERROR:', error);
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// RESET PASSWORD
exports.resetPassword = async (req, res) => {
  try {
    const resetToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: resetToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    await sendEmail({
      to: user.email,
      subject: 'Password Reset Successful',
      html: `
        <h2>Password Changed Successfully</h2>
        <p>Your account password has been reset.</p>
        <p>If this was not you, contact support immediately.</p>
      `,
    });

    return res.json({ message: 'Password reset successful, confirmation email sent' });
  } catch (error) {
    console.error('RESET PASSWORD ERROR:', error);
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
