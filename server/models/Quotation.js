const mongoose = require('mongoose');
const {
  generateShareToken,
} = require('../utils/shareToken');

// ============================================================================
// LINE ITEM SCHEMA
// ============================================================================

const lineItemSchema =
  new mongoose.Schema(
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        default: null,
      },

      name: {
        type: String,
        required: true,
      },

      itemType: {
        type: String,
        enum: [
          'Product',
          'Service',
        ],
        default: 'Product',
      },

      description: {
        type: String,
        default: '',
      },

      hsn: {
        type: String,
        default: '',
      },

      quantity: {
        type: Number,
        required: true,
        min: 0,
        default: 1,
      },

      unit: {
        type: String,
        default: 'pcs',
      },

      price: {
        type: Number,
        required: true,
        min: 0,
      },

      discount: {
        type: Number,
        default: 0,
      },

      vatRate: {
        type: Number,
        default: 0,
      },

      cgstRate: {
        type: Number,
        default: 0,
      },

      sgstRate: {
        type: Number,
        default: 0,
      },

      igstRate: {
        type: Number,
        default: 0,
      },

      taxableAmount: {
        type: Number,
        default: 0,
      },

      cgstAmount: {
        type: Number,
        default: 0,
      },

      sgstAmount: {
        type: Number,
        default: 0,
      },

      igstAmount: {
        type: Number,
        default: 0,
      },

      vatAmount: {
        type: Number,
        default: 0,
      },

      total: {
        type: Number,
        default: 0,
      },
    },
    {
      _id: false,
    }
  );

// ============================================================================
// QUOTATION SCHEMA
// ============================================================================

const quotationSchema =
  new mongoose.Schema(
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },

      client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true,
      },

      quotationNumber: {
        type: String,
        required: true,
        trim: true,
      },

      // Indicates whether the user intentionally
      // selected custom numbering.
      isCustomNumber: {
        type: Boolean,
        default: false,
      },

      status: {
        type: String,
        enum: [
          'draft',
          'sent',
          'accepted',
          'rejected',
          'expired',
        ],
        default: 'draft',
      },

      issueDate: {
        type: Date,
        required: true,
        default: Date.now,
      },

      validUntil: {
        type: Date,
      },

      items: [
        lineItemSchema,
      ],

      subtotal: {
        type: Number,
        default: 0,
      },

      discountAmount: {
        type: Number,
        default: 0,
      },

      cgstTotal: {
        type: Number,
        default: 0,
      },

      sgstTotal: {
        type: Number,
        default: 0,
      },

      igstTotal: {
        type: Number,
        default: 0,
      },

      vatTotal: {
        type: Number,
        default: 0,
      },

      taxTotal: {
        type: Number,
        default: 0,
      },

      total: {
        type: Number,
        default: 0,
      },

      currency: {
        type: String,
        default: 'INR',
      },

      taxType: {
        type: String,
        default: 'gst_india',
      },

      isInterstate: {
        type: Boolean,
        default: false,
      },

      placeOfSupply: {
        type: String,
        default: '',
      },

      roundOff: {
        type: Boolean,
        default: false,
      },

      selectedBankIndex: {
        type: Number,
        default: 0,
      },

      shareToken: {
        type: String,
        default: null,
        index: true,
      },

      notes: {
        type: String,
        default: '',
      },

      termsAndConditions: {
        type: String,
        default: '',
      },

      template: {
        type: String,
        default: 'template1',
      },

      templateColors: {
        type: Object,
        default: null,
      },

      isDeleted: {
        type: Boolean,
        default: false,
      },
    },
    {
      timestamps: true,
    }
  );

// ============================================================================
// UNIQUE ACTIVE QUOTATION NUMBER
// ============================================================================

// This prevents two active quotations belonging to
// the same user from having the same quotation number.
//
// Deleted quotations are excluded from the unique index.
quotationSchema.index(
  {
    user: 1,
    quotationNumber: 1,
  },
  {
    unique: true,

    partialFilterExpression: {
      isDeleted: false,
    },
  }
);

// ============================================================================
// SHARE TOKEN
// ============================================================================

// The controller is responsible for quotation numbering.
// We only generate the share token here.
//
// IMPORTANT:
// There is intentionally NO countDocuments()
// quotation-number generation here.
//
// Numbering is handled by InvoiceSequence in
// quotationController.js.
quotationSchema.pre(
  'validate',
  function (next) {
    try {
      if (!this.shareToken) {
        this.shareToken =
          generateShareToken();
      }

      next();
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// EXPORT
// ============================================================================

module.exports =
  mongoose.model(
    'Quotation',
    quotationSchema
  );
