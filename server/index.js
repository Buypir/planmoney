// Підключаємо Express
const express = require('express');

// Підключаємо наші маршрути
const homeRoutes = require('./routes/homeRoutes');
const transactionRoutes = require('./routes/transactionRoutes');

// Створюємо застосунок (наш сервер)
const app = express();

// Порт
const PORT = 3000;

// Дозволяємо серверу читати JSON із запитів (потрібно для POST)
app.use(express.json());

// Підключаємо маршрути
app.use('/', homeRoutes);
app.use('/transactions', transactionRoutes);

// Запускаємо сервер
app.listen(PORT, () => {
  console.log(`Сервер працює: http://localhost:${PORT}`);
});