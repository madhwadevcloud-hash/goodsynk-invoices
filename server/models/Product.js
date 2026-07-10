const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Product/service name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
      default: 0,
    },
    unit: {
      type: String,
      default: 'pcs', // pcs, hrs, kg, m, etc.
    },
    qty: {
      type: Number,
      default: 1,
    },

    discountType: {
      type: String,
      enum: ['percentage', 'amount'],
      default: 'percentage',
    },

    discountValue: {
      type: Number,
      default: 0,
    },
    // GST rates (Indian tax breakdown)
    cgstRate: { type: Number, default: 0 },  // Central GST %
    sgstRate: { type: Number, default: 0 },  // State GST %
    igstRate: { type: Number, default: 0 },  // Integrated GST %
    hsn: {
      type: String,
      default: '', // HSN/SAC code
    },
    isService: {
      type: Boolean,
      default: false, // true = service (SAC code), false = goods (HSN code)
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
