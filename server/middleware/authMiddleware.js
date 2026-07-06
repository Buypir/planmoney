// Охоронець: перевіряє токен перед доступом до захищених маршрутів
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  // 1. Дістаємо заголовок Authorization
  const authHeader = req.headers.authorization;

  // 2. Перевіряємо, що він є і має формат "Bearer <токен>"
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Токен відсутній. Потрібна авторизація.' });
  }

  // 3. Витягуємо сам токен (прибираємо слово "Bearer ")
  const token = authHeader.split(' ')[1];

  try {
    // 4. Перевіряємо токен тим самим секретом
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 5. Кладемо userId у запит, щоб контролери могли ним користуватись
    req.userId = decoded.userId;

    // 6. Пропускаємо далі (до маршруту)
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Недійсний токен.' });
  }
};

module.exports = authMiddleware;