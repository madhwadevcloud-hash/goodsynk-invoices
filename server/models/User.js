const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const bankAccountSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, default: 'Primary' },
    bankName: { type: String, trim: true, default: '' },
    accountName: { type: String, trim: true, default: '' },
    accountNumber: { type: String, trim: true, default: '' },
    ifscCode: { type: String, trim: true, default: '' },
    swiftCode: { type: String, trim: true, default: '' },
    branch: { type: String, trim: true, default: '' },
    isPrimary: { type: Boolean, default: false },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    businessName: {
      type: String,
      trim: true,
      default: '',
    },
    businessLogo: {
      type: String,
      default: '',
    },
    businessSignature: {
      type: String,
      default: '',
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      pincode: { type: String, default: '' },
      country: { type: String, default: 'India' },
    },
    phone: {
      type: String,
      default: '',
    },
    gstin: {
      type: String,
      default: '',
    },
    currency: {
      type: String,
      default: 'INR',
    },
    // Backward-compatible single primary bank object. Existing PDF/template code can keep using this.
    bankDetails: {
      bankName: { type: String, default: '' },
      accountName: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      ifscCode: { type: String, default: '' },
      swiftCode: { type: String, default: '' },
      branch: { type: String, default: '' },
    },
    // New multi-bank storage. The first/isPrimary account is mirrored into bankDetails.
    bankAccounts: {
      type: [bankAccountSchema],
      default: [],
    },
    invoiceTemplate: {
      type: String,
      default: 'template1',
    },
    invoiceTemplateColors: {
      type: Object,
      default: null,
    },
    plan: {
      type: String,
      enum: ['free', 'growth', 'enterprise'],
      default: 'free',
    },
    planUpdatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);


// Keep the legacy bankDetails object synced with the primary bank account.
userSchema.pre('save', function (next) {
  if (Array.isArray(this.bankAccounts) && this.bankAccounts.length) {
    let primaryIndex = -1;
    for (let i = 0; i < this.bankAccounts.length; i++) {
      if (this.bankAccounts[i].isPrimary) {
        primaryIndex = i;
      }
    }
    const primary = this.bankAccounts[primaryIndex >= 0 ? primaryIndex : 0];
    this.bankAccounts = this.bankAccounts.map((bank, index) => ({
      ...(typeof bank.toObject === 'function' ? bank.toObject() : bank),
      isPrimary: primaryIndex >= 0 ? index === primaryIndex : index === 0,
    }));
    this.bankDetails = {
      bankName: primary.bankName || '',
      accountName: primary.accountName || '',
      accountNumber: primary.accountNumber || '',
      ifscCode: primary.ifscCode || '',
      swiftCode: primary.swiftCode || '',
      branch: primary.branch || '',
    };
  }
  next();
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
