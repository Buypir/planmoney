// Підключаємо Express
const express = require('express');
const cors = require('cors');

// Підключаємо наші маршрути
const homeRoutes = require('./routes/homeRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const taskRoutes = require('./routes/taskRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const authRoutes = require('./routes/authRoutes');
const goalRoutes = require('./routes/goalRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const accountRoutes = require('./routes/accountRoutes');
const exchangeRateRoutes = require('./routes/exchangeRateRoutes');

// Middleware
const authMiddleware = require('./middleware/authMiddleware');

// Створюємо застосунок (наш сервер)
const app = express();

// Порт
const PORT = 3000;

// Дозволяємо крос-доменні запити (фронт <-> бекенд)
app.use(cors());

// Дозволяємо серверу читати JSON із запитів
app.use(express.json());

// Підключаємо маршрути
app.use('/', homeRoutes);
app.use('/transactions', authMiddleware, transactionRoutes);
app.use('/tasks', authMiddleware, taskRoutes);
app.use('/categories', authMiddleware, categoryRoutes);
app.use('/auth', authRoutes);
app.use('/goals', authMiddleware, goalRoutes);
app.use('/settings', authMiddleware, settingsRoutes);
app.use('/accounts', authMiddleware, accountRoutes);
app.use('/exchange-rates', authMiddleware, exchangeRateRoutes);

// Запускаємо сервер
app.listen(PORT, () => {
  console.log(`Сервер працює: http://localhost:${PORT}`);
});
