const nodemailer = require('nodemailer');
const Invoice = require('../models/Invoice');

let cachedTransporter = null;
const getTransporter = () => {
    if (cachedTransporter) return cachedTransporter;
    cachedTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465, // true only for port 465
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
    return cachedTransporter;
};

// @desc    Send an invoice or quotation as an email with the PDF attached
// @route   POST /api/invoices/:id/send-email
// @route   POST /api/quotations/:id/send-email
// @access  Private
const sendEmailWithPDF = async (req, res) => {
    try {
        const { to, subject, body } = req.body;
        const pdfFile = req.file; // populated by multer

        if (!to || !subject || !pdfFile) {
            return res.status(400).json({ success: false, message: 'Missing required fields: to, subject, pdf' });
        }

        // Make sure this document exists and belongs to the requesting user
        const doc = await Invoice.findOne({ _id: req.params.id, user: req.user._id });
        if (!doc) {
            return res.status(404).json({ success: false, message: 'Document not found' });
        }

        const transporter = getTransporter();

        await transporter.sendMail({
            from: `"${req.user.businessName || 'Your Business'}" <${process.env.SMTP_USER}>`,
            to,
            subject,
            text: body,
            attachments: [
                {
                    filename: pdfFile.originalname,
                    content: pdfFile.buffer,
                },
            ],
        });

        res.json({ success: true, message: 'Email sent successfully' });
    } catch (err) {
        console.error('sendEmailWithPDF error:', err);
        res.status(500).json({ success: false, message: err.message || 'Failed to send email' });
    }
};

module.exports = { sendEmailWithPDF };