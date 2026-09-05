const express = require('express');
const router = express.Router();

const { getAllAccounts, createAccount, deleteAccount, setArchived } = require('../controllers/accountController');

// GET /accounts — список
router.get('/', getAllAccounts);

// POST /accounts — додати
router.post('/', createAccount);

// PUT /accounts/:id/archive — заархівувати або повернути
router.put('/:id/archive', setArchived);

// DELETE /accounts/:id — видалити (лише порожній)
router.delete('/:id', deleteAccount);

module.exports = router;
