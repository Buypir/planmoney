// Логіка авторизації
const prisma = require('../prismaClient');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Реєстрація нового користувача
const register = async (req, res) => {
  const { email, name, password } = req.body;

  if (!email || !EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: 'Некоректний email' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Пароль має містити щонайменше 6 символів' });
  }

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

  if (!email || !password) {
    return res.status(400).json({ error: 'Невірний email або пароль' });
  }

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

// Отримати профіль поточного користувача
const getMe = async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  res.json({ id: user.id, email: user.email, name: user.name });
};

// Оновити ім'я поточного користувача
const updateProfile = async (req, res) => {
  const { name } = req.body;

  const updated = await prisma.user.update({
    where: { id: req.userId },
    data: { name },
  });

  res.json({ id: updated.id, email: updated.email, name: updated.name });
};

// Видалити власний акаунт разом з усіма даними. Пароль перепитуємо, щоб
// чужа людина не стерла все з відкритої вкладки.
const deleteMe = async (req, res) => {
  const { password } = req.body;

  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) return res.status(404).json({ error: 'Користувача не знайдено' });

  if (!password || !(await bcrypt.compare(password, user.password))) {
    return res.status(400).json({ error: 'Невірний пароль' });
  }

  // Порядок важливий: спершу те, що посилається на інші таблиці
  await prisma.$transaction([
    prisma.transaction.deleteMany({ where: { userId: req.userId } }),
    prisma.account.deleteMany({ where: { userId: req.userId } }),
    prisma.task.deleteMany({ where: { userId: req.userId } }),
    prisma.category.deleteMany({ where: { userId: req.userId } }),
    prisma.goal.deleteMany({ where: { userId: req.userId } }),
    prisma.setting.deleteMany({ where: { userId: req.userId } }),
    prisma.user.delete({ where: { id: req.userId } }),
  ]);

  res.json({ message: 'Акаунт видалено' });
};

module.exports = { register, login, getMe, updateProfile, deleteMe };