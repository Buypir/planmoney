// Перевірка вхідних даних. Кожна функція повертає текст помилки або null,
// якщо все гаразд — контролери віддають цей текст із кодом 400.

const MAX_TEXT = 200;
const MAX_NOTE = 500;

const isBlank = (value) => typeof value !== 'string' || value.trim() === '';

// Ціла додатна сума. Дробові й від'ємні значення ламали б підрахунок балансу.
const invalidAmount = (value) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'Сума має бути числом';
  if (!Number.isInteger(value)) return 'Сума має бути цілим числом';
  if (value <= 0) return 'Сума має бути більшою за нуль';
  return null;
};

const tooLong = (value, limit, field) =>
  typeof value === 'string' && value.length > limit ? `${field}: забагато символів (максимум ${limit})` : null;

const TRANSACTION_TYPES = ['income', 'expense', 'transfer'];
const TASK_PRIORITIES = ['low', 'medium', 'high'];
const TASK_STATUSES = ['todo', 'in_progress', 'done'];
const CATEGORY_TYPES = ['task', 'income', 'expense'];
const CURRENCIES = ['UAH', 'USD', 'EUR'];
const THEMES = ['light', 'dark', 'system'];
const LANGUAGES = ['uk', 'en'];

function validateTransaction({ amount, type, category, note, accountId, toAccountId }) {
  const amountError = invalidAmount(amount);
  if (amountError) return amountError;
  if (!TRANSACTION_TYPES.includes(type)) return 'Невідомий тип операції';

  if (type === 'transfer') {
    if (!accountId || !toAccountId) return 'Для переказу потрібні обидва рахунки';
    if (accountId === toAccountId) return 'Не можна переказати на той самий рахунок';
  } else if (isBlank(category)) {
    return 'Вкажи категорію';
  }

  return tooLong(category, MAX_TEXT, 'Категорія') || tooLong(note, MAX_NOTE, 'Опис');
}

function validateTask({ title, priority, status, category, note, dueDate }) {
  if (isBlank(title)) return 'Вкажи назву задачі';
  if (priority !== undefined && !TASK_PRIORITIES.includes(priority)) return 'Невідомий пріоритет';
  if (status !== undefined && !TASK_STATUSES.includes(status)) return 'Невідомий статус';
  if (dueDate && Number.isNaN(new Date(dueDate).getTime())) return 'Некоректна дата дедлайну';
  return tooLong(title, MAX_TEXT, 'Назва') || tooLong(category, MAX_TEXT, 'Категорія') || tooLong(note, MAX_NOTE, 'Опис');
}

function validateCategory({ name, type }) {
  if (isBlank(name)) return 'Вкажи назву категорії';
  if (!CATEGORY_TYPES.includes(type)) return 'Невідомий тип категорії';
  return tooLong(name, MAX_TEXT, 'Назва');
}

function validateAccount({ name, currency }) {
  if (isBlank(name)) return 'Вкажи назву рахунку';
  if (currency !== undefined && !CURRENCIES.includes(currency)) return 'Невідома валюта';
  return tooLong(name, MAX_TEXT, 'Назва');
}

function validateGoal({ title, targetAmount }) {
  if (isBlank(title)) return 'Вкажи назву цілі';
  const amountError = invalidAmount(Number(targetAmount));
  if (amountError) return amountError;
  return tooLong(title, MAX_TEXT, 'Назва');
}

// Налаштування оновлюються частково, тому перевіряємо лише передані поля
function validateSettings(data) {
  if (data.theme !== undefined && !THEMES.includes(data.theme)) return 'Невідома тема';
  if (data.language !== undefined && !LANGUAGES.includes(data.language)) return 'Невідома мова';
  if (data.currency !== undefined && !CURRENCIES.includes(data.currency)) return 'Невідома валюта';
  if (data.monthStart !== undefined && (!Number.isInteger(data.monthStart) || data.monthStart < 1 || data.monthStart > 28)) {
    return 'Початок місяця має бути числом від 1 до 28';
  }
  if (data.accentColor !== undefined && !/^(#[0-9a-f]{6}|[a-z]+)$/i.test(String(data.accentColor))) {
    return 'Некоректний акцентний колір';
  }
  if (data.monthlyBudget !== undefined && data.monthlyBudget !== null) {
    const budgetError = invalidAmount(Number(data.monthlyBudget));
    if (budgetError) return budgetError;
  }
  return null;
}

module.exports = {
  validateTransaction,
  validateTask,
  validateCategory,
  validateAccount,
  validateGoal,
  validateSettings,
};
