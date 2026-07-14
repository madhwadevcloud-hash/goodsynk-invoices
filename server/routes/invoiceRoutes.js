const express = require('express');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const { sendInvoiceEmail } = require('../controllers/emailController');
const { checkDocumentLimit } = require('../middleware/planLimitMiddleware');

const router = express.Router();
const {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  updateInvoiceStatus,
  deleteInvoice,
  getStats,
  getUsage,
} = require('../controllers/invoiceController'); // ← sendEmailWithPDF removed from here


const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/stats', getStats);
router.route('/').get(getInvoices).post(createInvoice);
router.route('/:id').get(getInvoice).put(updateInvoice).delete(deleteInvoice);
router.patch('/:id/status', updateInvoiceStatus);
router.post('/:id/send-email', upload.single('pdf'), sendInvoiceEmail);
router.post('/', protect, checkDocumentLimit, createInvoice);
router.get('/usage', protect, getUsage);

module.exports = router;