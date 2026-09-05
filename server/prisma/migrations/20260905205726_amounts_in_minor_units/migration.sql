-- Суми переходять з цілих одиниць валюти на копійки/центи, щоб гроші
-- не втрачали дробову частину. Наявні записи перераховуємо: 100 грн -> 10000.

UPDATE "Transaction" SET "amount" = "amount" * 100;
UPDATE "Transaction" SET "toAmount" = "toAmount" * 100 WHERE "toAmount" IS NOT NULL;
UPDATE "Goal" SET "targetAmount" = "targetAmount" * 100, "savedAmount" = "savedAmount" * 100;
UPDATE "Setting" SET "monthlyBudget" = "monthlyBudget" * 100 WHERE "monthlyBudget" IS NOT NULL;
