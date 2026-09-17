const mongoose = require('mongoose');

const invoiceSequenceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // In the current GoodSynk architecture the logged-in User is the
    // business/account owner, so the sequence is isolated per account.
    documentType: {
      type: String,
      enum: ['invoice', 'quotation', 'proforma'],
      required: true,
      default: 'invoice',
    },

    prefix: {
      type: String,
      required: true,
      trim: true,
      default: 'INV-',
    },

    // This is the next number that will be allocated.
    nextNumber: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },

    // Number of digits to keep when formatting the numeric suffix.
    padding: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
      default: 4,
    },
  },
  { timestamps: true }
);

// One sequence per business/account + document type.
invoiceSequenceSchema.index(
  { user: 1, documentType: 1 },
  { unique: true }
);

module.exports = mongoose.model('InvoiceSequence', invoiceSequenceSchema);
