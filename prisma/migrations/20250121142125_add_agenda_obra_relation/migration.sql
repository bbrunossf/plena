/*
  Warnings:

  - You are about to drop the `Entrega` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Entrega";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Agenda" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "dataPrevista" DATETIME NOT NULL,
    "id_obra" INTEGER NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "Agenda_id_obra_fkey" FOREIGN KEY ("id_obra") REFERENCES "Obra" ("id_obra") ON DELETE RESTRICT ON UPDATE CASCADE
);
