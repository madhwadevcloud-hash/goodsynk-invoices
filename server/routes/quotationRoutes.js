const express = require('express');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { sendQuotationEmail } = require('../controllers/emailController');
const {
  getQuotations,
  getQuotation,
  createQuotation,
  updateQuotation,
  updateQuotationStatus,
  deleteQuotation,
  convertToInvoice,
} = require('../controllers/quotationController');

router.use(protect);

router.route('/').get(getQuotations).post(createQuotation);
router.route('/:id').get(getQuotation).put(updateQuotation).delete(deleteQuotation);
router.route('/:id/status').patch(updateQuotationStatus);
router.route('/:id/convert').post(convertToInvoice);
router.post('/:id/send-email', upload.single('pdf'), sendQuotationEmail);

module.exports = router;