// Підключаємо Express
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

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
const recurringRoutes = require('./routes/recurringRoutes');

// Middleware
const authMiddleware = require('./middleware/authMiddleware');

// Створюємо застосунок (наш сервер)
const app = express();

// Порт (хостинг сам призначає порт через змінну середовища PORT)
const PORT = process.env.PORT || 3000;

// Базові безпекові HTTP-заголовки
app.use(helmet());

// Дозволяємо крос-доменні запити лише з фронтенду (список через кому в CORS_ORIGIN)
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map((o) => o.trim());
app.use(cors({
  origin: (origin, callback) => {
    // без Origin (напр. curl, мобільні клієнти) — дозволяємо
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Заборонено CORS-політикою'));
  },
}));

// Дозволяємо серверу читати JSON із запитів (обмежуємо розмір тіла запиту)
app.use(express.json({ limit: '100kb' }));

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
app.use('/recurrings', authMiddleware, recurringRoutes);

// Уловлює всі необроблені помилки — щоб клієнту не потрапляв stack trace
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.message === 'Заборонено CORS-політикою') {
    return res.status(403).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'Внутрішня помилка сервера' });
});

// Запускаємо сервер
app.listen(PORT, () => {
  console.log(`Сервер працює: http://localhost:${PORT}`);
});
