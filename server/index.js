// Підключаємо Express
const express = require('express');

// Підключаємо наші маршрути
const homeRoutes = require('./routes/homeRoutes');

// Підключаємо базу даних
const prisma = require('./prismaClient');

// Створюємо застосунок (наш сервер)
const app = express();

// Порт, на якому працюватиме сервер
const PORT = 3000;

// Підключаємо маршрути до сервера
app.use('/', homeRoutes);

// Запускаємо сервер
app.listen(PORT, () => {
  console.log(`Сервер працює: http://localhost:${PORT}`);
});