const Client = require('../models/Client');
const Invoice = require('../models/Invoice');
const Quotation = require('../models/Quotation');
const { getLimits } = require('../utils/planLimits');

const checkClientLimit = async (req, res, next) => {
    try {
        const limits = getLimits(req.user.plan);
        if (limits.clients === Infinity) return next();

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const count = await Client.countDocuments({ user: req.user._id, createdAt: { $gte: startOfMonth } });
        if (count >= limits.clients) {
            return res.status(403).json({
                success: false,
                code: 'PLAN_LIMIT_CLIENTS',
                message: `Your ${req.user.plan} plan allows up to ${limits.clients} clients per month. Upgrade to add more.`,
            });
        }
        next();
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const checkDocumentLimit = async (req, res, next) => {
    try {
        const limits = getLimits(req.user.plan);
        if (limits.invoicesPerMonth === Infinity) return next();

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const [invoiceCount, quotationCount] = await Promise.all([
            Invoice.countDocuments({ user: req.user._id, createdAt: { $gte: startOfMonth } }),
            Quotation.countDocuments({ user: req.user._id, createdAt: { $gte: startOfMonth } }),
        ]);

        if (invoiceCount + quotationCount >= limits.invoicesPerMonth) {
            return res.status(403).json({
                success: false,
                code: 'PLAN_LIMIT_DOCUMENTS',
                message: `Your ${req.user.plan} plan allows up to ${limits.invoicesPerMonth} invoices & quotations per month. Upgrade to add more.`,
            });
        }
        next();
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { checkClientLimit, checkDocumentLimit };