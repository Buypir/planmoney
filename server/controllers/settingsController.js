// Логіка для налаштувань користувача
const prisma = require('../prismaClient');

// Отримати налаштування (створює дефолтні, якщо ще немає)
const getSettings = async (req, res) => {
  const settings = await prisma.setting.upsert({
    where: { userId: req.userId },
    update: {},
    create: { userId: req.userId },
  });
  res.json(settings);
};

// Оновити налаштування (частково)
const updateSettings = async (req, res) => {
  const {
    notifyTasks,
    notifyBudget,
    notifyGoals,
    emailDigest,
    theme,
    accentColor,
    currency,
    monthStart,
    rounding,
    language,
    monthlyBudget,
  } = req.body;

  const data = {
    notifyTasks,
    notifyBudget,
    notifyGoals,
    emailDigest,
    theme,
    accentColor,
    currency,
    monthStart,
    rounding,
    language,
    monthlyBudget,
  };

  // Прибираємо undefined-поля, щоб не затерти наявні значення
  Object.keys(data).forEach((key) => data[key] === undefined && delete data[key]);

  const updated = await prisma.setting.upsert({
    where: { userId: req.userId },
    update: data,
    create: { userId: req.userId, ...data },
  });

  res.json(updated);
};

module.exports = { getSettings, updateSettings };
