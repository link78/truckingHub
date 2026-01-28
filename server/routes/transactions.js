const express = require('express');
const {
  createTransaction,
  getTransactions,
  getTransaction,
  updateTransactionStatus,
} = require('../controllers/transactionController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router
  .route('/')
  .get(protect, getTransactions)
  .post(protect, createTransaction);

router.get('/:id', protect, getTransaction);
router.put('/:id/status', protect, updateTransactionStatus);

module.exports = router;
