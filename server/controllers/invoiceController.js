const Invoice = require('../models/Invoice');
const Quotation = require('../models/Quotation');
const { upsertProductsFromItems } = require('../utils/productHelper');
const { getLimits } = require('../utils/planLimits');
const InvoiceSequence = require('../models/InvoiceSequence');

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

// ─── Database-backed document-number helpers ────────────────────────────────────

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const splitNumber = (value) => {
  const input = String(value || '').trim();
  const match = input.match(/^(.*?)(\d+)$/);

  if (!match) {
    return {
      prefix: input,
      number: null,
      width: 0,
    };
  }

  return {
    prefix: match[1],
    number: Number(match[2]),
    width: match[2].length,
  };
};

const getDefaultPrefix = (invoiceType) => {
  if (invoiceType === 'quotation') return 'QT-';
  if (invoiceType === 'proforma') return 'PI-';
  return 'INV-';
};

const formatSequenceNumber = (prefix, number, padding = 4) =>
  `${prefix}${String(number).padStart(padding, '0')}`;

const findHighestExistingNumber = async (userId, invoiceType, prefix) => {
  const regex = new RegExp(`^${escapeRegex(prefix)}(\\d+)$`);

  // Do not rely on createdAt ordering here. The highest numeric suffix is
  // the real source of truth when older invoices already exist.
  const invoices = await Invoice.find({
    user: userId,
    invoiceType,
    isDeleted: false,
    invoiceNumber: { $regex: regex },
  })
    .select('invoiceNumber')
    .lean();

  let highest = 0;

  for (const invoice of invoices) {
    const match = String(invoice?.invoiceNumber || '').match(regex);
    if (match) {
      highest = Math.max(highest, Number(match[1]));
    }
  }

  return highest;
};

// Read-only preview. This NEVER increments the sequence.
const getPreviewNextInvoiceNumber = async (userId, invoiceType = 'invoice') => {
  const prefix = getDefaultPrefix(invoiceType);
  const [sequence, highestExisting] = await Promise.all([
    InvoiceSequence.findOne({
      user: userId,
      documentType: invoiceType,
    }).lean(),
    findHighestExistingNumber(userId, invoiceType, prefix),
  ]);

  // The preview must NEVER show a number that has already been used.
  // If the sequence document is behind existing invoices, advance the
  // sequence preview to highestExisting + 1.
  const sequenceNext = sequence?.nextNumber || 1;
  const nextNumber = Math.max(sequenceNext, highestExisting + 1);
  const effectivePrefix = sequence?.prefix || prefix;
  const effectivePadding = sequence?.padding || 4;

  return formatSequenceNumber(
    effectivePrefix,
    nextNumber,
    effectivePadding
  );
};

// Atomically allocate the next number from MongoDB.
// The returned number is the value BEFORE $inc, so each request gets a
// different number even if two users/accounts save at the same time.
const allocateAutomaticInvoiceNumber = async (userId, invoiceType = 'invoice') => {
  const defaultPrefix = getDefaultPrefix(invoiceType);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const sequence = await InvoiceSequence.findOne({
      user: userId,
      documentType: invoiceType,
    }).lean();

    const prefix = sequence?.prefix || defaultPrefix;
    const padding = sequence?.padding || 4;
    const highestExisting = await findHighestExistingNumber(
      userId,
      invoiceType,
      prefix
    );

    const minimumNextNumber = highestExisting + 1;

    if (sequence) {
      // Synchronize the DB sequence with existing invoices BEFORE allocating.
      // This is the key fix for the OO-008 -> OO-009 mismatch: if OO-008
      // already exists while the sequence still says 8, allocation starts at 9.
      // $max establishes the minimum safe value, then $inc atomically reserves
      // the returned value for this save operation.
      const previous = await InvoiceSequence.findOneAndUpdate(
        {
          _id: sequence._id,
          user: userId,
          documentType: invoiceType,
        },
        [
          {
            $set: {
              // MongoDB update pipeline: first choose the larger of the
              // persisted sequence and highestExisting + 1, then increment
              // that value by one. The old value is returned below.
              nextNumber: {
                $add: [
                  { $max: ['$nextNumber', minimumNextNumber] },
                  1,
                ],
              },
            },
          },
        ],
        { new: false }
      ).lean();

      if (previous) {
        const allocatedNumber = Math.max(
          previous.nextNumber,
          minimumNextNumber
        );

        // Keep the stored prefix/padding already associated with this sequence.
        return formatSequenceNumber(
          previous.prefix || prefix,
          allocatedNumber,
          previous.padding || padding
        );
      }

      continue;
    }

    // First-ever sequence for this account/document type. Initialize it from
    // the highest invoice that already exists, so old data is never repeated.
    try {
      await InvoiceSequence.create({
        user: userId,
        documentType: invoiceType,
        prefix,
        nextNumber: minimumNextNumber + 1,
        padding: 4,
      });

      return formatSequenceNumber(prefix, minimumNextNumber, 4);
    } catch (error) {
      // Another request may have created the unique sequence between our
      // read and create. Retry and use the atomic update path.
      if (error?.code === 11000) {
        continue;
      }
      throw error;
    }
  }

  throw new Error('Could not allocate the next document number. Please try again.');
};

// Custom numbering uses the requested number as the starting number.
// The sequence is persisted in MongoDB so future documents continue from it.
const allocateCustomInvoiceNumber = async (
  userId,
  requestedNumber,
  invoiceType = 'invoice'
) => {
  const requested = String(requestedNumber || '').trim();
  if (!requested) {
    throw new Error('Please enter a custom document number.');
  }

  const parsed = splitNumber(requested);

  // If the custom value has no numeric suffix, preserve it. The unique
  // invoice index will prevent duplicates for the same account.
  if (parsed.number === null) {
    return requested;
  }

  const exactExists = await Invoice.exists({
    user: userId,
    invoiceType,
    invoiceNumber: requested,
    isDeleted: false,
  });

  // If this exact number has not been used, save it as-is and remember
  // requested + 1 as the next number for this account/document type.
  if (!exactExists) {
    const existingSequence = await InvoiceSequence.findOne({
      user: userId,
      documentType: invoiceType,
    }).lean();

    if (!existingSequence || existingSequence.prefix !== parsed.prefix) {
      await InvoiceSequence.findOneAndUpdate(
        {
          user: userId,
          documentType: invoiceType,
        },
        {
          $set: {
            prefix: parsed.prefix,
            padding: parsed.width || 4,
            nextNumber: parsed.number + 1,
          },
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        }
      );
    } else {
      await InvoiceSequence.findOneAndUpdate(
        {
          user: userId,
          documentType: invoiceType,
        },
        {
          $max: {
            nextNumber: parsed.number + 1,
          },
          $set: {
            prefix: parsed.prefix,
            padding: parsed.width || 4,
          },
        },
        {
          new: true,
        }
      );
    }

    return requested;
  }

  // The requested number already exists. Move the sequence forward and
  // atomically allocate the next available number.
  const existingSequence = await InvoiceSequence.findOne({
    user: userId,
    documentType: invoiceType,
  }).lean();

  if (!existingSequence || existingSequence.prefix !== parsed.prefix) {
    await InvoiceSequence.findOneAndUpdate(
      {
        user: userId,
        documentType: invoiceType,
      },
      {
        $set: {
          prefix: parsed.prefix,
          padding: parsed.width || 4,
          nextNumber: parsed.number + 1,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );
  } else {
    await InvoiceSequence.findOneAndUpdate(
      {
        user: userId,
        documentType: invoiceType,
      },
      {
        $max: {
          nextNumber: parsed.number + 1,
        },
      },
      {
        new: true,
      }
    );
  }

  const previous = await InvoiceSequence.findOneAndUpdate(
    {
      user: userId,
      documentType: invoiceType,
      prefix: parsed.prefix,
    },
    {
      $inc: { nextNumber: 1 },
    },
    {
      new: false,
    }
  ).lean();

  if (!previous) {
    throw new Error('Could not continue the custom document sequence.');
  }

  return formatSequenceNumber(
    previous.prefix,
    previous.nextNumber,
    previous.padding
  );
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

    const response = {
      success: true,
      total,
      page: Number(page),
      invoices,
    };

    // New InvoiceForm uses this read-only preview to display the number
    // currently available from MongoDB without consuming the number.
    if (String(req.query.nextNumber).toLowerCase() === 'true') {
      const requestedType = invoiceType || 'invoice';
      response.nextNumber = await getPreviewNextInvoiceNumber(
        req.user._id,
        requestedType
      );
    }

    res.json(response);
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
      .populate('user', 'name email businessName businessLogo businessSignature businessSeal address gstin phone bankDetails invoiceTemplate invoiceTemplateColors quotationTemplate quotationTemplateColors plan');
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
        Invoice.countDocuments({
          user: req.user._id,
          createdAt: { $gte: startOfMonth },
        }),
        Quotation.countDocuments({
          user: req.user._id,
          createdAt: { $gte: startOfMonth },
        }),
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
    const invoiceType = req.body.invoiceType || 'invoice';
    const isCustomNumber = Boolean(req.body.isCustomNumber);

    const totals = calcTotals(items, isInterstate);

    let invoice = null;
    let lastError = null;

    // A custom request can race with another request using the same starting
    // number. The unique Invoice index plus retry logic handles that safely.
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const requestedNumber = isCustomNumber
          ? String(req.body.invoiceNumber || '').trim()
          : '';

        const allocatedNumber = isCustomNumber
          ? await allocateCustomInvoiceNumber(
              req.user._id,
              requestedNumber,
              invoiceType
            )
          : await allocateAutomaticInvoiceNumber(
              req.user._id,
              invoiceType
            );

        invoice = await Invoice.create({
          ...rest,
          ...totals,
          invoiceNumber: allocatedNumber,
          isCustomNumber,
          invoiceType,
          isInterstate,
          user: req.user._id,
          template:
            req.body.template ||
            req.user.invoiceTemplate ||
            'template1',
        });

        break;
      } catch (error) {
        lastError = error;

        // Duplicate invoice number: allocate the next custom number and retry.
        if (error?.code === 11000) {
          continue;
        }

        throw error;
      }
    }

    if (!invoice) {
      throw lastError || new Error('Failed to create invoice.');
    }

    // Automatically reflect items in products/services database.
    await upsertProductsFromItems(req.user._id, items);

    await invoice.populate('client', 'name email phone');
    await invoice.populate(
      'user',
      'name email businessName businessLogo businessSignature businessSeal address gstin phone bankDetails invoiceTemplate invoiceTemplateColors quotationTemplate quotationTemplateColors plan'
    );

    res.status(201).json({
      success: true,
      invoice,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// @desc    Update invoice
// @route   PUT /api/invoices/:id
// @access  Private
const updateInvoice = async (req, res) => {
  try {
    const { items, isInterstate, template, isCustomNumber, ...rest } = req.body;
    const existing = await Invoice.findOne({ _id: req.params.id, user: req.user._id, isDeleted: { $ne: true } });
    if (!existing) return res.status(404).json({ success: false, message: 'Invoice not found' });

    const updatedItems = items || existing.items;
    const interstate = isInterstate !== undefined ? isInterstate : existing.isInterstate;
    const totals = calcTotals(updatedItems, interstate);
    // Preserve the stored template unless the user explicitly chose a new one or cleared it
    const resolvedTemplate = (template !== undefined) ? template.toLowerCase() : existing.template;

    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id, isDeleted: { $ne: true } },
      {
        ...rest,
        ...totals,
        isInterstate: interstate,
        template: resolvedTemplate,
        ...(isCustomNumber !== undefined && { isCustomNumber: Boolean(isCustomNumber) }),
      },
      { new: true, runValidators: true }
    )
      .populate('client', 'name email phone')
      .populate('user', 'name email businessName businessLogo businessSignature businessSeal address gstin phone bankDetails invoiceTemplate invoiceTemplateColors quotationTemplate quotationTemplateColors plan');

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
