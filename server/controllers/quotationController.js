const Quotation = require('../models/Quotation');
const { upsertProductsFromItems } = require('../utils/productHelper');

// Helper: recalculate totals from items
const calcTotals = (items, isInterstate, taxType = 'gst_india') => {
  let subtotal = 0, cgstTotal = 0, sgstTotal = 0, igstTotal = 0, vatTotal = 0, discountAmount = 0;

  const recalculated = items.map((item) => {
    const lineSubtotal = item.price * item.quantity;
    const discAmt = (lineSubtotal * (item.discount || 0)) / 100;
    const taxableAmount = lineSubtotal - discAmt;

    let cgstAmount = 0, sgstAmount = 0, igstAmount = 0, vatAmount = 0;
    if (taxType === 'vat') {
      vatAmount = (taxableAmount * (item.vatRate || 0)) / 100;
    } else if (taxType === 'gst_india') {
      if (isInterstate) {
        igstAmount = (taxableAmount * (item.igstRate || 0)) / 100;
      } else {
        cgstAmount = (taxableAmount * (item.cgstRate || 0)) / 100;
        sgstAmount = (taxableAmount * (item.sgstRate || 0)) / 100;
      }
    }
    const total = taxableAmount + cgstAmount + sgstAmount + igstAmount + vatAmount;

    subtotal += lineSubtotal;
    discountAmount += discAmt;
    cgstTotal += cgstAmount;
    sgstTotal += sgstAmount;
    igstTotal += igstAmount;
    vatTotal += vatAmount;

    return { ...item, taxableAmount, cgstAmount, sgstAmount, igstAmount, vatAmount, total };
  });

  const taxTotal = cgstTotal + sgstTotal + igstTotal + vatTotal;
  const grandTotal = subtotal - discountAmount + taxTotal;

  return { items: recalculated, subtotal, discountAmount, cgstTotal, sgstTotal, igstTotal, vatTotal, taxTotal, total: grandTotal };
};

// @desc  Get all quotations for logged-in user
// @route GET /api/quotations
const getQuotations = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = { user: req.user._id };
    if (status) filter.status = status;

    const total = await Quotation.countDocuments(filter);
    const quotations = await Quotation.find(filter)
      .populate('client', 'name email phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const mappedQuotations = quotations.map(q => {
      const out = q.toObject();
      out.invoiceNumber = out.quotationNumber;
      out.dueDate = out.validUntil;
      out.invoiceType = 'quotation';
      return out;
    });

    res.json({ success: true, total, page: Number(page), quotations: mappedQuotations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get single quotation
// @route GET /api/quotations/:id
const getQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findOne({ _id: req.params.id, user: req.user._id })
      .populate('client')
      .populate('user', 'name email businessName businessLogo businessSignature address gstin phone bankDetails invoiceTemplate invoiceTemplateColors');
    if (!quotation) return res.status(404).json({ success: false, message: 'Quotation not found' });
    
    // Ensure shareToken exists
    if (!quotation.shareToken) {
      const { generateShareToken } = require('../utils/shareToken');
      quotation.shareToken = generateShareToken();
      await quotation.save();
    }

    const out = quotation.toObject();
    out.invoiceNumber = out.quotationNumber;
    out.dueDate = out.validUntil;
    out.invoiceType = 'quotation';
    res.json({ success: true, invoice: out }); // key kept as 'invoice' for frontend compatibility
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Create quotation
// @route POST /api/quotations
const createQuotation = async (req, res) => {
  try {
    const { items = [], isInterstate = false, taxType = 'gst_india', dueDate, invoiceNumber, invoiceType, ...rest } = req.body;
    const totals = calcTotals(items, isInterstate, taxType);
    const quotation = await Quotation.create({
      ...rest,
      ...totals,
      isInterstate,
      taxType,
      quotationNumber: invoiceNumber || undefined, // reuse invoiceNumber field from form if provided
      validUntil: dueDate || undefined,
      user: req.user._id,
      template: req.body.template || req.user.invoiceTemplate || 'template1',
    });
    
    // Automatically reflect items in products/services database
    await upsertProductsFromItems(req.user._id, items);

    await quotation.populate('client', 'name email phone');
    // Map quotationNumber → invoiceNumber for frontend compatibility
    const out = quotation.toObject();
    out.invoiceNumber = out.quotationNumber;
    out.dueDate = out.validUntil;
    out.invoiceType = 'quotation';
    res.status(201).json({ success: true, invoice: out });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc  Update quotation
// @route PUT /api/quotations/:id
const updateQuotation = async (req, res) => {
  try {
    const { items, isInterstate, taxType, dueDate, invoiceNumber, invoiceType, template, ...rest } = req.body;
    const existing = await Quotation.findOne({ _id: req.params.id, user: req.user._id });
    if (!existing) return res.status(404).json({ success: false, message: 'Quotation not found' });

    const updatedItems = items || existing.items;
    const interstate = isInterstate !== undefined ? isInterstate : existing.isInterstate;
    const type = taxType || existing.taxType;
    const totals = calcTotals(updatedItems, interstate, type);
    // Preserve the stored template unless the user explicitly chose a new one or cleared it
    const resolvedTemplate = (template !== undefined) ? template.toLowerCase() : existing.template;

    const quotation = await Quotation.findByIdAndUpdate(
      req.params.id,
      {
        ...rest,
        ...totals,
        isInterstate: interstate,
        taxType: type,
        template: resolvedTemplate,
        ...(invoiceNumber && { quotationNumber: invoiceNumber }),
        ...(dueDate !== undefined && { validUntil: dueDate }),
      },
      { new: true, runValidators: true }
    ).populate('client', 'name email phone');

    // Automatically reflect items in products/services database
    if (items) {
      await upsertProductsFromItems(req.user._id, items);
    }

    const out = quotation.toObject();
    out.invoiceNumber = out.quotationNumber;
    out.dueDate = out.validUntil;
    out.invoiceType = 'quotation';
    res.json({ success: true, invoice: out });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc  Update quotation status
// @route PATCH /api/quotations/:id/status
const updateQuotationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const quotation = await Quotation.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { status },
      { new: true }
    );
    if (!quotation) return res.status(404).json({ success: false, message: 'Quotation not found' });
    res.json({ success: true, invoice: quotation });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc  Delete quotation
// @route DELETE /api/quotations/:id
const deleteQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!quotation) return res.status(404).json({ success: false, message: 'Quotation not found' });
    res.json({ success: true, message: 'Quotation deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Convert quotation to invoice
// @route POST /api/quotations/:id/convert
const convertToInvoice = async (req, res) => {
  try {
    const quotation = await Quotation.findOne({ _id: req.params.id, user: req.user._id })
      .populate('client');
    if (!quotation) return res.status(404).json({ success: false, message: 'Quotation not found' });

    const Invoice = require('../models/Invoice');

    // Pluck only fields that exist in Invoice's lineItemSchema (avoid strict-mode issues)
    const items = quotation.items.map(item => ({
      product:       item.product || null,
      name:          item.name,
      itemType:      item.itemType || 'Product',
      description:   item.description || '',
      hsn:           item.hsn || '',
      quantity:      item.quantity,
      unit:          item.unit || 'pcs',
      price:         item.price,
      discount:      item.discount || 0,
      vatRate:       item.vatRate || 0,
      cgstRate:      item.cgstRate || 0,
      sgstRate:      item.sgstRate || 0,
      igstRate:      item.igstRate || 0,
      taxableAmount: item.taxableAmount || 0,
      vatAmount:     item.vatAmount || 0,
      cgstAmount:    item.cgstAmount || 0,
      sgstAmount:    item.sgstAmount || 0,
      igstAmount:    item.igstAmount || 0,
      total:         item.total || 0,
    }));

    const invoice = await Invoice.create({
      user:               req.user._id,
      client:             quotation.client._id,
      invoiceType:        'invoice',
      invoiceNumber:      'PENDING', // Bypasses required validator, replaced by pre-save hook
      issueDate:          new Date(),
      dueDate:            quotation.validUntil || undefined,
      isInterstate:       quotation.isInterstate,
      placeOfSupply:      quotation.placeOfSupply,
      currency:           quotation.currency,
      taxType:            quotation.taxType,
      items,
      subtotal:           quotation.subtotal,
      discountAmount:     quotation.discountAmount,
      cgstTotal:          quotation.cgstTotal,
      sgstTotal:          quotation.sgstTotal,
      igstTotal:          quotation.igstTotal,
      vatTotal:           quotation.vatTotal,
      taxTotal:           quotation.taxTotal,
      total:              quotation.total,
      notes:              quotation.notes,
      termsAndConditions: quotation.termsAndConditions,
      template:           quotation.template,
      templateColors:     quotation.templateColors,
      status:             'draft',
    });

    // Automatically reflect items in products/services database
    await upsertProductsFromItems(req.user._id, items);

    // Mark quotation as accepted
    quotation.status = 'accepted';
    await quotation.save();

    res.status(201).json({ success: true, invoiceId: invoice._id, invoiceNumber: invoice.invoiceNumber });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

module.exports = { getQuotations, getQuotation, createQuotation, updateQuotation, updateQuotationStatus, deleteQuotation, convertToInvoice };
