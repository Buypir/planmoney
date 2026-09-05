-- CreateTable
CREATE TABLE "Setting" (
    "id" SERIAL NOT NULL,
    "notifyTasks" BOOLEAN NOT NULL DEFAULT true,
    "notifyBudget" BOOLEAN NOT NULL DEFAULT true,
    "notifyGoals" BOOLEAN NOT NULL DEFAULT true,
    "emailDigest" BOOLEAN NOT NULL DEFAULT false,
    "theme" TEXT NOT NULL DEFAULT 'light',
    "accentColor" TEXT NOT NULL DEFAULT 'orange',
    "currency" TEXT NOT NULL DEFAULT 'UAH',
    "monthStart" INTEGER NOT NULL DEFAULT 1,
    "rounding" TEXT NOT NULL DEFAULT 'none',
    "language" TEXT NOT NULL DEFAULT 'uk',
    "monthlyBudget" INTEGER,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Setting_userId_key" ON "Setting"("userId");

-- AddForeignKey
ALTER TABLE "Setting" ADD CONSTRAINT "Setting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
