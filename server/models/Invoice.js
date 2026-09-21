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
      trim: true,
    },
    // Stores whether this document was intentionally created with custom numbering.
    isCustomNumber: {
      type: Boolean,
      default: false,
    },
    invoiceType: {
      type: String,
      enum: ['invoice', 'quotation', 'proforma'],
      default: 'invoice',
    },
    status: {
      type: String,
      enum: ['draft', 'pending', 'paid', 'cancelled', 'overdue'],
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
    roundOff: { type: Boolean, default: false },
    selectedBankIndex: { type: Number, default: 0 },

    notes: { type: String, default: '' },
    termsAndConditions: { type: String, default: '' },
    paymentInfo: { type: String, default: '' },

    shareToken: { type: String, default: null, index: true },
    paidAmount: { type: Number, default: 0 },
    paidDate: { type: Date },
    template: { type: String, default: 'template1' },
    templateColors: { type: Object, default: null },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);


// Prevent two active invoices belonging to the same account from using
// the same invoice number. Deleted invoices are excluded from the index.
invoiceSchema.index(
  { user: 1, invoiceNumber: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  }
);

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getDefaultPrefix = (invoiceType) => {
  if (invoiceType === 'quotation') return 'QT';
  if (invoiceType === 'proforma') return 'PI';
  return 'INV';
};

const getNextNumberForPrefix = async (model, userId, invoiceType, prefix, padLength = 4) => {
  const regex = new RegExp(`^${escapeRegex(prefix)}-(\\d+)$`);

  const latest = await model
    .findOne({
      user: userId,
      invoiceType,
      isDeleted: { $ne: true },
      invoiceNumber: { $regex: regex },
    })
    .sort({ createdAt: -1 })
    .select('invoiceNumber');

  const match = latest?.invoiceNumber?.match(regex);
  const lastNumber = match ? Number(match[1]) : 0;

  return `${prefix}-${String(lastNumber + 1).padStart(padLength, '0')}`;
};

// Auto-generate a number when the controller intentionally leaves it blank.
invoiceSchema.pre('validate', async function (next) {
  try {
    if (!this.shareToken) {
      this.shareToken = generateShareToken();
    }

    if (!this.invoiceNumber || this.invoiceNumber === 'PENDING') {
      const prefix = getDefaultPrefix(this.invoiceType);
      this.invoiceNumber = await getNextNumberForPrefix(
        this.constructor,
        this.user,
        this.invoiceType,
        prefix,
        4
      );
    }

    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Invoice', invoiceSchema);
