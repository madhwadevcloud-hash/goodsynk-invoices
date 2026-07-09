const express = require('express');
const router = express.Router();
const {
    streamInvoicePdf,
    streamQuotationPdf,
    getPublicInvoice,
    getPublicQuotation,
} = require('../controllers/publicController');

router.get('/invoice/:token', getPublicInvoice);
router.get('/invoice/:token/pdf', streamInvoicePdf);
router.get('/quotation/:token', getPublicQuotation);
router.get('/quotation/:token/pdf', streamQuotationPdf);

module.exports = router;