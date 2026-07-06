// Логіка авторизації
const prisma = require('../prismaClient');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Реєстрація нового користувача
const register = async (req, res) => {
  const { email, name, password } = req.body;

  // 1. Перевіряємо, чи такий email уже зайнятий
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(400).json({ error: 'Користувач з таким email вже існує' });
  }

  // 2. Хешуємо пароль (10 — "складність" хешування)
  const hashedPassword = await bcrypt.hash(password, 10);

  // 3. Створюємо користувача вже з хешованим паролем
  const newUser = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
    },
  });

  // 4. Віддаємо дані користувача, але БЕЗ пароля (навіть хешованого)
  res.status(201).json({
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
  });
};

// Вхід користувача
const login = async (req, res) => {
  const { email, password } = req.body;

  // 1. Знаходимо користувача за email
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(400).json({ error: 'Невірний email або пароль' });
  }

  // 2. Порівнюємо введений пароль із хешем у базі
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(400).json({ error: 'Невірний email або пароль' });
  }

  // 3. Створюємо токен (перепустку) на 7 днів
  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  // 4. Віддаємо токен і дані користувача (без пароля)
  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name },
  });
};

module.exports = { register, login };