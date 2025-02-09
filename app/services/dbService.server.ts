import { prisma } from "~/db.server"; // Ajuste o caminho conforme seu projeto

export async function getTableNames(): Promise<string[]> {
  const tables: Array<{ name: string }> = await prisma.$queryRaw`
    SELECT name 
    FROM sqlite_master 
    WHERE type='table' 
      AND name NOT LIKE 'sqlite_%';
  `;
  
  return tables.map(table => table.name);
}

/**
 * Obtém as informações das colunas de uma tabela específica.
 * @param tableName Nome da tabela.
 */
export async function getTableColumns(tableName: string): Promise<Array<{ cid: number; name: string; type: string; notnull: number; dflt_value: any; pk: number }>> {
  // Validação extra para evitar injeção de SQL
  const validTableNames = await getTableNames();
  if (!validTableNames.includes(tableName)) {
    throw new Error(`Tabela "${tableName}" não encontrada.`);
  }
  
  // Use $queryRawUnsafe para interpolar o nome da tabela
  const columns = await prisma.$queryRawUnsafe(
    `PRAGMA table_info(${tableName});`
  );
  
  return columns;
}

/**
 * Obtém todos os registros de uma tabela específica.
 * @param tableName Nome da tabela.
 */
export async function getRecords(tableName: string): Promise<any[]> {
  // Validação extra
  const validTableNames = await getTableNames();
  if (!validTableNames.includes(tableName)) {
    throw new Error(`Tabela "${tableName}" não encontrada.`);
  }

  let query: string;

  if (tableName === 'Obra') {
    query = 'SELECT id_obra, cod_obra, nome_obra, id_cliente, total_horas_planejadas, data_inicio, observacoes_planejamento FROM Obra LIMIT 1;';
  } else {
    query = `SELECT * FROM ${tableName};`;
  }

  const records = await prisma.$queryRawUnsafe(query);

  // Converte campos Date para strings
  return records.map(record => {
    const formatted = { ...record };
    for (const key in formatted) {
      if (formatted[key] instanceof Date) {
        formatted[key] = formatted[key].toISOString()// .split("T")[0]; // ou value.toLocaleString()
      }
    }
    return formatted;
  });
}

/**
 * Adiciona um novo registro em uma tabela específica.
 * @param tableName Nome da tabela.
 * @param data Dados a serem inseridos.
 */
export async function addRecord(tableName: string, data: Record<string, any>): Promise<void> {
  // Validação
  const validTableNames = await getTableNames();
  if (!validTableNames.includes(tableName)) {
    throw new Error(`Tabela "${tableName}" não encontrada.`);
  }

  const fields = Object.keys(data).join(", ");
  const placeholders = Object.keys(data).map((_, i) => `$${i + 1}`).join(", ");
  const values = Object.values(data);

  await prisma.$executeRawUnsafe(
    `INSERT INTO ${tableName} (${fields}) VALUES (${placeholders});`,
    ...values
  );
}

/**
 * Atualiza um registro existente em uma tabela específica.
 * @param tableName Nome da tabela.
 * @param id ID do registro a ser atualizado.
 * @param data Dados a serem atualizados.
 */
export async function editRecord(tableName: string, id: any, data: Record<string, any>): Promise<void> {
  // Validação
  const validTableNames = await getTableNames();
  if (!validTableNames.includes(tableName)) {
    throw new Error(`Tabela "${tableName}" não encontrada.`);
  }

  const fields = Object.keys(data).map((key, index) => `${key} = $${index + 1}`).join(", ");
  const values = Object.values(data);

  await prisma.$executeRawUnsafe(
    `UPDATE ${tableName} SET ${fields} WHERE id = $${values.length + 1};`,
    ...values,
    id
  );
}

/**
 * Deleta um registro de uma tabela específica.
 * @param tableName Nome da tabela.
 * @param id ID do registro a ser deletado.
 */
export async function deleteRecord(tableName: string, id: any): Promise<void> {
  // Validação
  const validTableNames = await getTableNames();
  if (!validTableNames.includes(tableName)) {
    throw new Error(`Tabela "${tableName}" não encontrada.`);
  }

  await prisma.$executeRawUnsafe(
    `DELETE FROM ${tableName} WHERE id = $1;`,
    id
  );
}

/**
 * Obtém um registro específico por ID.
 * @param tableName Nome da tabela.
 * @param id ID do registro.
 */
export async function getRecordById(tableName: string, id: any): Promise<any | null> {
  // Validação
  const validTableNames = await getTableNames();
  if (!validTableNames.includes(tableName)) {
    throw new Error(`Tabela "${tableName}" não encontrada.`);
  }

  const records = await prisma.$queryRawUnsafe(
    `SELECT * FROM ${tableName} WHERE id = $1;`,
    id
  );

  return records.length > 0 ? records[0] : null;
}