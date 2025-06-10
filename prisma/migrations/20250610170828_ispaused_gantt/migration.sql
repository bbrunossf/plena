/*
  Warnings:

  - You are about to alter the column `custoHora` on the `CustoHora` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to alter the column `custoHoraExtra` on the `CustoHora` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.

*/
-- AlterTable
ALTER TABLE "CustoHora" ALTER COLUMN "custoHora" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "custoHoraExtra" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "isPaused" BOOLEAN DEFAULT false;
