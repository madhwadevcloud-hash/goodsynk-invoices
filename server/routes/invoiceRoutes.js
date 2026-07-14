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
} = require('../controllers/invoiceController');

const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// Literal paths MUST come before '/:id' so Express doesn't treat them as an id
router.get('/stats', getStats);
router.get('/usage', getUsage); // protect already applied via router.use above

router.route('/').get(getInvoices).post(checkDocumentLimit, createInvoice);
router.route('/:id').get(getInvoice).put(updateInvoice).delete(deleteInvoice);
router.patch('/:id/status', updateInvoiceStatus);
router.post('/:id/send-email', upload.single('pdf'), sendInvoiceEmail);

module.exports = router;