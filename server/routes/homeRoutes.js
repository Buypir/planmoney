// Маршрути: які адреси існують і який контролер їх обробляє

const express = require('express');
const router = express.Router();

// Підключаємо наш контролер
const { getHome } = require('../controllers/homeController');

// Коли GET-запит на "/" — викликати функцію getHome з контролера
router.get('/', getHome);

// Віддаємо маршрути назовні
module.exports = router;