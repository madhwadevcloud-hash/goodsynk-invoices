const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { PLAN_LIMITS } = require('../utils/planLimits');

// Helper: generate JWT
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '30d' });

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password, businessName } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({ name, email, password, businessName });
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        businessName: user.businessName,
        currency: user.currency,
        plan: user.plan,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Entered email ID is not registered' });
    }
    if (!(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Incorrect password' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        businessName: user.businessName,
        businessLogo: user.businessLogo,
        businessSignature: user.businessSignature,
        address: user.address,
        phone: user.phone,
        gstin: user.gstin,
        currency: user.currency,
        bankDetails: user.bankDetails,
        bankAccounts: user.bankAccounts,
        plan: user.plan,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// @desc    Update user profile
// @route   PUT /api/auth/me
// @access  Private
const normalizeBankAccounts = (bankAccounts = []) => {
  let primaryIndex = -1;
  for (let i = 0; i < bankAccounts.length; i++) {
    if (bankAccounts[i]?.isPrimary) {
      primaryIndex = i;
    }
  }
  return bankAccounts.map((bank, index) => ({
    label: bank?.label || (index === 0 ? 'Primary' : `Bank ${index + 1}`),
    bankName: bank?.bankName || '',
    accountName: bank?.accountName || '',
    accountNumber: bank?.accountNumber || '',
    ifscCode: bank?.ifscCode || '',
    swiftCode: bank?.swiftCode || '',
    branch: bank?.branch || '',
    isPrimary: primaryIndex >= 0 ? index === primaryIndex : index === 0,
  }));
};

const updateMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const simpleFields = [
      'name',
      'businessName',
      'businessLogo',
      'businessSignature',
      'address',
      'phone',
      'gstin',
      'currency',
      'invoiceTemplate',
      'invoiceTemplateColors',
    ];

    simpleFields.forEach((field) => {
      if (req.body[field] !== undefined) user[field] = req.body[field];
    });

    if (Array.isArray(req.body.bankAccounts)) {
      const normalizedBanks = normalizeBankAccounts(req.body.bankAccounts);
      user.bankAccounts = normalizedBanks;

      const primaryBank = normalizedBanks.find((bank) => bank.isPrimary) || normalizedBanks[0];
      user.bankDetails = primaryBank || {
        bankName: '',
        accountName: '',
        accountNumber: '',
        ifscCode: '',
        swiftCode: '',
        branch: '',
      };
    } else if (req.body.bankDetails !== undefined) {
      user.bankDetails = req.body.bankDetails;

      // Backward compatibility: when only the legacy bankDetails object is sent,
      // seed bankAccounts if the user does not already have multiple accounts.
      if (!Array.isArray(user.bankAccounts) || user.bankAccounts.length === 0) {
        const legacy = req.body.bankDetails || {};
        if (legacy.bankName || legacy.accountName || legacy.accountNumber || legacy.ifscCode) {
          user.bankAccounts = [{
            label: 'Primary',
            bankName: legacy.bankName || '',
            accountName: legacy.accountName || '',
            accountNumber: legacy.accountNumber || '',
            ifscCode: legacy.ifscCode || '',
            swiftCode: legacy.swiftCode || '',
            branch: legacy.branch || '',
            isPrimary: true,
          }];
        }
      }
    }

    const updatedUser = await user.save();
    res.json({ success: true, user: updatedUser });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.matchPassword(currentPassword))) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    const token = generateToken(user._id);
    res.json({ success: true, message: 'Password updated successfully', token });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete own account
// @route   DELETE /api/auth/me
// @access  Private
const deleteMe = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Google login / register
// @route   POST /api/auth/google
// @access  Public
const googleLogin = async (req, res) => {
  try {
    const { name, email, googleId } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    let user = await User.findOne({ email });

    if (!user) {
      // Create new user if they don't exist
      user = await User.create({
        name: name || 'Google User',
        email,
        password: googleId || Math.random().toString(36).slice(-8), // Dummy password since they use Google
      });
    }

    const token = generateToken(user._id);
    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        businessName: user.businessName,
        businessLogo: user.businessLogo,
        businessSignature: user.businessSignature,
        address: user.address,
        phone: user.phone,
        gstin: user.gstin,
        currency: user.currency,
        bankDetails: user.bankDetails,
        bankAccounts: user.bankAccounts,
        plan: user.plan,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Upgrade / change subscription plan
// @route   PUT /api/auth/upgrade-plan
// @access  Private
const upgradePlan = async (req, res) => {
  try {
    const { plan } = req.body;

    if (!plan || !Object.keys(PLAN_LIMITS).includes(plan)) {
      return res.status(400).json({ success: false, message: 'Invalid plan selected' });
    }

    if (req.user.plan === plan) {
      return res.status(400).json({ success: false, message: `You are already on the ${plan} plan` });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { plan, planUpdatedAt: new Date() },
      { new: true }
    );

    res.json({ success: true, message: `Upgraded to ${plan} plan`, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { register, login, getMe, updateMe, changePassword, deleteMe, googleLogin, upgradePlan };