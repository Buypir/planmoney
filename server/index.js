// Підключаємо Express
const express = require('express');

// Створюємо застосунок (наш сервер)
const app = express();

// Порт, на якому працюватиме сервер
const PORT = 3000;

// Маршрут: коли хтось заходить на головну адресу "/" — відповідаємо текстом
app.get('/', (req, res) => {
  res.send('Привіт! Сервер PlanMoney працює !!! 🎉');
});

// Запускаємо сервер і слухаємо запити на вказаному порту
app.listen(PORT, () => {
  console.log(`Сервер працює: http://localhost:${PORT}`);
});