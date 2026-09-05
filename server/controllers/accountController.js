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

// Видалити рахунок за id
const deleteAccount = async (req, res) => {
  const { id } = req.params;
  await prisma.account.delete({ where: { id: Number(id) } });
  res.json({ message: 'Рахунок видалено' });
};

module.exports = { getAllAccounts, createAccount, deleteAccount };
