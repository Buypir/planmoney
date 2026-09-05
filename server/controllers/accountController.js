// Логіка для рахунків користувача
const prisma = require('../prismaClient');

// Отримати всі рахунки користувача
const getAllAccounts = async (req, res) => {
  const accounts = await prisma.account.findMany({ where: { userId: req.userId } });
  res.json(accounts);
};

// Створити новий рахунок
const createAccount = async (req, res) => {
  const { name, currency } = req.body;
  const newAccount = await prisma.account.create({
    data: { name, currency: currency || 'UAH', userId: req.userId },
  });
  res.json(newAccount);
};

// Видалити рахунок за id (лише якщо він належить поточному користувачу)
const deleteAccount = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.account.delete({ where: { id: Number(id), userId: req.userId } });
    res.json({ message: 'Рахунок видалено' });
  } catch {
    res.status(404).json({ error: 'Рахунок не знайдено' });
  }
};

module.exports = { getAllAccounts, createAccount, deleteAccount };
