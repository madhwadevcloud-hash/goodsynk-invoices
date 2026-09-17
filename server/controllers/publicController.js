const React = require('react');
const { pdf } = require('@react-pdf/renderer');
const Invoice = require('../models/Invoice');
const Quotation = require('../models/Quotation');
const TemplateResolver = require('../pdfTemplates/templates/TemplateResolver.jsx').default;

/*
 * ============================================================
 * BUILD PDF DATA
 * ============================================================
 *
 * The database uses:
 *   item.price
 *   item.total
 *
 * Some PDF templates also read:
 *   item.rate
 *   item.amount
 *
 * The email PDF is generated on the client where these values
 * are already available/normalized.
 *
 * The public PDF is generated on the server, so we normalize
 * the line items here to make every template receive the same
 * fields.
 */
const buildInvoiceForPDF = (doc, docLabel) => {
    const raw = doc.toObject();

    const normalizedItems = (raw.items || []).map((item) => {
        const price = Number(
            item.price ??
            item.rate ??
            0
        ) || 0;

        const quantity = Number(
            item.quantity ??
            1
        ) || 1;

        const total = Number(
            item.total ??
            item.amount ??
            (price * quantity)
        ) || 0;

        const amount = Number(
            item.amount ??
            item.total ??
            total
        ) || 0;

        const rate = Number(
            item.rate ??
            item.price ??
            0
        ) || 0;

        return {
            ...item,

            // Canonical database field
            price,

            // Compatibility fields used by some templates
            rate,
            amount,

            // Canonical total
            total,
        };
    });

    return {
        ...raw,

        items: normalizedItems,

        invoiceType: docLabel.toLowerCase(),

        _currency: doc.currency || 'INR',

        _taxType: doc.taxType,

        /*
         * Keep both invoice/quotation template information
         * available for server-side rendering.
         */
        template:
            raw.template ||
            (
                docLabel.toLowerCase() === 'quotation'
                    ? raw.user?.quotationTemplate
                    : raw.user?.invoiceTemplate
            ) ||
            'template1',

        templateColors:
            raw.templateColors ||
            (
                docLabel.toLowerCase() === 'quotation'
                    ? raw.user?.quotationTemplateColors
                    : raw.user?.invoiceTemplateColors
            ) ||
            {},
    };
};


/*
 * ============================================================
 * DOCUMENT SETTINGS
 * ============================================================
 *
 * Mirrors the client-side TemplateResolver behaviour.
 */
const applyDocumentSettings = (
    invoiceForPDF,
    documentSettings
) => {
    const settings = documentSettings || {};

    const isDiscColumnVisible =
        !settings.hideDiscount &&
        settings.showDiscountColumn !== false;

    let processed = {
        ...invoiceForPDF,

        watermarkImage:
            invoiceForPDF.watermarkImage ||
            settings.watermarkImage ||
            undefined,
    };

    /*
     * If discount column is hidden, make sure all discount
     * values are zero so the PDF behaves like the frontend PDF.
     */
    if (!isDiscColumnVisible) {
        processed = {
            ...processed,

            discountAmount: 0,
            itemDiscount: 0,
            overallDiscTotal: 0,

            hideDiscount: true,
            hideDiscountColumn: true,

            items: (processed.items || []).map((item) => ({
                ...item,
                discount: 0,
                discountAmount: 0,
            })),
        };
    }

    return processed;
};


/*
 * ============================================================
 * STREAM -> BUFFER
 * ============================================================
 *
 * @react-pdf/renderer v4 returns a readable stream from
 * toBuffer(), so collect it before sending the response.
 */
const streamToBuffer = (stream) =>
    new Promise((resolve, reject) => {
        const chunks = [];

        stream.on('data', (chunk) => {
            chunks.push(chunk);
        });

        stream.on('end', () => {
            resolve(Buffer.concat(chunks));
        });

        stream.on('error', reject);
    });


/*
 * ============================================================
 * PUBLIC PDF GENERATOR
 * ============================================================
 */
const streamDocumentPdf = async (
    req,
    res,
    {
        Model,
        docLabel,
        numberField,
    }
) => {
    try {
        const doc = await Model.findOne({
            shareToken: req.params.token,
            isDeleted: { $ne: true },
        })
            .populate('client')
            .populate(
                'user',
                `
                name
                email
                businessName
                businessLogo
                businessSignature
                businessSeal
                address
                gstin
                phone
                bankDetails
                invoiceTemplate
                invoiceTemplateColors
                quotationTemplate
                quotationTemplateColors
                plan
                documentSettings
                `
            );

        if (!doc) {
            return res
                .status(404)
                .send('Document not found or link expired');
        }

        /*
         * Build normalized PDF data.
         *
         * IMPORTANT:
         * This is where price -> rate/amount compatibility
         * is created for the server-side templates.
         */
        let invoiceForPDF = buildInvoiceForPDF(
            doc,
            docLabel
        );

        /*
         * Apply owner's document settings.
         */
        invoiceForPDF = applyDocumentSettings(
            invoiceForPDF,
            doc.user?.documentSettings
        );

        /*
         * Generate PDF using the existing server TemplateResolver.
         */
        const pdfStream = await pdf(
            React.createElement(
                TemplateResolver,
                {
                    invoice: invoiceForPDF,
                }
            )
        ).toBuffer();

        /*
         * Convert stream to Buffer.
         */
        const buffer = await streamToBuffer(pdfStream);

        /*
         * PDF response headers.
         */
        res.setHeader(
            'Content-Type',
            'application/pdf'
        );

        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${docLabel}-${doc[numberField]}.pdf"`
        );

        res.setHeader(
            'Content-Length',
            buffer.length
        );

        res.send(buffer);

    } catch (err) {
        console.error(
            `Public ${docLabel} PDF error:`,
            err
        );

        res
            .status(500)
            .send('Failed to generate PDF');
    }
};


/*
 * ============================================================
 * PUBLIC DOCUMENT JSON
 * ============================================================
 *
 * Used by PublicDocumentView.jsx.
 */
const getPublicDocument = async (
    req,
    res,
    {
        Model,
        docLabel,
        numberField,
        dueDateField,
    }
) => {
    try {
        const doc = await Model.findOne({
            shareToken: req.params.token,
            isDeleted: { $ne: true },
        })
            .populate(
                'client',
                'name email phone address gstin'
            )
            .populate(
                'user',
                `
                name
                email
                businessName
                businessLogo
                businessSignature
                businessSeal
                address
                gstin
                phone
                bankDetails
                invoiceTemplate
                invoiceTemplateColors
                quotationTemplate
                quotationTemplateColors
                plan
                documentSettings
                `
            );

        if (!doc) {
            return res.status(404).json({
                success: false,
                message:
                    'Document not found or link expired',
            });
        }

        const out = doc.toObject();

        /*
         * Normalize public JSON item values as well.
         *
         * This keeps the public page data consistent with the
         * PDF data and protects the UI from rate/price mismatch.
         */
        const normalizedItems = (out.items || []).map(
            (item) => {
                const price = Number(
                    item.price ??
                    item.rate ??
                    0
                ) || 0;

                const quantity = Number(
                    item.quantity ??
                    1
                ) || 1;

                const total = Number(
                    item.total ??
                    item.amount ??
                    (price * quantity)
                ) || 0;

                return {
                    ...item,

                    price,

                    rate:
                        Number(
                            item.rate ??
                            item.price ??
                            price
                        ) || 0,

                    amount:
                        Number(
                            item.amount ??
                            item.total ??
                            total
                        ) || 0,

                    total,
                };
            }
        );

        /*
         * Select the correct template according to document type.
         */
        const isQuotation =
            docLabel.toLowerCase() === 'quotation';

        const selectedTemplate =
            out.template ||
            (
                isQuotation
                    ? out.user?.quotationTemplate
                    : out.user?.invoiceTemplate
            ) ||
            'template1';

        const selectedTemplateColors =
            out.templateColors ||
            (
                isQuotation
                    ? out.user?.quotationTemplateColors
                    : out.user?.invoiceTemplateColors
            ) ||
            {};

        res.json({
            success: true,

            document: {
                /*
                 * Basic document information
                 */
                docLabel,

                number:
                    out[numberField],

                date:
                    out.issueDate,

                dueDate:
                    out[dueDateField],

                status:
                    out.status,

                /*
                 * Financial information
                 */
                total:
                    out.total,

                currency:
                    out.currency,

                subtotal:
                    out.subtotal,

                taxTotal:
                    out.taxTotal,

                taxType:
                    out.taxType,

                discountAmount:
                    out.discountAmount,

                overallDiscTotal:
                    out.overallDiscTotal,

                /*
                 * Line items
                 */
                items:
                    normalizedItems,

                /*
                 * Client
                 */
                client:
                    out.client,

                /*
                 * Business information
                 */
                businessName:
                    out.user?.businessName,

                businessLogo:
                    out.user?.businessLogo ||
                    null,

                /*
                 * PDF/template information
                 */
                template:
                    selectedTemplate,

                templateColors:
                    selectedTemplateColors,

                invoiceTemplate:
                    out.user?.invoiceTemplate,

                invoiceTemplateColors:
                    out.user?.invoiceTemplateColors,

                quotationTemplate:
                    out.user?.quotationTemplate,

                quotationTemplateColors:
                    out.user?.quotationTemplateColors,

                /*
                 * Additional PDF information
                 */
                address:
                    out.user?.address,

                gstin:
                    out.user?.gstin,

                phone:
                    out.user?.phone,

                email:
                    out.user?.email,

                bankDetails:
                    out.user?.bankDetails,

                businessSignature:
                    out.user?.businessSignature,

                businessSeal:
                    out.user?.businessSeal,

                documentSettings:
                    out.user?.documentSettings,

                /*
                 * Keep the complete user object available to the
                 * public frontend if needed.
                 */
                user: out.user
                    ? {
                        name:
                            out.user.name,

                        email:
                            out.user.email,

                        businessName:
                            out.user.businessName,

                        businessLogo:
                            out.user.businessLogo,

                        businessSignature:
                            out.user.businessSignature,

                        businessSeal:
                            out.user.businessSeal,

                        address:
                            out.user.address,

                        gstin:
                            out.user.gstin,

                        phone:
                            out.user.phone,

                        bankDetails:
                            out.user.bankDetails,

                        invoiceTemplate:
                            out.user.invoiceTemplate,

                        invoiceTemplateColors:
                            out.user.invoiceTemplateColors,

                        quotationTemplate:
                            out.user.quotationTemplate,

                        quotationTemplateColors:
                            out.user.quotationTemplateColors,

                        documentSettings:
                            out.user.documentSettings,
                    }
                    : null,

                /*
                 * Share token
                 */
                token:
                    req.params.token,
            },
        });

    } catch (err) {
        console.error(
            `Public ${docLabel} fetch error:`,
            err
        );

        res.status(500).json({
            success: false,
            message:
                'Failed to load document',
        });
    }
};


/*
 * ============================================================
 * INVOICE ENDPOINTS
 * ============================================================
 */
const streamInvoicePdf = (req, res) =>
    streamDocumentPdf(
        req,
        res,
        {
            Model: Invoice,
            docLabel: 'Invoice',
            numberField: 'invoiceNumber',
        }
    );

const getPublicInvoice = (req, res) =>
    getPublicDocument(
        req,
        res,
        {
            Model: Invoice,
            docLabel: 'Invoice',
            numberField: 'invoiceNumber',
            dueDateField: 'dueDate',
        }
    );


/*
 * ============================================================
 * QUOTATION ENDPOINTS
 * ============================================================
 */
const streamQuotationPdf = (req, res) =>
    streamDocumentPdf(
        req,
        res,
        {
            Model: Quotation,
            docLabel: 'Quotation',
            numberField: 'quotationNumber',
        }
    );

const getPublicQuotation = (req, res) =>
    getPublicDocument(
        req,
        res,
        {
            Model: Quotation,
            docLabel: 'Quotation',
            numberField: 'quotationNumber',
            dueDateField: 'validUntil',
        }
    );


/*
 * ============================================================
 * EXPORTS
 * ============================================================
 */
module.exports = {
    streamInvoicePdf,
    streamQuotationPdf,
    getPublicInvoice,
    getPublicQuotation,
};
