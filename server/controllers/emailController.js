const { Resend } = require('resend');
const Invoice = require('../models/Invoice');
const Quotation = require('../models/Quotation');
const { generateShareToken } = require('../utils/shareToken');
const { buildDocumentEmailHTML, CURRENCY_SYMBOLS } = require('../utils/emailTemplates');

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');

const FROM_EMAIL = 'no-reply@goodsynk.com';
const EMAIL_UNDO_WINDOW_MS = 10_000;
const pendingEmails = new Map();

const sendQueuedEmail = (id, message, userId, documentId) => {
    const timer = setTimeout(async () => {
        pendingEmails.delete(id);
        try {
            const { error } = await resend.emails.send(message);
            if (error) console.error('Queued email delivery failed:', error.message || error);
        } catch (error) {
            console.error('Queued email delivery failed:', error.message || error);
        }
    }, EMAIL_UNDO_WINDOW_MS);
    pendingEmails.set(id, { timer, userId, documentId });
};

const cancelQueuedEmail = (req, res) => {
    const queued = pendingEmails.get(req.params.emailId);
    if (!queued || queued.userId !== String(req.user._id) || queued.documentId !== req.params.id) {
        return res.status(404).json({ success: false, message: 'Email is no longer available to undo' });
    }
    clearTimeout(queued.timer);
    pendingEmails.delete(req.params.emailId);
    return res.json({ success: true, message: 'Email canceled' });
};

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

        const emailId = require('crypto').randomUUID();
        const email = {
            from: `${businessName} <${FROM_EMAIL}>`,
            to: (Array.isArray(to) ? to : String(to).split(/[;,\n]+/)).map((email) => email.trim()).filter(Boolean),
            cc: cc === undefined ? req.user.email : (Array.isArray(cc) ? cc : String(cc).split(/[;,\n]+/)).map((email) => email.trim()).filter(Boolean),
            // No reply_to set — this keeps the address strictly one-way (no-reply).
            // Any reply attempt from the client will bounce rather than reach req.user.email.
            subject: subject || `${docLabel} #${docNumber} from ${businessName}`,
            html,
            attachments: [
                {
                    filename: pdfFile.originalname,
                    content: pdfFile.buffer.toString('base64'),
                },
            ],
        };
        sendQueuedEmail(emailId, email, String(req.user._id), req.params.id);

        res.json({ success: true, message: 'Email queued', id: emailId, undoWindowMs: EMAIL_UNDO_WINDOW_MS });
    } catch (err) {
        console.error(`send${docLabel}Email error:`, err);
        res.status(500).json({ success: false, message: err.message || 'Failed to send email' });
    }
};

const sendInvoiceEmail = (req, res) =>
    sendDocumentEmail(req, res, { Model: Invoice, docLabel: 'Invoice', numberField: 'invoiceNumber', dueDateField: 'dueDate', dueDateLabel: 'Due Date' });

const sendQuotationEmail = (req, res) =>
    sendDocumentEmail(req, res, { Model: Quotation, docLabel: 'Quotation', numberField: 'quotationNumber', dueDateField: 'validUntil', dueDateLabel: 'Valid Until' });

module.exports = { sendInvoiceEmail, sendQuotationEmail, cancelQueuedEmail };
