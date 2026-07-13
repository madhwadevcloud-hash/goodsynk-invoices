const mongoose = require('mongoose');
const { generateShareToken } = require('../utils/shareToken');


// ─── Line Item Sub-schema ─────────────────────────────────────────────────────
const lineItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
    },
    name: { type: String, required: true },
    itemType: { type: String, enum: ['Product', 'Service'], default: 'Product' },
    description: { type: String, default: '' },
    hsn: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 0, default: 1 },
    unit: { type: String, default: 'pcs' },
    price: { type: Number, required: true, min: 0 }, // unit price
    discount: { type: Number, default: 0 },           // % discount on line
    vatRate: { type: Number, default: 0 },
    cgstRate: { type: Number, default: 0 },
    sgstRate: { type: Number, default: 0 },
    igstRate: { type: Number, default: 0 },
    // Computed fields
    taxableAmount: { type: Number, default: 0 },
    cgstAmount: { type: Number, default: 0 },
    sgstAmount: { type: Number, default: 0 },
    igstAmount: { type: Number, default: 0 },
    vatAmount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  { _id: false }
);

// ─── Invoice Schema ───────────────────────────────────────────────────────────
const invoiceSchema = new mongoose.Schema(
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
    invoiceNumber: {
      type: String,
      required: true,
    },
    invoiceType: {
      type: String,
      enum: ['invoice', 'quotation', 'proforma'],
      default: 'invoice',
    },
    status: {
      type: String,
      enum: ['draft', 'sent', 'paid', 'cancelled', 'overdue'],
      default: 'draft',
    },
    issueDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    dueDate: {
      type: Date,
    },
    items: [lineItemSchema],

    // Summary totals
    subtotal: { type: Number, default: 0 },       // before tax
    discountAmount: { type: Number, default: 0 },  // total discount
    cgstTotal: { type: Number, default: 0 },
    sgstTotal: { type: Number, default: 0 },
    igstTotal: { type: Number, default: 0 },
    vatTotal: { type: Number, default: 0 },
    taxTotal: { type: Number, default: 0 },        // sum of all taxes
    total: { type: Number, default: 0 },           // grand total

    currency: { type: String, default: 'INR' },
    taxType: { type: String, default: 'gst_india' },
    isInterstate: { type: Boolean, default: false }, // if true, use IGST
    placeOfSupply: { type: String, default: '' },
    roundOff: { type: Boolean, default: false },
    selectedBankIndex: { type: Number, default: 0 },

    notes: { type: String, default: '' },
    termsAndConditions: { type: String, default: '' },
    paymentInfo: { type: String, default: '' },

    shareToken: { type: String, default: null, index: true },
    // Payment tracking
    paidAmount: { type: Number, default: 0 },
    paidDate: { type: Date },
    template: { type: String, default: 'template1' },
    templateColors: { type: Object, default: null },
  },
  { timestamps: true }
);


// Auto-generate invoice number if not set (INV-0001 style)
invoiceSchema.pre('validate', async function (next) {
  if (!this.shareToken) {
    this.shareToken = generateShareToken();
  }
  if (!this.invoiceNumber || this.invoiceNumber === 'PENDING') {
    const count = await this.constructor.countDocuments({ user: this.user });
    const prefix = this.invoiceType === 'quotation' ? 'QT' : this.invoiceType === 'proforma' ? 'PI' : 'INV';
    this.invoiceNumber = `${prefix}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);
