// Логіка авторизації
const prisma = require('../prismaClient');
const bcrypt = require('bcrypt');

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

module.exports = { register };