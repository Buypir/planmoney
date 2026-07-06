// Логіка для категорій
const prisma = require('../prismaClient');

// Отримати всі категорії
const getAllCategories = async (req, res) => {
  const categories = await prisma.category.findMany();
  res.json(categories);
};

// Додати нову категорію
const createCategory = async (req, res) => {
  const { name, type, color } = req.body;

  const newCategory = await prisma.category.create({
    data: {
      name,
      type,
      color,
      userId: 1, // тимчасово: Богдан
    },
  });

  res.json(newCategory);
};

// Оновити категорію за id
const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, type, color } = req.body;

  const updated = await prisma.category.update({
    where: { id: Number(id) },
    data: { name, type, color },
  });

  res.json(updated);
};

// Видалити категорію за id
const deleteCategory = async (req, res) => {
  const { id } = req.params;

  await prisma.category.delete({
    where: { id: Number(id) },
  });

  res.json({ message: 'Категорію видалено' });
};

module.exports = { getAllCategories, createCategory, updateCategory, deleteCategory };