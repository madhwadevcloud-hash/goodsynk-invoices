const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User');

const PLANS_PRICING = {
  free: { price: 0, name: 'Free Trial' },
  growth: { price: 199, name: 'Growth Monthly' },
  growth_yearly: { price: 2388, name: 'Growth Yearly' },
  enterprise: { price: 1000, name: 'Enterprise Monthly' },
  enterprise_yearly: { price: 12000, name: 'Enterprise Yearly' },
};

// Initialize Razorpay client. Securely handles missing key ID/Secret keys gracefully.
const getRazorpayInstance = () => {
  const key_id = (process.env.RAZORPAY_KEY_ID || '').trim();
  const key_secret = (process.env.RAZORPAY_KEY_SECRET || '').trim();

  if (!key_id || !key_secret) {
    throw new Error('Razorpay credentials are not configured in environment variables (.env). Please contact your administrator.');
  }

  return new Razorpay({ key_id, key_secret });
};

// @desc    Create Razorpay order for subscription plan upgrade
// @route   POST /api/payment/create-order
// @access  Private
const createOrder = async (req, res) => {
  try {
    const { planId } = req.body;

    if (!planId || !PLANS_PRICING[planId]) {
      return res.status(400).json({ success: false, message: 'Invalid plan ID selected' });
    }

    if (planId === 'free') {
      return res.status(400).json({ success: false, message: 'Free plan does not require a payment flow' });
    }

    const selectedPlan = PLANS_PRICING[planId];
    const amount = selectedPlan.price * 100; // Razorpay expects amount in paise

    const razorpay = getRazorpayInstance();
    const options = {
      amount,
      currency: 'INR',
      receipt: `r_${planId.slice(0, 10)}_${req.user._id}`.slice(0, 40),
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      planName: selectedPlan.name,
    });
  } catch (err) {
    console.error('Razorpay Create Order Error:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to create payment order', error: err, stack: err.stack });
  }
};

// @desc    Verify payment signature and upgrade user plan
// @route   POST /api/payment/verify-payment
// @access  Private
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, planId } = req.body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !planId) {
      return res.status(400).json({ success: false, message: 'Missing required payment verification fields' });
    }

    // Verify HMAC-SHA256 signature
    const key_secret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
    if (!key_secret) {
      return res.status(500).json({ success: false, message: 'Razorpay secret key not configured' });
    }

    const shasum = crypto.createHmac('sha256', key_secret);
    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = shasum.digest('hex');

    if (digest !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed: Invalid signature' });
    }

    // Upgrade the user subscription plan
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { plan: planId, planUpdatedAt: new Date() },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User profile not found' });
    }

    res.json({
      success: true,
      message: `Upgraded to ${planId} plan successfully!`,
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
    console.error('Razorpay Payment Verification Error:', err.message);
    res.status(500).json({ success: false, message: err.message || 'Failed to verify payment' });
  }
};

module.exports = { createOrder, verifyPayment };
