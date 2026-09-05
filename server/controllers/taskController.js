// Логіка для задач
const prisma = require('../prismaClient');
const { validateTask } = require('../validation');

// Отримати всі задачі
const getAllTasks = async (req, res) => {
  const tasks = await prisma.task.findMany({
    where: { userId: req.userId },
  });
  res.json(tasks);
};

// Додати нову задачу
const createTask = async (req, res) => {
  const { title, note, category, priority, status, dueDate } = req.body;

  const invalid = validateTask({ title, priority, status, category, note, dueDate });
  if (invalid) return res.status(400).json({ error: invalid });

  const newTask = await prisma.task.create({
    data: {
      title,
      note,
      category,
      priority,
      status,
      dueDate: dueDate ? new Date(dueDate) : null,
      userId: req.userId,
    },
  });

  res.json(newTask);
};

// Оновити задачу за id (лише якщо вона належить поточному користувачу)
const updateTask = async (req, res) => {
  const { id } = req.params;
  const { title, note, category, priority, status, dueDate } = req.body;

  const invalid = validateTask({ title, priority, status, category, note, dueDate });
  if (invalid) return res.status(400).json({ error: invalid });

  try {
    const updated = await prisma.task.update({
      where: { id: Number(id), userId: req.userId },
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
  } catch {
    res.status(404).json({ error: 'Задачу не знайдено' });
  }
};

// Видалити задачу за id (лише якщо вона належить поточному користувачу)
const deleteTask = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.task.delete({ where: { id: Number(id), userId: req.userId } });
    res.json({ message: 'Задачу видалено' });
  } catch {
    res.status(404).json({ error: 'Задачу не знайдено' });
  }
};

module.exports = { getAllTasks, createTask, updateTask, deleteTask };