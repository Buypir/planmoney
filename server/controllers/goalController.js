// Логіка для цілей накопичення
const prisma = require('../prismaClient');
const { validateGoal } = require('../validation');
const { getRates } = require('./exchangeRateController');

// Суми зберігаються в копійках — у текст помилки виводимо звичні гривні
const uah = (minor) => (minor / 100).toFixed(2);

// Отримати всі цілі користувача
const getAllGoals = async (req, res) => {
  const goals = await prisma.goal.findMany({ where: { userId: req.userId } });
  res.json(goals);
};

// Створити нову ціль
const createGoal = async (req, res) => {
  const { title, targetAmount } = req.body;

  const invalid = validateGoal({ title, targetAmount });
  if (invalid) return res.status(400).json({ error: invalid });

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

  const goal = await prisma.goal.findUnique({ where: { id: Number(id), userId: req.userId } });
  if (!goal) {
    return res.status(404).json({ error: 'Ціль не знайдено' });
  }

  // 1. Ліміт цілі
  const remaining = goal.targetAmount - goal.savedAmount;
  if (sum > remaining) {
    return res.status(400).json({ error: `Забагато. До цілі залишилось лише ${uah(remaining)} грн` });
  }

  // 2. Перевірка балансу. Суми з валютних рахунків переводимо в гривню за курсом НБУ,
  // інакше 100 доларів рахувались би як 100 гривень.
  const transactions = await prisma.transaction.findMany({
    where: { userId: req.userId },
    include: { account: true },
  });

  let rates;
  try {
    rates = await getRates();
  } catch {
    return res.status(502).json({ error: 'Не вдалося отримати курс НБУ. Спробуй пізніше.' });
  }

  const inUAH = (tx) => {
    const currency = tx.account?.currency || 'UAH';
    return tx.amount * (currency === 'UAH' ? 1 : (rates[currency] || 1));
  };
  const income = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + inUAH(t), 0);
  const expense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + inUAH(t), 0);
  const balance = Math.round(income - expense);
  if (sum > balance) {
    return res.status(400).json({ error: `Недостатньо коштів. На балансі: ${uah(balance)} грн` });
  }

  const updated = await prisma.goal.update({
    where: { id: Number(id) },
    data: { savedAmount: goal.savedAmount + sum },
  });

  // Категорією беремо назву цілі: підпис українською застигав би в базі
  // й не перекладався при зміні мови
  await prisma.transaction.create({
    data: {
      amount: sum,
      type: 'expense',
      category: goal.title,
      userId: req.userId,
    },
  });

  res.json(updated);
};

// Видалити ціль (лише якщо вона належить поточному користувачу)
const deleteGoal = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.goal.delete({ where: { id: Number(id), userId: req.userId } });
    res.json({ message: 'Ціль видалено' });
  } catch {
    res.status(404).json({ error: 'Ціль не знайдено' });
  }
};

module.exports = { getAllGoals, createGoal, addToGoal, deleteGoal };
