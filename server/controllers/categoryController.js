// Логіка для категорій
const prisma = require('../prismaClient');
const { validateCategory } = require('../validation');

// Отримати всі категорії
const getAllCategories = async (req, res) => {
  const categories = await prisma.category.findMany({
    where: { userId: req.userId },
  });
  res.json(categories);
};

// Додати нову категорію
const createCategory = async (req, res) => {
  const { name, type, color } = req.body;

  const invalid = validateCategory({ name, type });
  if (invalid) return res.status(400).json({ error: invalid });

  const newCategory = await prisma.category.create({
    data: {
      name,
      type,
      color,
      userId: req.userId, // тимчасово: Богдан
    },
  });

  res.json(newCategory);
};

// Оновити категорію за id (лише якщо вона належить поточному користувачу)
const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, type, color } = req.body;

  const invalid = validateCategory({ name, type });
  if (invalid) return res.status(400).json({ error: invalid });

  try {
    const updated = await prisma.category.update({
      where: { id: Number(id), userId: req.userId },
      data: { name, type, color },
    });
    res.json(updated);
  } catch {
    res.status(404).json({ error: 'Категорію не знайдено' });
  }
};

// Видалити категорію за id (лише якщо вона належить поточному користувачу)
const deleteCategory = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.category.delete({ where: { id: Number(id), userId: req.userId } });
    res.json({ message: 'Категорію видалено' });
  } catch {
    res.status(404).json({ error: 'Категорію не знайдено' });
  }
};

module.exports = { getAllCategories, createCategory, updateCategory, deleteCategory };