-- CreateTable
CREATE TABLE "Categoria" (
    "id_categoria" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome_categoria" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id_cliente" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome_cliente" TEXT NOT NULL,
    "contato" TEXT
);

-- CreateTable
CREATE TABLE "Obra" (
    "id_obra" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "cod_obra" TEXT,
    "nome_obra" TEXT NOT NULL,
    "id_cliente" INTEGER,
    "data_inicio" DATETIME,
    "total_horas_planejadas" REAL NOT NULL DEFAULT 0,
    "data_inicio_planejamento" DATETIME,
    "data_fim_planejamento" DATETIME,
    "observacoes_planejamento" TEXT,
    CONSTRAINT "Obra_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "Cliente" ("id_cliente") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pessoa" (
    "id_nome" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "funcao" TEXT,
    "email" TEXT,
    "hourlyRate" REAL DEFAULT 10.0,
    "data_criacao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ativo" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "Registro" (
    "id_registro" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "timestamp" DATETIME NOT NULL,
    "id_nome" INTEGER NOT NULL,
    "id_obra" INTEGER NOT NULL,
    "id_tipo_tarefa" INTEGER NOT NULL,
    "id_categoria" INTEGER NOT NULL,
    "duracao_minutos" INTEGER NOT NULL DEFAULT 60,
    CONSTRAINT "Registro_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "Categoria" ("id_categoria") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Registro_id_tipo_tarefa_fkey" FOREIGN KEY ("id_tipo_tarefa") REFERENCES "TipoTarefa" ("id_tipo_tarefa") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Registro_id_obra_fkey" FOREIGN KEY ("id_obra") REFERENCES "Obra" ("id_obra") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Registro_id_nome_fkey" FOREIGN KEY ("id_nome") REFERENCES "Pessoa" ("id_nome") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TipoTarefa" (
    "id_tipo_tarefa" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome_tipo" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user'
);

-- CreateTable
CREATE TABLE "Agenda" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "data_hora_inicio" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_hora_termino" DATETIME NOT NULL,
    "dia_inteiro" BOOLEAN NOT NULL DEFAULT true,
    "id_obra" INTEGER NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "Agenda_id_obra_fkey" FOREIGN KEY ("id_obra") REFERENCES "Obra" ("id_obra") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Obra_cod_obra_key" ON "Obra"("cod_obra");

-- CreateIndex
CREATE UNIQUE INDEX "User_name_key" ON "User"("name");
