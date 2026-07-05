const express = require('express');
const router = express.Router();

const {
  getAllTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} = require('../controllers/transactionController');

// GET /transactions — список
router.get('/', getAllTransactions);

// POST /transactions — додати
router.post('/', createTransaction);

// PUT /transactions/:id — оновити конкретну
router.put('/:id', updateTransaction);

// DELETE /transactions/:id — видалити конкретну
router.delete('/:id', deleteTransaction);

module.exports = router;