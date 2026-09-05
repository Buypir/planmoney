// Регулярні операції (зарплата, підписки, оренда)
const prisma = require('../prismaClient');
const { validateTransaction } = require('../validation');

const INTERVALS = ['day', 'week', 'month', 'year'];

// Скільки входжень створюємо за один раз. Захист від правила, що пролежало
// роками: краще створити останні кілька, ніж тисячі рядків одним махом.
const MAX_CATCH_UP = 60;

const advance = (date, interval) => {
  const next = new Date(date);
  if (interval === 'day') next.setDate(next.getDate() + 1);
  else if (interval === 'week') next.setDate(next.getDate() + 7);
  else if (interval === 'year') next.setFullYear(next.getFullYear() + 1);
  else next.setMonth(next.getMonth() + 1);
  return next;
};

// Створює операції за всіма правилами, чий час уже настав. Викликається перед
// видачею списку операцій, тому окремий планувальник не потрібен.
const runDueRecurrings = async (userId) => {
  const now = new Date();
  const due = await prisma.recurring.findMany({
    where: { userId, active: true, nextRun: { lte: now } },
  });

  for (const rule of due) {
    const created = [];
    let next = new Date(rule.nextRun);

    while (next <= now && created.length < MAX_CATCH_UP) {
      created.push({
        amount: rule.amount,
        type: rule.type,
        category: rule.category,
        note: rule.note,
        date: new Date(next),
        accountId: rule.accountId ?? undefined,
        userId,
      });
      next = advance(next, rule.interval);
    }

    if (created.length === 0) continue;

    await prisma.$transaction([
      prisma.transaction.createMany({ data: created }),
      prisma.recurring.update({ where: { id: rule.id }, data: { nextRun: next } }),
    ]);
  }
};

const getAllRecurrings = async (req, res) => {
  const recurrings = await prisma.recurring.findMany({
    where: { userId: req.userId },
    orderBy: { nextRun: 'asc' },
  });
  res.json(recurrings);
};

const createRecurring = async (req, res) => {
  const { amount, type, category, note, interval, startDate, accountId } = req.body;

  const invalid = validateTransaction({ amount, type, category, note, accountId });
  if (invalid) return res.status(400).json({ error: invalid });
  if (type === 'transfer') return res.status(400).json({ error: 'Переказ не може бути регулярною операцією' });
  if (!INTERVALS.includes(interval)) return res.status(400).json({ error: 'Невідома періодичність' });

  const start = startDate ? new Date(startDate) : new Date();
  if (Number.isNaN(start.getTime())) return res.status(400).json({ error: 'Некоректна дата початку' });

  if (accountId) {
    const owned = await prisma.account.count({ where: { id: accountId, userId: req.userId } });
    if (!owned) return res.status(403).json({ error: 'Рахунок не знайдено' });
  }

  // Минулі дати не відтворюємо заднім числом — рахуємо від найближчого входження
  let nextRun = start;
  const now = new Date();
  let guard = 0;
  while (nextRun < now && guard < 1000) {
    nextRun = advance(nextRun, interval);
    guard += 1;
  }

  const created = await prisma.recurring.create({
    data: {
      amount,
      type,
      category,
      note: note || null,
      interval,
      nextRun,
      accountId: accountId ?? undefined,
      userId: req.userId,
    },
  });
  res.json(created);
};

const setRecurringActive = async (req, res) => {
  const { id } = req.params;
  const { active } = req.body;
  try {
    const updated = await prisma.recurring.update({
      where: { id: Number(id), userId: req.userId },
      data: { active: Boolean(active) },
    });
    res.json(updated);
  } catch {
    res.status(404).json({ error: 'Правило не знайдено' });
  }
};

const deleteRecurring = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.recurring.delete({ where: { id: Number(id), userId: req.userId } });
    res.json({ message: 'Правило видалено' });
  } catch {
    res.status(404).json({ error: 'Правило не знайдено' });
  }
};

module.exports = { getAllRecurrings, createRecurring, setRecurringActive, deleteRecurring, runDueRecurrings };
