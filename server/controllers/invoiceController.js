const Invoice = require('../models/Invoice');
const { upsertProductsFromItems } = require('../utils/productHelper');
const Quotation = require('../models/Quotation');
const { getLimits } = require('../utils/planLimits');

// Helper: recalculate invoice totals from items
const calcTotals = (items, isInterstate) => {
  let subtotal = 0, cgstTotal = 0, sgstTotal = 0, igstTotal = 0, discountAmount = 0;

  const recalculated = items.map((item) => {
    const lineSubtotal = item.price * item.quantity;
    const discAmt = (lineSubtotal * (item.discount || 0)) / 100;
    const taxableAmount = lineSubtotal - discAmt;

    let cgstAmount = 0, sgstAmount = 0, igstAmount = 0;
    if (isInterstate) {
      igstAmount = (taxableAmount * (item.igstRate || 0)) / 100;
    } else {
      cgstAmount = (taxableAmount * (item.cgstRate || 0)) / 100;
      sgstAmount = (taxableAmount * (item.sgstRate || 0)) / 100;
    }
    const total = taxableAmount + cgstAmount + sgstAmount + igstAmount;

    subtotal += lineSubtotal;
    discountAmount += discAmt;
    cgstTotal += cgstAmount;
    sgstTotal += sgstAmount;
    igstTotal += igstAmount;

    return { ...item, taxableAmount, cgstAmount, sgstAmount, igstAmount, total };
  });

  const taxTotal = cgstTotal + sgstTotal + igstTotal;
  const grandTotal = subtotal - discountAmount + taxTotal;

  return { items: recalculated, subtotal, discountAmount, cgstTotal, sgstTotal, igstTotal, taxTotal, total: grandTotal };
};
const getUsage = async (req, res) => {
  try {
    const Client = require('../models/Client');
    const userId = req.user._id;
    const limits = getLimits(req.user.plan);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [clientCount, invoiceCount, quotationCount] = await Promise.all([
      Client.countDocuments({ user: userId, createdAt: { $gte: startOfMonth } }),
      Invoice.countDocuments({ user: userId, createdAt: { $gte: startOfMonth } }),
      Quotation.countDocuments({ user: userId, createdAt: { $gte: startOfMonth } }),
    ]);

    res.json({
      success: true,
      usage: {
        plan: req.user.plan,
        clients: clientCount,
        clientsLimit: limits.clients,
        documentsThisMonth: invoiceCount + quotationCount,
        documentsLimit: limits.invoicesPerMonth,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// @desc    Get all invoices for logged-in user
// @route   GET /api/invoices
// @access  Private
const getInvoices = async (req, res) => {
  try {
    const { status, invoiceType, page = 1, limit = 20 } = req.query;
    const filter = { user: req.user._id, isDeleted: { $ne: true } };
    if (status) filter.status = status;
    if (invoiceType) filter.invoiceType = invoiceType;

    const total = await Invoice.countDocuments(filter);
    const invoices = await Invoice.find(filter)
      .populate('client', 'name email phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, page: Number(page), invoices });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get single invoice
// @route   GET /api/invoices/:id
// @access  Private
const getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, user: req.user._id, isDeleted: { $ne: true } })
      .populate('client')
      .populate('user', 'name email businessName businessLogo businessSignature address gstin phone bankDetails invoiceTemplate invoiceTemplateColors');
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    // Ensure shareToken exists
    if (!invoice.shareToken) {
      const { generateShareToken } = require('../utils/shareToken');
      invoice.shareToken = generateShareToken();
      await invoice.save();
    }

    res.json({ success: true, invoice });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create invoice
// @route   POST /api/invoices
// @access  Private
const createInvoice = async (req, res) => {
  try {
    const limits = getLimits(req.user.plan);

    if (limits.documentsPerMonth !== Infinity) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [invoiceCount, quotationCount] = await Promise.all([
        Invoice.countDocuments({ user: req.user._id, createdAt: { $gte: startOfMonth } }),
        Quotation.countDocuments({ user: req.user._id, createdAt: { $gte: startOfMonth } }),
      ]);

      const totalDocs = invoiceCount + quotationCount;
      if (totalDocs >= limits.documentsPerMonth) {
        return res.status(403).json({
          success: false,
          code: 'PLAN_LIMIT_DOCUMENTS',
          message: `You have reached your plan limit of ${limits.documentsPerMonth} invoices & quotations per month. Please upgrade to create more.`,
          limitReached: true,
        });
      }
    }

    const { items = [], isInterstate = false, ...rest } = req.body;
    const totals = calcTotals(items, isInterstate);
    const invoice = await Invoice.create({ ...rest, ...totals, isInterstate, user: req.user._id, template: req.body.template || req.user.invoiceTemplate || 'template1' });

    // Automatically reflect items in products/services database
    await upsertProductsFromItems(req.user._id, items);

    await invoice.populate('client', 'name email phone');
    res.status(201).json({ success: true, invoice });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};


// @desc    Update invoice
// @route   PUT /api/invoices/:id
// @access  Private
const updateInvoice = async (req, res) => {
  try {
    const { items, isInterstate, template, ...rest } = req.body;
    const existing = await Invoice.findOne({ _id: req.params.id, user: req.user._id, isDeleted: { $ne: true } });
    if (!existing) return res.status(404).json({ success: false, message: 'Invoice not found' });

    const updatedItems = items || existing.items;
    const interstate = isInterstate !== undefined ? isInterstate : existing.isInterstate;
    const totals = calcTotals(updatedItems, interstate);
    // Preserve the stored template unless the user explicitly chose a new one or cleared it
    const resolvedTemplate = (template !== undefined) ? template.toLowerCase() : existing.template;

    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id, isDeleted: { $ne: true } },
      { ...rest, ...totals, isInterstate: interstate, template: resolvedTemplate },
      { new: true, runValidators: true }
    ).populate('client', 'name email phone');

    // Automatically reflect items in products/services database
    if (items) {
      await upsertProductsFromItems(req.user._id, items);
    }

    res.json({ success: true, invoice });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Update invoice status
// @route   PATCH /api/invoices/:id/status
// @access  Private
const updateInvoiceStatus = async (req, res) => {
  try {
    const { status, paidAmount, paidDate } = req.body;
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id, isDeleted: { $ne: true } },
      { status, ...(paidAmount !== undefined && { paidAmount }), ...(paidDate && { paidDate }) },
      { new: true }
    );
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, invoice });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Delete invoice
// @route   DELETE /api/invoices/:id
// @access  Private
const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id, isDeleted: { $ne: true } },
      { isDeleted: true },
      { new: true }
    );
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, message: 'Invoice deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Dashboard summary stats
// @route   GET /api/invoices/stats
// @access  Private
const getStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const [totalInvoices, paidCount, sentCount, draftCount, overdue] = await Promise.all([
      Invoice.countDocuments({ user: userId, isDeleted: { $ne: true } }),
      Invoice.countDocuments({ user: userId, status: 'paid', isDeleted: { $ne: true } }),
      Invoice.countDocuments({ user: userId, status: 'sent', isDeleted: { $ne: true } }),
      Invoice.countDocuments({ user: userId, status: 'draft', isDeleted: { $ne: true } }),
      Invoice.countDocuments({ user: userId, status: 'overdue', isDeleted: { $ne: true } }),
    ]);

    const revenueAgg = await Invoice.aggregate([
      { $match: { user: userId, status: 'paid', isDeleted: { $ne: true } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);
    const outstandingAgg = await Invoice.aggregate([
      { $match: { user: userId, status: { $in: ['sent', 'overdue'] }, isDeleted: { $ne: true } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);

    res.json({
      success: true,
      stats: {
        totalInvoices,
        paidCount,
        sentCount,
        draftCount,
        overdue,
        totalRevenue: revenueAgg[0]?.total || 0,
        outstanding: outstandingAgg[0]?.total || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getInvoices, getInvoice, createInvoice, updateInvoice, updateInvoiceStatus, deleteInvoice, getStats, getUsage };
