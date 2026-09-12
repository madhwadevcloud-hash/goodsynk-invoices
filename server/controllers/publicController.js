const React = require('react');
const { pdf } = require('@react-pdf/renderer');
const Invoice = require('../models/Invoice');
const Quotation = require('../models/Quotation');
const TemplateResolver = require('../pdfTemplates/templates/TemplateResolver.jsx').default;
const buildInvoiceForPDF = (doc, docLabel) => ({
    ...doc.toObject(),
    invoiceType: docLabel.toLowerCase(),
    _currency: doc.currency || 'INR',
    _taxType: doc.taxType,
});

// Mirrors client/src/pages/invoices/templates/TemplateResolver.jsx, which applies
// the owner's documentSettings (watermark + discount-column visibility) to an
// invoice before handing it to a template. That resolver reads from the
// browser's localStorage, which this server process has no access to — so for
// the public share-link PDF (the only server-side render path in this app) we
// apply the same settings here, sourced from the owner's account instead.
const applyDocumentSettings = (invoiceForPDF, documentSettings) => {
    const settings = documentSettings || {};
    const isDiscColumnVisible = !settings.hideDiscount && settings.showDiscountColumn !== false;

    let processed = {
        ...invoiceForPDF,
        watermarkImage: invoiceForPDF.watermarkImage || settings.watermarkImage || undefined,
    };

    if (!isDiscColumnVisible) {
        processed = {
            ...processed,
            discountAmount: 0,
            itemDiscount: 0,
            overallDiscTotal: 0,
            hideDiscount: true,
            hideDiscountColumn: true,
            items: processed.items?.map((item) => ({ ...item, discount: 0 })),
        };
    }

    return processed;
};

// Helper: collect a readable stream into a Buffer
const streamToBuffer = (stream) =>
    new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
    });

// ── Raw PDF stream (used by the Download button) ──
const streamDocumentPdf = async (req, res, { Model, docLabel, numberField }) => {
    try {
        const doc = await Model.findOne({ shareToken: req.params.token, isDeleted: { $ne: true } })
            .populate('client')
            .populate('user', 'name email businessName businessLogo businessSignature businessSeal address gstin phone bankDetails invoiceTemplate invoiceTemplateColors quotationTemplate quotationTemplateColors plan documentSettings');

        if (!doc) return res.status(404).send('Document not found or link expired');

        const invoiceForPDF = applyDocumentSettings(buildInvoiceForPDF(doc, docLabel), doc.user?.documentSettings);
        // In @react-pdf/renderer v4, toBuffer() returns a readable stream — collect it into a Buffer
        const pdfStream = await pdf(React.createElement(TemplateResolver, { invoice: invoiceForPDF })).toBuffer();
        const buffer = await streamToBuffer(pdfStream);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${docLabel}-${doc[numberField]}.pdf"`);
        res.setHeader('Content-Length', buffer.length);
        res.send(buffer);
    } catch (err) {
        console.error(`Public ${docLabel} PDF error:`, err);
        res.status(500).send('Failed to generate PDF');
    }
};


// ── JSON summary (used by the public share page) ──
const getPublicDocument = async (req, res, { Model, docLabel, numberField, dueDateField }) => {
    try {
        const doc = await Model.findOne({ shareToken: req.params.token, isDeleted: { $ne: true } })
            .populate('client', 'name email phone')
            .populate('user', 'name email businessName businessLogo');

        if (!doc) return res.status(404).json({ success: false, message: 'Document not found or link expired' });

        const out = doc.toObject();
        res.json({
            success: true,
            document: {
                docLabel,
                number: out[numberField],
                date: out.issueDate,
                dueDate: out[dueDateField],
                status: out.status,
                total: out.total,
                currency: out.currency,
                subtotal: out.subtotal,
                taxTotal: out.taxTotal,
                items: out.items,
                client: out.client,
                businessName: out.user?.businessName,
                businessLogo: out.user?.businessLogo || null,
                token: req.params.token,
            },
        });
    } catch (err) {
        console.error(`Public ${docLabel} fetch error:`, err);
        res.status(500).json({ success: false, message: 'Failed to load document' });
    }
};

const streamInvoicePdf = (req, res) =>
    streamDocumentPdf(req, res, { Model: Invoice, docLabel: 'Invoice', numberField: 'invoiceNumber' });
const streamQuotationPdf = (req, res) =>
    streamDocumentPdf(req, res, { Model: Quotation, docLabel: 'Quotation', numberField: 'quotationNumber' });
const getPublicInvoice = (req, res) =>
    getPublicDocument(req, res, { Model: Invoice, docLabel: 'Invoice', numberField: 'invoiceNumber', dueDateField: 'dueDate' });
const getPublicQuotation = (req, res) =>
    getPublicDocument(req, res, { Model: Quotation, docLabel: 'Quotation', numberField: 'quotationNumber', dueDateField: 'validUntil' });

module.exports = { streamInvoicePdf, streamQuotationPdf, getPublicInvoice, getPublicQuotation };