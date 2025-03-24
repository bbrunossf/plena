/*
  Warnings:

  - You are about to drop the `TaskDependency` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TaskUpdate` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "TaskDependency";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "TaskUpdate";
PRAGMA foreign_keys=on;
