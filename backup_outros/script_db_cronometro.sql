Com base no script em anexo, escreva o conteúdo necessário para o arquivo schema.zmodel, considerando o uso do Zenstack e Prisma em um banco de dados sqlite

-- Categoria definition

CREATE TABLE "Categoria" (
    id_categoria INTEGER PRIMARY KEY AUTOINCREMENT,
    nome_categoria TEXT NOT NULL 
);

-- Cliente definition

CREATE TABLE "Cliente" (
    id_cliente INTEGER PRIMARY KEY AUTOINCREMENT,
    nome_cliente TEXT NOT NULL,
    contato TEXT
);

-- Obra definition

CREATE TABLE "Obra" (
    id_obra INTEGER PRIMARY KEY AUTOINCREMENT,
    cod_obra TEXT UNIQUE,
    nome_obra TEXT NOT NULL,
    id_cliente INTEGER,
    data_inicio DATE,
    total_horas_planejadas REAL DEFAULT 0,
    data_inicio_planejamento DATE,
    data_fim_planejamento DATE,
    observacoes_planejamento TEXT,
    FOREIGN KEY (id_cliente) REFERENCES "Cliente"(id_cliente)
);

-- Pessoa definition

CREATE TABLE "Pessoa" (
    id_nome INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    funcao TEXT,
    email TEXT,
	hourlyRate FLOAT DEFAULT 10.0,
    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
, ativo INT DEFAULT (1) NOT NULL);

-- Registro definition

CREATE TABLE "Registro" (
    id_registro INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME NOT NULL,
    id_nome INTEGER NOT NULL,
    id_obra INTEGER NOT NULL,
    id_tipo_tarefa INTEGER NOT NULL,
    id_categoria INTEGER NOT NULL,
    duracao_minutos INTEGER NOT NULL DEFAULT 60,    
    FOREIGN KEY (id_nome) REFERENCES "Pessoa"(id_nome),
    FOREIGN KEY (id_obra) REFERENCES "Obra"(id_obra),
    FOREIGN KEY (id_tipo_tarefa) REFERENCES "TipoTarefa"(id_tipo_tarefa),
    FOREIGN KEY (id_categoria) REFERENCES "Categoria"(id_categoria)
);

-- TipoTarefa definition

CREATE TABLE "TipoTarefa" (
    id_tipo_tarefa INTEGER PRIMARY KEY AUTOINCREMENT,
    nome_tipo TEXT NOT NULL 
);