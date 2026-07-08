const express = require('express');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getQuotations,
  getQuotation,
  createQuotation,
  updateQuotation,
  updateQuotationStatus,
  deleteQuotation,
  convertToInvoice,
} = require('../controllers/quotationController'); // ← sendEmailWithPDF removed from here


router.use(protect);

router.route('/').get(getQuotations).post(createQuotation);
router.route('/:id').get(getQuotation).put(updateQuotation).delete(deleteQuotation);
router.route('/:id/status').patch(updateQuotationStatus);
router.route('/:id/convert').post(convertToInvoice);


module.exports = router;