-- CreateTable
CREATE TABLE "MealLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "mealType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "logDate" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MealLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "MealLog_userId_idx" ON "MealLog"("userId");

-- CreateIndex
CREATE INDEX "MealLog_logDate_idx" ON "MealLog"("logDate");

-- CreateIndex
CREATE UNIQUE INDEX "MealLog_userId_mealType_logDate_key" ON "MealLog"("userId", "mealType", "logDate");
