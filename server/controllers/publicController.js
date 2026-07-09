const React = require('react');
const { pdf } = require('@react-pdf/renderer');
const Invoice = require('../models/Invoice');
const Quotation = require('../models/Quotation');
const InvoicePDF = require('../pdfTemplates/InvoicePDF.jsx').default;

const buildInvoiceForPDF = (doc, docLabel) => ({
    ...doc.toObject(),
    invoiceType: docLabel.toLowerCase(),
    _currency: doc.currency || 'INR',
    _taxType: doc.taxType,
});

// ── Raw PDF stream (used by the Download button) ──
const streamDocumentPdf = async (req, res, { Model, docLabel, numberField }) => {
    try {
        const doc = await Model.findOne({ shareToken: req.params.token })
            .populate('client')
            .populate('user', 'name email businessName businessLogo businessSignature address gstin phone bankDetails invoiceTemplate invoiceTemplateColors');

        if (!doc) return res.status(404).send('Document not found or link expired');

        const invoiceForPDF = buildInvoiceForPDF(doc, docLabel);
        const instance = pdf(React.createElement(InvoicePDF, { invoice: invoiceForPDF }));
        const buffer = await instance.toBuffer();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${docLabel}-${doc[numberField]}.pdf"`);
        res.send(buffer);
    } catch (err) {
        console.error(`Public ${docLabel} PDF error:`, err);
        res.status(500).send('Failed to generate PDF');
    }
};

// ── JSON summary (used by the public share page) ──
const getPublicDocument = async (req, res, { Model, docLabel, numberField, dueDateField }) => {
    try {
        const doc = await Model.findOne({ shareToken: req.params.token })
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