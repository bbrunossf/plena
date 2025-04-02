/*
  Warnings:

  - You are about to drop the column `positionId` on the `Task` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Task" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "order" INTEGER,
    "parentId" TEXT,
    "taskName" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "duration" REAL DEFAULT 0.0,
    "notes" TEXT,
    "progress" REAL DEFAULT 0.0,
    "predecessor" TEXT
);
INSERT INTO "new_Task" ("duration", "endDate", "id", "notes", "parentId", "predecessor", "progress", "startDate", "taskName") SELECT "duration", "endDate", "id", "notes", "parentId", "predecessor", "progress", "startDate", "taskName" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
CREATE INDEX "parentId" ON "Task"("parentId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
