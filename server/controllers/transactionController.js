// Логіка для транзакцій
const prisma = require('../prismaClient');

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

// Оновити транзакцію за id
const updateTransaction = async (req, res) => {
  const { id } = req.params;
  const { amount, type, category, note, status, accountId, toAccountId } = req.body;

  const updated = await prisma.transaction.update({
    where: { id: Number(id) },
    data: { amount, type, category, note, status, accountId, toAccountId },
  });

  res.json(updated);
};

// Видалити транзакцію за id
const deleteTransaction = async (req, res) => {
  const { id } = req.params;

  await prisma.transaction.delete({
    where: { id: Number(id) },
  });

  res.json({ message: 'Транзакцію видалено' });
};

module.exports = { getAllTransactions, createTransaction, updateTransaction, deleteTransaction };