const express = require('express');
const router = express.Router();

const { getAllAccounts, createAccount, deleteAccount } = require('../controllers/accountController');

// GET /accounts — список
router.get('/', getAllAccounts);

// POST /accounts — додати
router.post('/', createAccount);

// DELETE /accounts/:id — видалити
router.delete('/:id', deleteAccount);

module.exports = router;
