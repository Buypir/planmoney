-- CreateTable
CREATE TABLE "Recurring" (
    "id" SERIAL NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "note" TEXT,
    "interval" TEXT NOT NULL,
    "nextRun" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accountId" INTEGER,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Recurring_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Recurring" ADD CONSTRAINT "Recurring_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recurring" ADD CONSTRAINT "Recurring_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
