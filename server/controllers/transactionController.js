// Логіка для транзакцій
const prisma = require('../prismaClient');

// Отримати всі транзакції
const getAllTransactions = async (req, res) => {
  const transactions = await prisma.transaction.findMany();
  res.json(transactions);
};

// Додати нову транзакцію
const createTransaction = async (req, res) => {
  const { amount, type, category, note } = req.body;

  const newTransaction = await prisma.transaction.create({
    data: {
      amount,
      type,
      category,
      note,
      userId: 1, // тимчасово: прив'язуємо до Богдана (id=1). Пізніше візьмемо з авторизації
    },
  });

  res.json(newTransaction);
};

// Оновити транзакцію за id
const updateTransaction = async (req, res) => {
  const { id } = req.params;
  const { amount, type, category, note } = req.body;

  const updated = await prisma.transaction.update({
    where: { id: Number(id) },
    data: { amount, type, category, note },
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