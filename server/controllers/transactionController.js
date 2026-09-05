// Логіка для транзакцій
const prisma = require('../prismaClient');
const { getRates } = require('./exchangeRateController');
const { validateTransaction } = require('../validation');

// Перевіряє, що рахунок (якщо вказаний) належить поточному користувачу
const verifyOwnAccounts = async (userId, ...accountIds) => {
  const ids = accountIds.filter((id) => id !== undefined && id !== null);
  if (ids.length === 0) return true;
  const count = await prisma.account.count({ where: { id: { in: ids }, userId } });
  return count === new Set(ids).size;
};

// Скільки надійде на рахунок-отримувач у його валюті. Курс НБУ фіксується
// на момент операції — інакше сума старого переказу «пливла б» разом із курсом.
const convertForTransfer = async (amount, fromAccountId, toAccountId) => {
  if (!fromAccountId || !toAccountId) return amount;

  const [from, to] = await Promise.all([
    prisma.account.findUnique({ where: { id: fromAccountId } }),
    prisma.account.findUnique({ where: { id: toAccountId } }),
  ]);
  if (!from || !to || from.currency === to.currency) return amount;

  const rates = await getRates();
  const inUAH = amount * (from.currency === 'UAH' ? 1 : rates[from.currency]);
  const converted = to.currency === 'UAH' ? inUAH : inUAH / rates[to.currency];
  return Math.round(converted);
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

  const invalid = validateTransaction({ amount, type, category, note, accountId, toAccountId });
  if (invalid) return res.status(400).json({ error: invalid });

  if (!(await verifyOwnAccounts(req.userId, accountId, toAccountId))) {
    return res.status(403).json({ error: 'Рахунок не знайдено' });
  }

  let toAmount;
  if (type === 'transfer') {
    try {
      toAmount = await convertForTransfer(amount, accountId, toAccountId);
    } catch {
      return res.status(502).json({ error: 'Не вдалося отримати курс НБУ для переказу. Спробуй пізніше.' });
    }
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
      toAmount,
      userId: req.userId, // було: userId: 1
    },
  });

  res.json(newTransaction);
};

// Оновити транзакцію за id (лише якщо вона належить поточному користувачу)
const updateTransaction = async (req, res) => {
  const { id } = req.params;
  const { amount, type, category, note, status, accountId, toAccountId } = req.body;

  const invalid = validateTransaction({ amount, type, category, note, accountId, toAccountId });
  if (invalid) return res.status(400).json({ error: invalid });

  if (!(await verifyOwnAccounts(req.userId, accountId, toAccountId))) {
    return res.status(403).json({ error: 'Рахунок не знайдено' });
  }

  let toAmount = null;
  if (type === 'transfer') {
    try {
      toAmount = await convertForTransfer(amount, accountId, toAccountId);
    } catch {
      return res.status(502).json({ error: 'Не вдалося отримати курс НБУ для переказу. Спробуй пізніше.' });
    }
  }

  try {
    const updated = await prisma.transaction.update({
      where: { id: Number(id), userId: req.userId },
      data: { amount, type, category, note, status, accountId, toAccountId, toAmount },
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