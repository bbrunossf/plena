-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Registro" (
    "id_registro" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "timestamp" DATETIME NOT NULL,
    "id_nome" INTEGER NOT NULL,
    "id_obra" INTEGER NOT NULL,
    "id_tipo_tarefa" INTEGER NOT NULL,
    "id_categoria" INTEGER NOT NULL,
    "duracao_minutos" INTEGER NOT NULL DEFAULT 60,
    "hora_extra" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Registro_id_nome_fkey" FOREIGN KEY ("id_nome") REFERENCES "Pessoa" ("id_nome") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Registro_id_obra_fkey" FOREIGN KEY ("id_obra") REFERENCES "Obra" ("id_obra") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Registro_id_tipo_tarefa_fkey" FOREIGN KEY ("id_tipo_tarefa") REFERENCES "TipoTarefa" ("id_tipo_tarefa") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Registro_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "Categoria" ("id_categoria") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Registro" ("duracao_minutos", "id_categoria", "id_nome", "id_obra", "id_registro", "id_tipo_tarefa", "timestamp") SELECT "duracao_minutos", "id_categoria", "id_nome", "id_obra", "id_registro", "id_tipo_tarefa", "timestamp" FROM "Registro";
DROP TABLE "Registro";
ALTER TABLE "new_Registro" RENAME TO "Registro";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
