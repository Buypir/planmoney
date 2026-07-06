const express = require('express');
const router = express.Router();

const { register } = require('../controllers/authController');

// POST /auth/register — реєстрація
router.post('/register', register);

module.exports = router;