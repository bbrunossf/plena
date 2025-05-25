-- CreateTable
CREATE TABLE "Categoria" (
    "id_categoria" SERIAL NOT NULL,
    "nome_categoria" TEXT NOT NULL,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id_categoria")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id_cliente" SERIAL NOT NULL,
    "nome_cliente" TEXT NOT NULL,
    "contato" TEXT,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id_cliente")
);

-- CreateTable
CREATE TABLE "Obra" (
    "id_obra" SERIAL NOT NULL,
    "cod_obra" TEXT,
    "nome_obra" TEXT NOT NULL,
    "id_cliente" INTEGER,
    "data_inicio" TIMESTAMP(3),
    "total_horas_planejadas" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "data_inicio_planejamento" TIMESTAMP(3),
    "data_fim_planejamento" TIMESTAMP(3),
    "observacoes_planejamento" TEXT,

    CONSTRAINT "Obra_pkey" PRIMARY KEY ("id_obra")
);

-- CreateTable
CREATE TABLE "Pessoa" (
    "id_nome" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "funcao" TEXT,
    "email" TEXT,
    "hourlyRate" DOUBLE PRECISION DEFAULT 10.0,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Pessoa_pkey" PRIMARY KEY ("id_nome")
);

-- CreateTable
CREATE TABLE "Registro" (
    "id_registro" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "id_nome" INTEGER NOT NULL,
    "id_obra" INTEGER NOT NULL,
    "id_tipo_tarefa" INTEGER NOT NULL,
    "id_categoria" INTEGER NOT NULL,
    "duracao_minutos" INTEGER NOT NULL DEFAULT 60,
    "hora_extra" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Registro_pkey" PRIMARY KEY ("id_registro")
);

-- CreateTable
CREATE TABLE "TipoTarefa" (
    "id_tipo_tarefa" SERIAL NOT NULL,
    "nome_tipo" TEXT NOT NULL,

    CONSTRAINT "TipoTarefa_pkey" PRIMARY KEY ("id_tipo_tarefa")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agenda" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "data_hora_inicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_hora_termino" TIMESTAMP(3) NOT NULL,
    "dia_inteiro" BOOLEAN NOT NULL DEFAULT true,
    "id_obra" INTEGER NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "entregue" BOOLEAN DEFAULT false,
    "entregue_em" TIMESTAMP(3),

    CONSTRAINT "Agenda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" SERIAL NOT NULL,
    "order" INTEGER,
    "parentId" TEXT,
    "taskName" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "duration" DOUBLE PRECISION DEFAULT 0.0,
    "notes" TEXT,
    "progress" DOUBLE PRECISION DEFAULT 0.0,
    "predecessor" TEXT,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskResource" (
    "id" SERIAL NOT NULL,
    "resourceName" TEXT NOT NULL,
    "resourceRole" TEXT,

    CONSTRAINT "TaskResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskResourceAssignment" (
    "taskId" INTEGER NOT NULL,
    "taskResourceId" INTEGER NOT NULL,

    CONSTRAINT "TaskResourceAssignment_pkey" PRIMARY KEY ("taskId","taskResourceId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Obra_cod_obra_key" ON "Obra"("cod_obra");

-- CreateIndex
CREATE UNIQUE INDEX "User_name_key" ON "User"("name");

-- CreateIndex
CREATE INDEX "parentId" ON "Task"("parentId");

-- AddForeignKey
ALTER TABLE "Obra" ADD CONSTRAINT "Obra_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "Cliente"("id_cliente") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Registro" ADD CONSTRAINT "Registro_id_nome_fkey" FOREIGN KEY ("id_nome") REFERENCES "Pessoa"("id_nome") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Registro" ADD CONSTRAINT "Registro_id_obra_fkey" FOREIGN KEY ("id_obra") REFERENCES "Obra"("id_obra") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Registro" ADD CONSTRAINT "Registro_id_tipo_tarefa_fkey" FOREIGN KEY ("id_tipo_tarefa") REFERENCES "TipoTarefa"("id_tipo_tarefa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Registro" ADD CONSTRAINT "Registro_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "Categoria"("id_categoria") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agenda" ADD CONSTRAINT "Agenda_id_obra_fkey" FOREIGN KEY ("id_obra") REFERENCES "Obra"("id_obra") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskResourceAssignment" ADD CONSTRAINT "TaskResourceAssignment_taskResourceId_fkey" FOREIGN KEY ("taskResourceId") REFERENCES "TaskResource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskResourceAssignment" ADD CONSTRAINT "TaskResourceAssignment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
