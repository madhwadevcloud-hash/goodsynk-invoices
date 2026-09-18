const express = require('express');

const router = express.Router();

const {
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
} = require('../controllers/clientController');

const {
  protect,
} = require('../middleware/authMiddleware');

// All client routes require authentication
router.use(protect);

// ─────────────────────────────────────────────────────────────
// GET    /api/clients
// POST   /api/clients
// ─────────────────────────────────────────────────────────────
router
  .route('/')
  .get(getClients)
  .post(createClient);

// ─────────────────────────────────────────────────────────────
// GET    /api/clients/:id
// PUT    /api/clients/:id
// DELETE /api/clients/:id
// ─────────────────────────────────────────────────────────────
router
  .route('/:id')
  .get(getClient)
  .put(updateClient)
  .delete(deleteClient);

module.exports = router;
