const mongoose = require('mongoose');
const { generateShareToken } = require('../utils/shareToken');


// ─── Line Item Sub-schema ─────────────────────────────────────────────────────
const lineItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    hsn: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 0, default: 1 },
    unit: { type: String, default: 'pcs' },
    price: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0 },
    vatRate: { type: Number, default: 0 },
    cgstRate: { type: Number, default: 0 },
    sgstRate: { type: Number, default: 0 },
    igstRate: { type: Number, default: 0 },
    taxableAmount: { type: Number, default: 0 },
    cgstAmount: { type: Number, default: 0 },
    sgstAmount: { type: Number, default: 0 },
    igstAmount: { type: Number, default: 0 },
    vatAmount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  { _id: false }
);

// ─── Quotation Schema ─────────────────────────────────────────────────────────
const quotationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    quotationNumber: { type: String, required: true },
    status: {
      type: String,
      enum: ['draft', 'sent', 'accepted', 'rejected', 'expired'],
      default: 'draft',
    },
    issueDate: { type: Date, required: true, default: Date.now },
    validUntil: { type: Date },
    items: [lineItemSchema],

    // Totals
    subtotal: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    cgstTotal: { type: Number, default: 0 },
    sgstTotal: { type: Number, default: 0 },
    igstTotal: { type: Number, default: 0 },
    vatTotal: { type: Number, default: 0 },
    taxTotal: { type: Number, default: 0 },
    total: { type: Number, default: 0 },

    currency: { type: String, default: 'INR' },
    taxType: { type: String, default: 'gst_india' },
    isInterstate: { type: Boolean, default: false },
    placeOfSupply: { type: String, default: '' },

    shareToken: { type: String, default: null, index: true },

    notes: { type: String, default: '' },
    termsAndConditions: { type: String, default: '' },
    template: { type: String, default: 'template1' },
    templateColors: { type: Object, default: null },
  },
  { timestamps: true }
);

// Auto-generate quotation number (QT-0001 style)
// Auto-generate quotation number (QT-0001 style)
quotationSchema.pre('validate', async function (next) {
  if (!this.shareToken) {
    this.shareToken = generateShareToken();
  }
  if (!this.quotationNumber) {
    const count = await this.constructor.countDocuments({ user: this.user });
    this.quotationNumber = `QT-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Quotation', quotationSchema);
