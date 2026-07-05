// Місток між сервером і базою даних

// Завантажуємо змінні з .env
require('dotenv').config();

// Класичний імпорт клієнта Prisma
const { PrismaClient } = require('@prisma/client');

// Адаптер для PostgreSQL (Prisma 7 його вимагає)
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

module.exports = prisma;