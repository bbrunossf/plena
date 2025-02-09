//app/routes/admin/$tableName.jsx
import { useLoaderData, Form, redirect } from "@remix-run/react";
import { MdEdit, MdDelete, MdAdd } from "react-icons/md";
import { getTableNames, getTableColumns, getRecords, addRecord, editRecord, deleteRecord } from "~/services/dbService.server";

export const loader = async ({ params }) => {
  const { tableName } = params;
  const tables = await getTableNames();
  if (!tables.includes(tableName)) {
    throw new Response("Tabela não encontrada", { status: 404 });
  }
  const columns = await getTableColumns(tableName);
  const records = await getRecords(tableName);
  return { tableName, columns, records };
};

export default function TableAdmin() {
  const { tableName, columns, records } = useLoaderData();
  const primaryKey = columns.find(col => col.pk)?.name || "id";

  return (
    <div className="p-6 max-w-5xl mx-auto bg-white rounded-xl shadow-md space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Administrar Tabela: {tableName}</h2>
      
      <h3 className="text-xl font-semibold text-gray-700">Registros</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300 rounded-lg">
          <thead className="bg-gray-200">
            <tr>
              {columns.map(col => (
                <th key={col.name} className="px-4 py-2 text-left border-b">{col.name}</th>
              ))}
              <th className="px-4 py-2 border-b">Ações</th>
            </tr>
          </thead>
          <tbody>
            {records.map(record => (
              <tr key={record[primaryKey]} className="odd:bg-gray-50 hover:bg-gray-100">
                {columns.map(col => (
                  <td key={col.name} className="px-4 py-2 border-b">{record[col.name]}</td>
                ))}
                <td className="px-4 py-2 border-b flex space-x-2">
                  <Form method="get" action={`/admin/${tableName}/edit/${record[primaryKey]}`}>
                    <button type="submit" className="text-blue-500 hover:text-blue-700">
                      <MdEdit size={20} />
                    </button>
                  </Form>
                  <Form method="post" onSubmit={() => confirm('Tem certeza que deseja deletar este registro?')}> 
                    <input type="hidden" name="action" value="delete" />
                    <input type="hidden" name="id" value={record[primaryKey]} />
                    <button type="submit" className="text-red-500 hover:text-red-700">
                      <MdDelete size={20} />
                    </button>
                  </Form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <h3 className="text-xl font-semibold text-gray-700">Adicionar Novo Registro</h3>
      <Form method="post" className="space-y-4">
        <input type="hidden" name="action" value="add" />
        <div className="grid grid-cols-2 gap-4">
          {columns.map(col => (
            col.pk ? null : (
              <div key={col.name}>
                <label htmlFor={col.name} className="block text-gray-600 font-medium">{col.name}</label>
                <input 
                  type="text" 
                  name={col.name} 
                  id={col.name} 
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
            )
          ))}
        </div>
        <button type="submit" className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
          <MdAdd size={20} className="mr-2" /> Adicionar
        </button>
      </Form>
    </div>
  );
}
