const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const { register, login, getMe, updateProfile, deleteMe } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Обмеження спроб входу/реєстрації — захист від перебору паролів
// (лише для /login і /register, не для /me, який викликається на кожному завантаженні сторінки)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Забагато спроб. Спробуй пізніше.' },
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', authMiddleware, getMe);
router.put('/me', authMiddleware, updateProfile);
router.delete('/me', authMiddleware, deleteMe);

module.exports = router;