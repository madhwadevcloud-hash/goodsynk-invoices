const express = require('express');
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
});

const router =
  express.Router();

const {
  protect,
} = require('../middleware/authMiddleware');

const {
  sendQuotationEmail,
} = require('../controllers/emailController');

const {
  checkDocumentLimit,
} = require('../middleware/planLimitMiddleware');

const {
  getQuotations,
  getQuotation,
  createQuotation,
  updateQuotation,
  updateQuotationStatus,
  deleteQuotation,
  convertToInvoice,
} = require('../controllers/quotationController');

// ============================================================================
// AUTHENTICATION
// ============================================================================

router.use(protect);

// ============================================================================
// QUOTATIONS
// ============================================================================

// GET    /api/quotations
// POST   /api/quotations

router
  .route('/')
  .get(getQuotations)
  .post(
    checkDocumentLimit,
    createQuotation
  );

// ============================================================================
// SINGLE QUOTATION
// ============================================================================

// GET    /api/quotations/:id
// PUT    /api/quotations/:id
// DELETE /api/quotations/:id

router
  .route('/:id')
  .get(getQuotation)
  .put(updateQuotation)
  .delete(deleteQuotation);

// ============================================================================
// UPDATE STATUS
// ============================================================================

// PATCH /api/quotations/:id/status

router.patch(
  '/:id/status',
  updateQuotationStatus
);

// ============================================================================
// CONVERT TO INVOICE
// ============================================================================

// POST /api/quotations/:id/convert

router.post(
  '/:id/convert',
  convertToInvoice
);

// ============================================================================
// SEND EMAIL
// ============================================================================

// POST /api/quotations/:id/send-email

router.post(
  '/:id/send-email',
  upload.single('pdf'),
  sendQuotationEmail
);

// ============================================================================
// EXPORT
// ============================================================================

module.exports = router;
