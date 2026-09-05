// Логіка для транзакцій
const prisma = require('../prismaClient');

// Перевіряє, що рахунок (якщо вказаний) належить поточному користувачу
const verifyOwnAccounts = async (userId, ...accountIds) => {
  const ids = accountIds.filter((id) => id !== undefined && id !== null);
  if (ids.length === 0) return true;
  const count = await prisma.account.count({ where: { id: { in: ids }, userId } });
  return count === new Set(ids).size;
};

// Отримати всі транзакції
const getAllTransactions = async (req, res) => {
  const transactions = await prisma.transaction.findMany({
    where: { userId: req.userId },
  });
  res.json(transactions);
};

// Додати нову транзакцію
const createTransaction = async (req, res) => {
  const { amount, type, category, note, status, accountId, toAccountId } = req.body;

  if (!(await verifyOwnAccounts(req.userId, accountId, toAccountId))) {
    return res.status(403).json({ error: 'Рахунок не знайдено' });
  }

  const newTransaction = await prisma.transaction.create({
    data: {
      amount,
      type,
      category,
      note,
      status: status || undefined,
      accountId: accountId ?? undefined,
      toAccountId: toAccountId ?? undefined,
      userId: req.userId, // було: userId: 1
    },
  });

  res.json(newTransaction);
};

// Оновити транзакцію за id (лише якщо вона належить поточному користувачу)
const updateTransaction = async (req, res) => {
  const { id } = req.params;
  const { amount, type, category, note, status, accountId, toAccountId } = req.body;

  if (!(await verifyOwnAccounts(req.userId, accountId, toAccountId))) {
    return res.status(403).json({ error: 'Рахунок не знайдено' });
  }

  try {
    const updated = await prisma.transaction.update({
      where: { id: Number(id), userId: req.userId },
      data: { amount, type, category, note, status, accountId, toAccountId },
    });
    res.json(updated);
  } catch {
    res.status(404).json({ error: 'Транзакцію не знайдено' });
  }
};

// Видалити транзакцію за id (лише якщо вона належить поточному користувачу)
const deleteTransaction = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.transaction.delete({ where: { id: Number(id), userId: req.userId } });
    res.json({ message: 'Транзакцію видалено' });
  } catch {
    res.status(404).json({ error: 'Транзакцію не знайдено' });
  }
};

module.exports = { getAllTransactions, createTransaction, updateTransaction, deleteTransaction };