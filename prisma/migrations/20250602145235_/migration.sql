/*
  Warnings:

  - You are about to drop the column `hourlyRate` on the `Pessoa` table. All the data in the column will be lost.
  - You are about to drop the column `overtimeRate` on the `Pessoa` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Pessoa" DROP COLUMN "hourlyRate",
DROP COLUMN "overtimeRate";

-- CreateTable
CREATE TABLE "CustoHora" (
    "id" SERIAL NOT NULL,
    "pessoaId" INTEGER NOT NULL,
    "custoHora" DECIMAL(65,30) NOT NULL,
    "custoHoraExtra" DECIMAL(65,30) NOT NULL,
    "inicioVigencia" TIMESTAMP(3) NOT NULL,
    "fimVigencia" TIMESTAMP(3),

    CONSTRAINT "CustoHora_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustoHora_pessoaId_inicioVigencia_fimVigencia_idx" ON "CustoHora"("pessoaId", "inicioVigencia", "fimVigencia");

-- AddForeignKey
ALTER TABLE "CustoHora" ADD CONSTRAINT "CustoHora_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "Pessoa"("id_nome") ON DELETE RESTRICT ON UPDATE CASCADE;
