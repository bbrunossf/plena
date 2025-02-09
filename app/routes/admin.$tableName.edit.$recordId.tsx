import { useLoaderData, Form, redirect } from "@remix-run/react";
import { getTableNames, getTableColumns, getRecordById, editRecord } from "~/services/dbService.server";

export const loader = async ({ params }) => {
  const { tableName, recordId } = params;
  
  // Validar tabela
  const tables = await getTableNames();
  if (!tables.includes(tableName)) {
    throw new Response("Tabela não encontrada", { status: 404 });
  }
  
  // Obter colunas
  const columns = await getTableColumns(tableName);
  
  // Obter registro específico
  const record = await getRecordById(tableName, recordId);
  if (!record) {
    throw new Response("Registro não encontrado", { status: 404 });
  }
  
  return { tableName, columns, record };
};

export default function EditRecord() {
  const { tableName, columns, record } = useLoaderData();
  
  // Identificar a chave primária
  const primaryKey = columns.find(col => col.pk)?.name || "id";
  
  return (
    <div>
      <h2>Editar Registro na Tabela: {tableName}</h2>
      <Form method="post">
        <input type="hidden" name="action" value="edit" />
        <input type="hidden" name="id" value={record[primaryKey]} />
        {columns.map(col => (
          col.pk && col.pk > 0 ? null : ( // Evitar editar a chave primária autoincrementável
            <div key={col.name}>
              <label htmlFor={col.name}>{col.name}</label>
              <input type="text" name={col.name} id={col.name} defaultValue={record[col.name]} />
            </div>
          )
        ))}
        <button type="submit">Salvar Alterações</button>
      </Form>
    </div>
  );
}

export const action = async ({ request, params }) => {
  const { tableName } = params;
  const formData = await request.formData();
  
  const actionType = formData.get("action");
  
  try {
    switch (actionType) {
      case "edit":
        {
          const id = formData.get("id");
          if (!id) {
            throw new Response("ID não fornecido para edição", { status: 400 });
          }
          
          const data = {};
          for (let [key, value] of formData.entries()) {
            if (key !== "action" && key !== "id") {
              data[key] = value;
            }
          }
          
          await editRecord(tableName, id, data);
          
          return redirect(`/admin/${tableName}`);
        }
        
      default:
        throw new Response("Ação desconhecida", { status: 400 });
    }
  } catch (error) {
    console.error(error);
    throw new Response("Erro ao editar o registro.", { status: 500 });
  }
};