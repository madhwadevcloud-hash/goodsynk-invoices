const nodemailer = require('nodemailer');
const Invoice = require('../models/Invoice');
const Quotation = require('../models/Quotation');
const { generateShareToken } = require('../utils/shareToken');
const { buildDocumentEmailHTML, CURRENCY_SYMBOLS } = require('../utils/emailTemplates');

const transporter = process.env.EMAIL_SERVICE
    ? nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
    : nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

const FROM_EMAIL = process.env.SMTP_USER;

const sendDocumentEmail = async (req, res, { Model, docLabel, numberField, dueDateField, dueDateLabel }) => {
    try {
        const { to, cc, subject, body, viewUrl } = req.body;
        const pdfFile = req.file;

        if (!to || !pdfFile) {
            return res.status(400).json({ success: false, message: 'Missing required fields: to, pdf' });
        }

        const doc = await Model.findOne({ _id: req.params.id, user: req.user._id }).populate('client', 'name email');
        if (!doc) {
            return res.status(404).json({ success: false, message: `${docLabel} not found` });
        }

        const businessName = req.user.businessName || 'Your Business';
        const docNumber = doc[numberField];
        const dueDateRaw = doc[dueDateField];

        if (!doc.shareToken) {
            doc.shareToken = generateShareToken();
            await doc.save();
        }
        const publicViewUrl = viewUrl || `${process.env.PUBLIC_CLIENT_URL}/share/${docLabel.toLowerCase()}/${doc.shareToken}`;

        const currencySymbol = CURRENCY_SYMBOLS[doc.currency] || doc.currency || '₹';

        const html = buildDocumentEmailHTML({
            businessName,
            docLabel,
            docNumber,
            docDate: doc.issueDate ? new Date(doc.issueDate).toLocaleDateString('en-IN') : '—',
            dueDateLabel,
            dueDateValue: dueDateRaw ? new Date(dueDateRaw).toLocaleDateString('en-IN') : '—',
            amount: doc.total,
            currencySymbol,
            viewUrl: publicViewUrl,
            replyToEmail: req.user.email,
            clientName: doc.client?.name,
            body,
        });

        await transporter.sendMail({
            from: `${businessName} <${FROM_EMAIL}>`,
            to,
            cc: cc !== undefined ? cc : req.user.email,
            replyTo: req.user.email,
            subject: subject || `${docLabel} #${docNumber} from ${businessName}`,
            html,
            attachments: [{ filename: pdfFile.originalname, content: pdfFile.buffer }],
        });

        res.json({ success: true, message: 'Email sent successfully' });
    } catch (err) {
        console.error(`send${docLabel}Email error:`, err);
        res.status(500).json({ success: false, message: err.message || 'Failed to send email' });
    }
};

const sendInvoiceEmail = (req, res) =>
    sendDocumentEmail(req, res, { Model: Invoice, docLabel: 'Invoice', numberField: 'invoiceNumber', dueDateField: 'dueDate', dueDateLabel: 'Due Date' });

const sendQuotationEmail = (req, res) =>
    sendDocumentEmail(req, res, { Model: Quotation, docLabel: 'Quotation', numberField: 'quotationNumber', dueDateField: 'validUntil', dueDateLabel: 'Valid Until' });

module.exports = { sendInvoiceEmail, sendQuotationEmail };