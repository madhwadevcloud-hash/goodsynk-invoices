const Quotation = require('../models/Quotation');
const Invoice = require('../models/Invoice');
const InvoiceSequence = require('../models/InvoiceSequence');
const { upsertProductsFromItems } = require('../utils/productHelper');
const { getLimits } = require('../utils/planLimits');

// ============================================================
// CALCULATE TOTALS
// ============================================================

const calcTotals = (items, isInterstate, taxType = 'gst_india') => {
  let subtotal = 0;
  let cgstTotal = 0;
  let sgstTotal = 0;
  let igstTotal = 0;
  let vatTotal = 0;
  let discountAmount = 0;

  const recalculated = items.map((item) => {
    const lineSubtotal =
      Number(item.price || 0) * Number(item.quantity || 0);

    const discAmt =
      (lineSubtotal * Number(item.discount || 0)) / 100;

    const taxableAmount = lineSubtotal - discAmt;

    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;
    let vatAmount = 0;

    if (taxType === 'vat') {
      vatAmount =
        (taxableAmount * Number(item.vatRate || 0)) / 100;
    } else if (taxType === 'gst_india') {
      if (isInterstate) {
        igstAmount =
          (taxableAmount * Number(item.igstRate || 0)) / 100;
      } else {
        cgstAmount =
          (taxableAmount * Number(item.cgstRate || 0)) / 100;

        sgstAmount =
          (taxableAmount * Number(item.sgstRate || 0)) / 100;
      }
    }

    const total =
      taxableAmount +
      cgstAmount +
      sgstAmount +
      igstAmount +
      vatAmount;

    subtotal += lineSubtotal;
    discountAmount += discAmt;
    cgstTotal += cgstAmount;
    sgstTotal += sgstAmount;
    igstTotal += igstAmount;
    vatTotal += vatAmount;

    return {
      ...item,
      taxableAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      vatAmount,
      total,
    };
  });

  const taxTotal =
    cgstTotal +
    sgstTotal +
    igstTotal +
    vatTotal;

  const grandTotal =
    subtotal -
    discountAmount +
    taxTotal;

  return {
    items: recalculated,
    subtotal,
    discountAmount,
    cgstTotal,
    sgstTotal,
    igstTotal,
    vatTotal,
    taxTotal,
    total: grandTotal,
  };
};

// ============================================================
// NUMBERING HELPERS
// ============================================================

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

const formatSequenceNumber = (
  prefix,
  number,
  padding = 4
) => {
  return `${prefix}${String(number).padStart(padding, '0')}`;
};

// ============================================================
// FIND HIGHEST SAVED QUOTATION NUMBER
//
// IMPORTANT:
// MongoDB Quotation records are the SOURCE OF TRUTH.
// InvoiceSequence is NOT allowed to force KK-999 if the real
// latest quotation is KK-555.
// ============================================================

const findHighestQuotationNumber = async (
  userId,
  prefix
) => {
  const regex = new RegExp(
    `^${escapeRegex(prefix)}(\\d+)$`
  );

  const quotations = await Quotation.find({
    user: userId,
    isDeleted: { $ne: true },
    quotationNumber: {
      $regex: regex,
    },
  })
    .select('quotationNumber')
    .lean();

  let highest = 0;

  for (const quotation of quotations) {
    const number =
      String(
        quotation?.quotationNumber || ''
      ).match(regex);

    if (number) {
      highest = Math.max(
        highest,
        Number(number[1])
      );
    }
  }

  return highest;
};

// ============================================================
// GET ALL NUMBERED QUOTATIONS
// ============================================================

const getNumberedQuotations = async (userId) => {
  const quotations = await Quotation.find({
    user: userId,
    isDeleted: { $ne: true },
    quotationNumber: {
      $regex: /\d+$/,
    },
  })
    .select(
      'quotationNumber createdAt isCustomNumber'
    )
    .sort({
      createdAt: 1,
    })
    .lean();

  return quotations
    .map((quotation) => {
      const parsed = splitNumber(
        quotation.quotationNumber
      );

      if (parsed.number === null) {
        return null;
      }

      return {
        number: parsed.number,
        prefix: parsed.prefix,
        padding: parsed.width || 4,
        quotationNumber:
          quotation.quotationNumber,
        createdAt: quotation.createdAt,
      };
    })
    .filter(Boolean);
};

// ============================================================
// FIND THE ACTUAL CURRENT QUOTATION SEQUENCE
//
// Example:
//
// Existing DB:
// KK-551
// KK-552
// KK-553
// KK-554
// KK-555
//
// Even if InvoiceSequence says:
// KK-999
//
// Result:
// KK-556
// ============================================================

const getQuotationSequenceFromDocuments = async (
  userId
) => {
  const numbered = await getNumberedQuotations(
    userId
  );

  if (!numbered.length) {
    return {
      prefix: 'QT-',
      padding: 4,
      highest: 0,
    };
  }

  // Group by prefix.
  //
  // The most recently created numbered quotation
  // determines the active quotation numbering style.
  const latest = [...numbered].sort(
    (a, b) =>
      new Date(b.createdAt) -
      new Date(a.createdAt)
  )[0];

  const prefix = latest.prefix;
  const padding = latest.padding || 4;

  const samePrefix = numbered.filter(
    (item) =>
      item.prefix === prefix
  );

  const highest = samePrefix.reduce(
    (max, item) =>
      Math.max(max, item.number),
    0
  );

  return {
    prefix,
    padding,
    highest,
  };
};

// ============================================================
// PREVIEW NEXT QUOTATION NUMBER
//
// READ ONLY.
// DOES NOT CONSUME A NUMBER.
//
// This is what New Quotation uses.
// ============================================================

const getPreviewNextQuotationNumber = async (
  userId
) => {
  const sequence =
    await getQuotationSequenceFromDocuments(
      userId
    );

  const nextNumber =
    sequence.highest + 1;

  return formatSequenceNumber(
    sequence.prefix,
    nextNumber,
    sequence.padding
  );
};

// ============================================================
// CHECK IF QUOTATION NUMBER EXISTS
// ============================================================

const quotationNumberExists = async (
  userId,
  quotationNumber
) => {
  const requested =
    String(
      quotationNumber || ''
    ).trim();

  if (!requested) {
    return false;
  }

  const exists =
    await Quotation.exists({
      user: userId,
      quotationNumber: requested,
      isDeleted: {
        $ne: true,
      },
    });

  return !!exists;
};

// ============================================================
// CHECK IF INVOICE NUMBER EXISTS
// ============================================================

const invoiceNumberExists = async (
  userId,
  invoiceNumber
) => {
  const requested =
    String(
      invoiceNumber || ''
    ).trim();

  if (!requested) {
    return false;
  }

  const exists =
    await Invoice.exists({
      user: userId,
      invoiceNumber: requested,
      isDeleted: {
        $ne: true,
      },
    });

  return !!exists;
};

// ============================================================
// SYNC INVOICE SEQUENCE
//
// This function fixes old/stale sequence records.
//
// Example:
//
// User saved KK-555.
//
// Old sequence:
// KK-999
//
// This function changes sequence to:
// nextNumber = 556
// ============================================================

const syncQuotationSequence = async (
  userId,
  prefix,
  nextNumber,
  padding
) => {
  await InvoiceSequence.findOneAndUpdate(
    {
      user: userId,
      documentType: 'quotation',
    },
    {
      $set: {
        prefix,
        nextNumber,
        padding,
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );
};

// ============================================================
// ALLOCATE AUTOMATIC QUOTATION NUMBER
//
// IMPORTANT:
//
// The saved Quotation documents are checked FIRST.
//
// InvoiceSequence is synchronized to that real value.
//
// Therefore an old KK-999 sequence cannot make the next
// quotation KK-1000 when the actual latest quotation is KK-555.
// ============================================================

const allocateAutomaticQuotationNumber = async (
  userId
) => {
  for (
    let attempt = 0;
    attempt < 5;
    attempt += 1
  ) {
    const sequence =
      await getQuotationSequenceFromDocuments(
        userId
      );

    const prefix =
      sequence.prefix || 'QT-';

    const padding =
      sequence.padding || 4;

    const nextNumber =
      sequence.highest + 1;

    const candidate =
      formatSequenceNumber(
        prefix,
        nextNumber,
        padding
      );

    // Check the actual quotation collection again
    // immediately before saving.
    const alreadyExists =
      await quotationNumberExists(
        userId,
        candidate
      );

    if (alreadyExists) {
      continue;
    }

    // Also prevent the same number from being used
    // by an invoice.
    const invoiceExists =
      await invoiceNumberExists(
        userId,
        candidate
      );

    if (invoiceExists) {
      // If the same number is used by an invoice,
      // move forward.
      const nextCandidate =
        formatSequenceNumber(
          prefix,
          nextNumber + 1,
          padding
        );

      const nextQuotationExists =
        await quotationNumberExists(
          userId,
          nextCandidate
        );

      if (!nextQuotationExists) {
        await syncQuotationSequence(
          userId,
          prefix,
          nextNumber + 2,
          padding
        );

        return nextCandidate;
      }

      continue;
    }

    // Synchronize the DB sequence.
    await syncQuotationSequence(
      userId,
      prefix,
      nextNumber + 1,
      padding
    );

    // Final duplicate check.
    const finalExists =
      await quotationNumberExists(
        userId,
        candidate
      );

    if (finalExists) {
      continue;
    }

    return candidate;
  }

  throw new Error(
    'Could not allocate the next quotation number. Please try again.'
  );
};

// ============================================================
// ALLOCATE CUSTOM QUOTATION NUMBER
//
// Example:
//
// User enters:
// KK-555
//
// Saved:
// KK-555
//
// Sequence becomes:
// KK-556
// ============================================================

const allocateCustomQuotationNumber = async (
  userId,
  requestedNumber
) => {
  const requested =
    String(
      requestedNumber || ''
    ).trim();

  if (!requested) {
    throw new Error(
      'Please enter a custom quotation number.'
    );
  }

  // Check quotation duplicates.
  const quotationExists =
    await quotationNumberExists(
      userId,
      requested
    );

  if (quotationExists) {
    throw new Error(
      `Quotation number ${requested} is already in use.`
    );
  }

  // Check invoice duplicates as well.
  const invoiceExists =
    await invoiceNumberExists(
      userId,
      requested
    );

  if (invoiceExists) {
    throw new Error(
      `Document number ${requested} is already in use.`
    );
  }

  const parsed =
    splitNumber(requested);

  // If the custom number does not end with
  // digits, preserve it exactly.
  if (parsed.number === null) {
    return requested;
  }

  const prefix =
    parsed.prefix;

  const padding =
    parsed.width || 4;

  const nextNumber =
    parsed.number + 1;

  // VERY IMPORTANT:
  //
  // Do NOT use $max here.
  //
  // We explicitly RESET the quotation sequence
  // based on what the user just saved.
  //
  // KK-555 => next KK-556
  await syncQuotationSequence(
    userId,
    prefix,
    nextNumber,
    padding
  );

  return requested;
};

// ============================================================
// FIND HIGHEST INVOICE NUMBER
// ============================================================

const findHighestInvoiceNumber = async (
  userId,
  prefix
) => {
  const regex = new RegExp(
    `^${escapeRegex(prefix)}(\\d+)$`
  );

  const invoices = await Invoice.find({
    user: userId,
    isDeleted: {
      $ne: true,
    },
    invoiceNumber: {
      $regex: regex,
    },
  })
    .select('invoiceNumber')
    .lean();

  let highest = 0;

  for (const invoice of invoices) {
    const match =
      String(
        invoice?.invoiceNumber || ''
      ).match(regex);

    if (match) {
      highest = Math.max(
        highest,
        Number(match[1])
      );
    }
  }

  return highest;
};

// ============================================================
// INVOICE NUMBER ALLOCATION FOR QUOTATION CONVERSION
// ============================================================

const allocateAutomaticInvoiceNumberForConversion =
  async (userId) => {
    const defaultPrefix = 'INV-';

    for (
      let attempt = 0;
      attempt < 5;
      attempt += 1
    ) {
      const sequence =
        await InvoiceSequence.findOne({
          user: userId,
          documentType: 'invoice',
        }).lean();

      const prefix =
        sequence?.prefix ||
        defaultPrefix;

      const padding =
        sequence?.padding || 4;

      const highest =
        await findHighestInvoiceNumber(
          userId,
          prefix
        );

      const nextNumber =
        highest + 1;

      const candidate =
        formatSequenceNumber(
          prefix,
          nextNumber,
          padding
        );

      const exists =
        await Invoice.exists({
          user: userId,
          invoiceNumber: candidate,
          isDeleted: {
            $ne: true,
          },
        });

      if (exists) {
        continue;
      }

      await InvoiceSequence.findOneAndUpdate(
        {
          user: userId,
          documentType: 'invoice',
        },
        {
          $set: {
            prefix,
            padding,
            nextNumber:
              nextNumber + 1,
          },
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );

      return candidate;
    }

    throw new Error(
      'Could not allocate the next invoice number. Please try again.'
    );
  };

// ============================================================
// MAP QUOTATION FOR FRONTEND
// ============================================================

const mapQuotationForResponse = (
  quotation
) => {
  const out =
    quotation?.toObject
      ? quotation.toObject()
      : {
          ...quotation,
        };

  out.invoiceNumber =
    out.quotationNumber;

  out.dueDate =
    out.validUntil;

  out.invoiceType =
    'quotation';

  return out;
};

// ============================================================
// GET ALL QUOTATIONS
// ============================================================

const getQuotations = async (
  req,
  res
) => {
  try {
    // ========================================================
    // NEXT NUMBER PREVIEW
    // ========================================================

    if (
      String(
        req.query.nextNumber
      ).toLowerCase() === 'true'
    ) {
      const nextNumber =
        await getPreviewNextQuotationNumber(
          req.user._id
        );

      return res.json({
        success: true,
        nextNumber,
      });
    }

    // ========================================================
    // NORMAL QUOTATION LIST
    // ========================================================

    const {
      status,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {
      user: req.user._id,
      isDeleted: {
        $ne: true,
      },
    };

    if (status) {
      filter.status = status;
    }

    const pageNumber =
      Math.max(
        1,
        Number(page) || 1
      );

    const limitNumber =
      Math.max(
        1,
        Number(limit) || 20
      );

    const total =
      await Quotation.countDocuments(
        filter
      );

    const quotations =
      await Quotation.find(filter)
        .populate(
          'client',
          'name email phone'
        )
        .sort({
          createdAt: -1,
        })
        .skip(
          (pageNumber - 1) *
            limitNumber
        )
        .limit(limitNumber);

    const mapped =
      quotations.map(
        mapQuotationForResponse
      );

    return res.json({
      success: true,
      total,
      page: pageNumber,
      quotations: mapped,
    });
  } catch (err) {
    console.error(
      'getQuotations error:',
      err
    );

    return res.status(500).json({
      success: false,
      message:
        err.message ||
        'Failed to load quotations',
    });
  }
};

// ============================================================
// GET SINGLE QUOTATION
// ============================================================

const getQuotation = async (
  req,
  res
) => {
  try {
    const quotation =
      await Quotation.findOne({
        _id: req.params.id,
        user: req.user._id,
        isDeleted: {
          $ne: true,
        },
      })
        .populate('client')
        .populate(
          'user',
          'name email businessName businessLogo businessSignature businessSeal address gstin phone bankDetails invoiceTemplate invoiceTemplateColors quotationTemplate quotationTemplateColors plan'
        );

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message:
          'Quotation not found',
      });
    }

    if (!quotation.shareToken) {
      const {
        generateShareToken,
      } = require('../utils/shareToken');

      quotation.shareToken =
        generateShareToken();

      await quotation.save();
    }

    return res.json({
      success: true,
      invoice:
        mapQuotationForResponse(
          quotation
        ),
    });
  } catch (err) {
    console.error(
      'getQuotation error:',
      err
    );

    return res.status(500).json({
      success: false,
      message:
        err.message ||
        'Failed to load quotation',
    });
  }
};

// ============================================================
// CREATE QUOTATION
// ============================================================

const createQuotation = async (
  req,
  res
) => {
  try {
    // ========================================================
    // PLAN LIMIT
    // ========================================================

    const limits =
      getLimits(
        req.user.plan
      );

    if (
      limits.documentsPerMonth !==
      Infinity
    ) {
      const startOfMonth =
        new Date();

      startOfMonth.setDate(1);
      startOfMonth.setHours(
        0,
        0,
        0,
        0
      );

      const [
        invoiceCount,
        quotationCount,
      ] = await Promise.all([
        Invoice.countDocuments({
          user: req.user._id,
          createdAt: {
            $gte: startOfMonth,
          },
        }),

        Quotation.countDocuments({
          user: req.user._id,
          createdAt: {
            $gte: startOfMonth,
          },
        }),
      ]);

      const totalDocs =
        invoiceCount +
        quotationCount;

      if (
        totalDocs >=
        limits.documentsPerMonth
      ) {
        return res.status(403).json({
          success: false,
          code:
            'PLAN_LIMIT_DOCUMENTS',
          message:
            `You have reached your plan limit of ${limits.documentsPerMonth} invoices & quotations per month. Please upgrade to create more.`,
          limitReached: true,
        });
      }
    }

    // ========================================================
    // REQUEST DATA
    // ========================================================

    const {
      items = [],
      isInterstate = false,
      taxType = 'gst_india',
      dueDate,
      invoiceNumber,
      isCustomNumber = false,
      invoiceType: _invoiceType,
      ...rest
    } = req.body;

    // ========================================================
    // TOTALS
    // ========================================================

    const totals =
      calcTotals(
        items,
        isInterstate,
        taxType
      );

    // ========================================================
    // NUMBER
    // ========================================================

    let quotationNumber;

    if (Boolean(isCustomNumber)) {
      quotationNumber =
        await allocateCustomQuotationNumber(
          req.user._id,
          invoiceNumber
        );
    } else {
      quotationNumber =
        await allocateAutomaticQuotationNumber(
          req.user._id
        );
    }

    // ========================================================
    // CREATE
    // ========================================================

    const quotation =
      await Quotation.create({
        ...rest,

        ...totals,

        user:
          req.user._id,

        quotationNumber,

        validUntil:
          dueDate || undefined,

        isInterstate,

        taxType,

        isCustomNumber:
          Boolean(isCustomNumber),

        template:
          req.body.template ||
          req.user.quotationTemplate ||
          'template1',
      });

    // ========================================================
    // UPDATE PRODUCTS
    // ========================================================

    await upsertProductsFromItems(
      req.user._id,
      items
    );

    // ========================================================
    // POPULATE
    // ========================================================

    await quotation.populate(
      'client',
      'name email phone'
    );

    await quotation.populate(
      'user',
      'name email businessName businessLogo businessSignature businessSeal address gstin phone bankDetails invoiceTemplate invoiceTemplateColors quotationTemplate quotationTemplateColors plan'
    );

    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(201).json({
      success: true,
      invoice:
        mapQuotationForResponse(
          quotation
        ),
    });
  } catch (err) {
    console.error(
      'createQuotation error:',
      err
    );

    if (
      err?.code === 11000
    ) {
      return res.status(409).json({
        success: false,
        message:
          'This quotation number is already in use. Please try again.',
      });
    }

    return res.status(400).json({
      success: false,
      message:
        err.message ||
        'Failed to create quotation',
    });
  }
};

// ============================================================
// UPDATE QUOTATION
// ============================================================

const updateQuotation = async (
  req,
  res
) => {
  try {
    const {
      items,
      isInterstate,
      taxType,
      dueDate,
      invoiceNumber,
      isCustomNumber,
      invoiceType: _invoiceType,
      template,
      ...rest
    } = req.body;

    const existing =
      await Quotation.findOne({
        _id: req.params.id,
        user: req.user._id,
        isDeleted: {
          $ne: true,
        },
      });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message:
          'Quotation not found',
      });
    }

    const updatedItems =
      items || existing.items;

    const interstate =
      isInterstate !== undefined
        ? isInterstate
        : existing.isInterstate;

    const type =
      taxType ||
      existing.taxType;

    const totals =
      calcTotals(
        updatedItems,
        interstate,
        type
      );

    const resolvedTemplate =
      template !== undefined
        ? String(
            template
          ).toLowerCase()
        : existing.template;

    const updateData = {
      ...rest,

      ...totals,

      isInterstate:
        interstate,

      taxType:
        type,

      template:
        resolvedTemplate,
    };

    // ========================================================
    // CUSTOM NUMBERING
    // ========================================================

    if (
      Boolean(isCustomNumber)
    ) {
      const requested =
        String(
          invoiceNumber || ''
        ).trim();

      if (!requested) {
        return res.status(400).json({
          success: false,
          message:
            'Please enter a custom quotation number.',
        });
      }

      if (
        requested !==
        existing.quotationNumber
      ) {
        const quotationExists =
          await quotationNumberExists(
            req.user._id,
            requested
          );

        if (
          quotationExists
        ) {
          return res.status(409).json({
            success: false,
            message:
              `Quotation number ${requested} is already in use.`,
          });
        }

        const invoiceExists =
          await invoiceNumberExists(
            req.user._id,
            requested
          );

        if (
          invoiceExists
        ) {
          return res.status(409).json({
            success: false,
            message:
              `Document number ${requested} is already in use.`,
          });
        }

        updateData.quotationNumber =
          requested;

        const parsed =
          splitNumber(
            requested
          );

        if (
          parsed.number !==
          null
        ) {
          // IMPORTANT:
          // Explicitly reset sequence.
          await syncQuotationSequence(
            req.user._id,
            parsed.prefix,
            parsed.number + 1,
            parsed.width || 4
          );
        }
      }
    }

    // ========================================================
    // VALID UNTIL
    // ========================================================

    if (
      dueDate !==
      undefined
    ) {
      updateData.validUntil =
        dueDate;
    }

    // ========================================================
    // CUSTOM FLAG
    // ========================================================

    if (
      isCustomNumber !==
      undefined
    ) {
      updateData.isCustomNumber =
        Boolean(
          isCustomNumber
        );
    }

    // ========================================================
    // UPDATE
    // ========================================================

    const quotation =
      await Quotation.findOneAndUpdate(
        {
          _id:
            req.params.id,

          user:
            req.user._id,

          isDeleted: {
            $ne: true,
          },
        },
        updateData,
        {
          new: true,
          runValidators: true,
        }
      )
        .populate(
          'client',
          'name email phone'
        )
        .populate(
          'user',
          'name email businessName businessLogo businessSignature businessSeal address gstin phone bankDetails invoiceTemplate invoiceTemplateColors quotationTemplate quotationTemplateColors plan'
        );

    // ========================================================
    // PRODUCTS
    // ========================================================

    if (items) {
      await upsertProductsFromItems(
        req.user._id,
        items
      );
    }

    // ========================================================
    // RESPONSE
    // ========================================================

    return res.json({
      success: true,
      invoice:
        mapQuotationForResponse(
          quotation
        ),
    });
  } catch (err) {
    console.error(
      'updateQuotation error:',
      err
    );

    if (
      err?.code === 11000
    ) {
      return res.status(409).json({
        success: false,
        message:
          'This quotation number is already in use.',
      });
    }

    return res.status(400).json({
      success: false,
      message:
        err.message ||
        'Failed to update quotation',
    });
  }
};

// ============================================================
// UPDATE STATUS
// ============================================================

const updateQuotationStatus =
  async (
    req,
    res
  ) => {
    try {
      const {
        status,
      } = req.body;

      const quotation =
        await Quotation.findOneAndUpdate(
          {
            _id:
              req.params.id,

            user:
              req.user._id,

            isDeleted: {
              $ne: true,
            },
          },
          {
            status,
          },
          {
            new: true,
          }
        );

      if (!quotation) {
        return res.status(404).json({
          success: false,
          message:
            'Quotation not found',
        });
      }

      return res.json({
        success: true,
        invoice:
          mapQuotationForResponse(
            quotation
          ),
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        message:
          err.message,
      });
    }
  };

// ============================================================
// DELETE QUOTATION
// ============================================================

const deleteQuotation =
  async (
    req,
    res
  ) => {
    try {
      const quotation =
        await Quotation.findOneAndUpdate(
          {
            _id:
              req.params.id,

            user:
              req.user._id,

            isDeleted: {
              $ne: true,
            },
          },
          {
            isDeleted: true,
          },
          {
            new: true,
          }
        );

      if (!quotation) {
        return res.status(404).json({
          success: false,
          message:
            'Quotation not found',
        });
      }

      return res.json({
        success: true,
        message:
          'Quotation deleted',
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message:
          err.message,
      });
    }
  };

// ============================================================
// CONVERT QUOTATION TO INVOICE
// ============================================================

const convertToInvoice =
  async (
    req,
    res
  ) => {
    try {
      // ======================================================
      // PLAN LIMIT
      // ======================================================

      const limits =
        getLimits(
          req.user.plan
        );

      if (
        limits.documentsPerMonth !==
        Infinity
      ) {
        const startOfMonth =
          new Date();

        startOfMonth.setDate(1);
        startOfMonth.setHours(
          0,
          0,
          0,
          0
        );

        const [
          invoiceCount,
          quotationCount,
        ] = await Promise.all([
          Invoice.countDocuments({
            user:
              req.user._id,

            createdAt: {
              $gte:
                startOfMonth,
            },
          }),

          Quotation.countDocuments({
            user:
              req.user._id,

            createdAt: {
              $gte:
                startOfMonth,
            },
          }),
        ]);

        const totalDocs =
          invoiceCount +
          quotationCount;

        if (
          totalDocs >=
          limits.documentsPerMonth
        ) {
          return res.status(403).json({
            success: false,
            code:
              'PLAN_LIMIT_DOCUMENTS',
            message:
              `You have reached your plan limit of ${limits.documentsPerMonth} invoices & quotations per month. Please upgrade to create more.`,
            limitReached: true,
          });
        }
      }

      // ======================================================
      // GET QUOTATION
      // ======================================================

      const quotation =
        await Quotation.findOne({
          _id:
            req.params.id,

          user:
            req.user._id,

          isDeleted: {
            $ne: true,
          },
        }).populate(
          'client'
        );

      if (!quotation) {
        return res.status(404).json({
          success: false,
          message:
            'Quotation not found',
        });
      }

      // ======================================================
      // ITEMS
      // ======================================================

      const items =
        quotation.items.map(
          (item) => ({
            product:
              item.product ||
              null,

            name:
              item.name,

            itemType:
              item.itemType ||
              'Product',

            description:
              item.description ||
              '',

            hsn:
              item.hsn ||
              '',

            quantity:
              item.quantity,

            unit:
              item.unit ||
              'pcs',

            price:
              item.price,

            discount:
              item.discount ||
              0,

            vatRate:
              item.vatRate ||
              0,

            cgstRate:
              item.cgstRate ||
              0,

            sgstRate:
              item.sgstRate ||
              0,

            igstRate:
              item.igstRate ||
              0,

            taxableAmount:
              item.taxableAmount ||
              0,

            vatAmount:
              item.vatAmount ||
              0,

            cgstAmount:
              item.cgstAmount ||
              0,

            sgstAmount:
              item.sgstAmount ||
              0,

            igstAmount:
              item.igstAmount ||
              0,

            total:
              item.total ||
              0,
          })
        );

      // ======================================================
      // INVOICE NUMBER
      // ======================================================

      const invoiceNumber =
        await allocateAutomaticInvoiceNumberForConversion(
          req.user._id
        );

      // ======================================================
      // CREATE INVOICE
      // ======================================================

      const invoice =
        await Invoice.create({
          user:
            req.user._id,

          client:
            quotation.client._id,

          invoiceType:
            'invoice',

          invoiceNumber,

          isCustomNumber:
            false,

          issueDate:
            new Date(),

          dueDate:
            quotation.validUntil ||
            undefined,

          isInterstate:
            quotation.isInterstate,

          placeOfSupply:
            quotation.placeOfSupply,

          currency:
            quotation.currency,

          taxType:
            quotation.taxType,

          items,

          subtotal:
            quotation.subtotal,

          discountAmount:
            quotation.discountAmount,

          cgstTotal:
            quotation.cgstTotal,

          sgstTotal:
            quotation.sgstTotal,

          igstTotal:
            quotation.igstTotal,

          vatTotal:
            quotation.vatTotal,

          taxTotal:
            quotation.taxTotal,

          total:
            quotation.total,

          notes:
            quotation.notes,

          termsAndConditions:
            quotation.termsAndConditions,

          template:
            quotation.template,

          templateColors:
            quotation.templateColors,

          status:
            'draft',
        });

      // ======================================================
      // UPDATE PRODUCTS
      // ======================================================

      await upsertProductsFromItems(
        req.user._id,
        items
      );

      // ======================================================
      // MARK QUOTATION ACCEPTED
      // ======================================================

      quotation.status =
        'accepted';

      await quotation.save();

      // ======================================================
      // RESPONSE
      // ======================================================

      return res.status(201).json({
        success: true,

        invoiceId:
          invoice._id,

        invoiceNumber:
          invoice.invoiceNumber,
      });
    } catch (err) {
      console.error(
        'convertToInvoice error:',
        err
      );

      if (
        err?.code === 11000
      ) {
        return res.status(409).json({
          success: false,
          message:
            'A document with this number already exists. Please try again.',
        });
      }

      return res.status(400).json({
        success: false,
        message:
          err.message ||
          'Failed to convert quotation',
      });
    }
  };

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  getQuotations,
  getQuotation,
  createQuotation,
  updateQuotation,
  updateQuotationStatus,
  deleteQuotation,
  convertToInvoice,
};
