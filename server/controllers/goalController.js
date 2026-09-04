// Логіка для цілей накопичення
const prisma = require('../prismaClient');

// Отримати всі цілі користувача
const getAllGoals = async (req, res) => {
  const goals = await prisma.goal.findMany({ where: { userId: req.userId } });
  res.json(goals);
};

// Створити нову ціль
const createGoal = async (req, res) => {
  const { title, targetAmount } = req.body;
  const newGoal = await prisma.goal.create({
    data: { title, targetAmount: Number(targetAmount), userId: req.userId },
  });
  res.json(newGoal);
};

// Поповнити ціль (з перевіркою ліміту цілі ТА балансу)
const addToGoal = async (req, res) => {
  const { id } = req.params;
  const { amount } = req.body;
  const sum = Number(amount);

  if (!sum || sum <= 0) {
    return res.status(400).json({ error: 'Некоректна сума' });
  }

  const goal = await prisma.goal.findUnique({ where: { id: Number(id) } });
  if (!goal) {
    return res.status(404).json({ error: 'Ціль не знайдено' });
  }

  // 1. Ліміт цілі
  const remaining = goal.targetAmount - goal.savedAmount;
  if (sum > remaining) {
    return res.status(400).json({ error: `Забагато. До цілі залишилось лише ${remaining} грн` });
  }

  // 2. Перевірка балансу
  const transactions = await prisma.transaction.findMany({ where: { userId: req.userId } });
  const income = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;
  if (sum > balance) {
    return res.status(400).json({ error: `Недостатньо коштів. На балансі: ${balance} грн` });
  }

  const updated = await prisma.goal.update({
    where: { id: Number(id) },
    data: { savedAmount: goal.savedAmount + sum },
  });

  await prisma.transaction.create({
    data: {
      amount: sum,
      type: 'expense',
      category: `Накопичення: ${goal.title}`,
      note: 'Переказ на ціль',
      userId: req.userId,
    },
  });

  res.json(updated);
};

// Видалити ціль
const deleteGoal = async (req, res) => {
  const { id } = req.params;
  await prisma.goal.delete({ where: { id: Number(id) } });
  res.json({ message: 'Ціль видалено' });
};

module.exports = { getAllGoals, createGoal, addToGoal, deleteGoal };
