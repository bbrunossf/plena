//app/routes/admin/$tableName.jsx
import { useLoaderData, Form, redirect } from "@remix-run/react";
import { prisma } from "~/db.server";
import { getTableNames, getTableColumns, getRecords, addRecord, editRecord, deleteRecord } from "~/services/dbService.server";


export const loader = async ({ params }) => {
  const { tableName } = params;
  
  // Obtém e valida as tabelas
  const tables = await getTableNames();
  if (!tables.includes(tableName)) {
    throw new Response("Tabela não encontrada", { status: 404 });
  }
  
  // Obtém as colunas e registros
  const columns = await getTableColumns(tableName);
  const records = await getRecords(tableName);
  
  return { tableName, columns, records };
};

export default function TableAdmin() {
  const { tableName, columns, records } = useLoaderData();
  
  // Identificar a chave primária
  const primaryKey = columns.find(col => col.pk)?.name || "id";
  
  return (
    <div>
      <h2>Administrar Tabela: {tableName}</h2>
      
      <h3>Registros</h3>
      <table>
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.name}>{col.name}</th>
            ))}
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {records.map(record => (
            <tr key={record[primaryKey]}>
              {columns.map(col => (
                <td key={col.name}>{record[col.name]}</td>
              ))}
              <td>
                {/* Link para editar */}
                <Form method="get" action={`/admin/${tableName}/edit/${record[primaryKey]}`}>
                  <button type="submit">Editar</button>
                </Form>
                {/* Form para deletar */}
                <Form method="post" onSubmit="return confirm('Tem certeza que deseja deletar este registro?');">
                  <input type="hidden" name="action" value="delete" />
                  <input type="hidden" name="id" value={record[primaryKey]} />
                  <button type="submit">Deletar</button>
                </Form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <h3>Adicionar Novo Registro</h3>
      <Form method="post">
        <input type="hidden" name="action" value="add" />
        {columns.map(col => (
          col.pk && col.pk > 0 ? null : ( // Evitar criar campo para chaves primárias autoincrementáveis
            <div key={col.name}>
              <label htmlFor={col.name}>{col.name}</label>
              <input type="text" name={col.name} id={col.name} />
            </div>
          )
        ))}
        <button type="submit">Adicionar</button>
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
      case "add":
        {
          const data = {};
          for (let [key, value] of formData.entries()) {
            if (key !== "action") {
              data[key] = value;
            }
          }
          
          await addRecord(tableName, data);
          
          return redirect(`/admin/${tableName}`);
        }
        
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
        
      case "delete":
        {
          const id = formData.get("id");
          if (!id) {
            throw new Response("ID não fornecido para deleção", { status: 400 });
          }
          
          await deleteRecord(tableName, id);
          
          return redirect(`/admin/${tableName}`);
        }
        
      default:
        throw new Response("Ação desconhecida", { status: 400 });
    }
  } catch (error) {
    console.error(error);
    throw new Response("Erro ao processar a ação.", { status: 500 });
  }
};