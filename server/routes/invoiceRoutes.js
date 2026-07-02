const express = require('express');
const router = express.Router();
const {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  updateInvoiceStatus,
  deleteInvoice,
  getStats,
} = require('../controllers/invoiceController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // All invoice routes require authentication

router.get('/stats', getStats);
router.route('/').get(getInvoices).post(createInvoice);
router.route('/:id').get(getInvoice).put(updateInvoice).delete(deleteInvoice);
router.patch('/:id/status', updateInvoiceStatus);

module.exports = router;
