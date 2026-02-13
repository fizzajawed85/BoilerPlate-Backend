// controllers/auth.controller.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require("../utils/sendEmail");

// REGISTER
exports.registerUser = async (req, res) => {
  try {
    console.log(' Registering user:', req.body.email);
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // check user exists
    console.log('🔍 Checking if user exists...');
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log('⚠️ User already exists');
      return res.status(400).json({ message: 'User already exists' });
    }

    // hash password
    console.log('🔐 Hashing password...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // create user
    console.log('🏗️ Creating user in DB...');
    const user = await User.create({
      username,
      email,
      password: hashedPassword
    });

    // generate JWT token
    console.log('🔑 Generating JWT token...');
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ Registration successful');
    res.status(201).json({
      message: "User registered successfully",
      token,
      user,
    });
  } catch (error) {
    console.error('❌ REGISTER ERROR:', error);
    console.error('Error Code:', error.code);
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    console.error('Full Error:', JSON.stringify(error, null, 2));

    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
      });
    }

    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// LOGIN
exports.loginUser = async (req, res) => {
  try {
    console.log('🔑 Login attempt:', req.body.email);
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // find user
    const user = await User.findOne({ email });
    if (!user || !user.password) {
      return res.status(400).json({ message: 'User not found' });
    }

    // compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Wrong password' });
    }

    // generate token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ Login successful');
    res.json({
      message: "Login successful",
      token,
      user,
    });
  } catch (error) {
    console.error('❌ LOGIN ERROR:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// SOCIAL LOGIN
exports.socialLogin = async (req, res) => {
  try {
    const { provider, socialId, username, email } = req.body;

    if (!provider || !socialId || !username || !email) {
      return res.status(400).json({ message: "Missing data for social login" });
    }

    // check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      // create new user
      user = await User.create({
        username,          // username instead of name
        email,
        password: "",      // no password for social login
        socialProvider: provider,
        socialId
      });
    }

    // generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: "Social login successful",
      token,
      user,
    });
  } catch (error) {
    console.error('❌ SOCIAL LOGIN ERROR:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// FORGOT PASSWORD (with OTP)
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    console.log('📧 Forgot password for:', email);

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = otp;
    user.otpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    console.log('📬 Sending email...');
    await sendEmail({
      to: email,
      subject: "Your App Password Reset OTP",
      html: `
        <h2>Password Reset OTP</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>This OTP will expire in 10 minutes.</p>
      `,
    });

    console.log('✅ OTP sent');
    res.json({ message: "OTP sent to your email" });
  } catch (error) {
    console.error('❌ FORGOT PASSWORD ERROR:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// VERIFY OTP
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP required' });

    const user = await User.findOne({
      email,
      otp,
      otpExpire: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired OTP' });

    // OTP verified – generate temporary reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes validity
    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save();

    res.json({ message: 'OTP verified', resetToken });
  } catch (error) {
    console.error('❌ VERIFY OTP ERROR:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// RESET PASSWORD
exports.resetPassword = async (req, res) => {
  try {
    const resetToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: resetToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    // hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // clear reset token
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    // ✅ Send confirmation email
    await sendEmail({
      to: user.email,
      subject: "Password Reset Successful",
      html: `
        <h2>Password Changed Successfully</h2>
        <p>Your account password has been reset.</p>
        <p>If this wasn't you, contact support immediately.</p>
      `,
    });

    res.json({ message: 'Password reset successful, confirmation email sent' });

  } catch (error) {
    console.error('❌ RESET PASSWORD ERROR:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};