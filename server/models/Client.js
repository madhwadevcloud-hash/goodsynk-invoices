const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema(
  {
    // ─────────────────────────────────────────────────────────────
    // User
    // ─────────────────────────────────────────────────────────────
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // ─────────────────────────────────────────────────────────────
    // Basic Information
    // ─────────────────────────────────────────────────────────────
    name: {
      type: String,
      required: [true, 'Client name is required'],
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },

    phone: {
      type: String,
      default: '',
    },

    gstin: {
      type: String,
      default: '',
    },

    pan: {
      type: String,
      default: '',
    },

    // ─────────────────────────────────────────────────────────────
    // Address
    // ─────────────────────────────────────────────────────────────
    address: {
      street: {
        type: String,
        default: '',
      },

      city: {
        type: String,
        default: '',
      },

      state: {
        type: String,
        default: '',
      },

      pincode: {
        type: String,
        default: '',
      },

      country: {
        type: String,
        default: 'India',
      },
    },

    // ─────────────────────────────────────────────────────────────
    // Currency
    // ─────────────────────────────────────────────────────────────
    currency: {
      type: String,
      default: 'INR',
    },

    // ─────────────────────────────────────────────────────────────
    // Notes
    // ─────────────────────────────────────────────────────────────
    notes: {
      type: String,
      default: '',
    },

    // ─────────────────────────────────────────────────────────────
    // Special / Kind Attention
    // ─────────────────────────────────────────────────────────────
    specialAttention: {
      enabled: {
        type: Boolean,
        default: false,
      },

      label: {
        type: String,
        enum: [
          'Kind Attention',
          'Special Attention',
        ],
        default: 'Kind Attention',
      },

      value: {
        type: String,
        trim: true,
        maxlength: [
          150,
          'Special attention cannot exceed 150 characters',
        ],
        default: '',
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  'Client',
  clientSchema
);
