// Логіка для задач
const prisma = require('../prismaClient');

// Отримати всі задачі
const getAllTasks = async (req, res) => {
  const tasks = await prisma.task.findMany();
  res.json(tasks);
};

// Додати нову задачу
const createTask = async (req, res) => {
  const { title, note, category, priority, status, dueDate } = req.body;

  const newTask = await prisma.task.create({
    data: {
      title,
      note,
      category,
      priority,
      status,
      dueDate: dueDate ? new Date(dueDate) : null,
      userId: 1, // тимчасово: Богдан
    },
  });

  res.json(newTask);
};

// Оновити задачу за id
const updateTask = async (req, res) => {
  const { id } = req.params;
  const { title, note, category, priority, status, dueDate } = req.body;

  const updated = await prisma.task.update({
    where: { id: Number(id) },
    data: {
      title,
      note,
      category,
      priority,
      status,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
  });

  res.json(updated);
};

// Видалити задачу за id
const deleteTask = async (req, res) => {
  const { id } = req.params;

  await prisma.task.delete({
    where: { id: Number(id) },
  });

  res.json({ message: 'Задачу видалено' });
};

module.exports = { getAllTasks, createTask, updateTask, deleteTask };