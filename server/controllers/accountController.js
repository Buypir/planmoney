// Логіка для рахунків користувача
const prisma = require('../prismaClient');
const { validateAccount } = require('../validation');

// Отримати всі рахунки користувача
const getAllAccounts = async (req, res) => {
  const accounts = await prisma.account.findMany({ where: { userId: req.userId } });
  res.json(accounts);
};

// Створити новий рахунок
const createAccount = async (req, res) => {
  const { name, currency } = req.body;

  const invalid = validateAccount({ name, currency });
  if (invalid) return res.status(400).json({ error: invalid });

  const newAccount = await prisma.account.create({
    data: { name, currency: currency || 'UAH', userId: req.userId },
  });
  res.json(newAccount);
};

// Заархівувати або повернути рахунок
const setArchived = async (req, res) => {
  const { id } = req.params;
  const { archived } = req.body;

  try {
    const updated = await prisma.account.update({
      where: { id: Number(id), userId: req.userId },
      data: { archived: Boolean(archived) },
    });
    res.json(updated);
  } catch {
    res.status(404).json({ error: 'Рахунок не знайдено' });
  }
};

// Видалити рахунок можна лише поки на ньому немає операцій — інакше вони
// втратили б прив'язку до валюти й зіпсували б усі підрахунки. Решту архівуємо.
const deleteAccount = async (req, res) => {
  const { id } = req.params;
  const accountId = Number(id);

  const account = await prisma.account.findUnique({ where: { id: accountId, userId: req.userId } });
  if (!account) return res.status(404).json({ error: 'Рахунок не знайдено' });

  const linked = await prisma.transaction.count({
    where: { userId: req.userId, OR: [{ accountId }, { toAccountId: accountId }] },
  });
  if (linked > 0) {
    return res.status(409).json({
      error: `На рахунку є операції (${linked}). Заархівуй його — історія збережеться.`,
    });
  }

  await prisma.account.delete({ where: { id: accountId } });
  res.json({ message: 'Рахунок видалено' });
};

module.exports = { getAllAccounts, createAccount, deleteAccount, setArchived };
