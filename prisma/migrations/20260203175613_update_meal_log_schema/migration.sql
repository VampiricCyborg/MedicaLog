/*
  Warnings:

  - You are about to drop the column `description` on the `MealLog` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `MealLog` table. All the data in the column will be lost.
  - Added the required column `descriptionText` to the `MealLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `loggedAt` to the `MealLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `patientId` to the `MealLog` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MealLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "mealType" TEXT NOT NULL,
    "descriptionText" TEXT NOT NULL,
    "loggedAt" DATETIME NOT NULL,
    "logDate" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MealLog_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_MealLog" ("createdAt", "id", "logDate", "mealType") SELECT "createdAt", "id", "logDate", "mealType" FROM "MealLog";
DROP TABLE "MealLog";
ALTER TABLE "new_MealLog" RENAME TO "MealLog";
CREATE INDEX "MealLog_patientId_logDate_idx" ON "MealLog"("patientId", "logDate");
CREATE INDEX "MealLog_patientId_idx" ON "MealLog"("patientId");
CREATE INDEX "MealLog_logDate_idx" ON "MealLog"("logDate");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
