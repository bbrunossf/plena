import type { MetaFunction } from "@remix-run/node";
import { ButtonComponent } from "@syncfusion/ej2-react-buttons";
import { Form } from "@remix-run/react";
import { Link } from '@remix-run/react';

export default function Index() {
  return (
    <div>
      <header className="flex justify-between items-center p-4 bg-white shadow">
        <h1 className="text-xl font-bold">Horas Plena</h1>
        <div className="flex gap-2">
          <Link
            to="/login"
            className="px-4 py-2 text-sm text-white bg-blue-500 rounded hover:bg-blue-600"
          >
            Login
          </Link>
          <Form action="/logout" method="post">
            <button
              type="submit"
              className="px-4 py-2 text-sm text-white bg-red-500 rounded hover:bg-red-600"
            >
              Logout
            </button>
          </Form>
        </div>
      </header>

      <div className="max-w-4xl mx-auto mt-8">
        <h1 className="text-3xl font-bold mb-8">Bem-vindo ao Sistema de Gestão</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 mb-4">
            Utilize o menu lateral para navegar entre as diferentes funcionalidades do sistema:
          </p>
          
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Gerencie funcionários e suas informações</li>
            <li>Cadastre e acompanhe projetos</li>
            <li>Registre horas trabalhadas</li>
            <li>Visualize relatórios de custos</li>
          </ul>
        </div>
      </div>
    </div>
  );
}