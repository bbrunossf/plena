//app/routes/admin/index.jsx
//Nota: não testei o react-admin <https://marmelab.com/react-admin/Remix.html>
//Não testei o add/edit/delete
import { useLoaderData, Link } from "@remix-run/react";
import { getTableNames } from "~/services/dbService.server";

export const loader = async () => {
  const tables = await getTableNames();
  return { tables };
};

export default function AdminDashboard() {
  const { tables } = useLoaderData();
  
  return (
    <div>
      <h1>Painel Administrativo</h1>
      <ul>
        {tables.map(table => (
          <li key={table}>
            <Link to={table}>{table}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}