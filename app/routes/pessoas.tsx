import { Form, useLoaderData } from "@remix-run/react";
import { prisma } from "~/db.server";
import {type ClientActionFunctionArgs } from "@remix-run/react";
import { useState } from "react";
import { LoaderFunctionArgs } from "@remix-run/node";
import { requireAdmin } from "~/auth.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
    // Add admin check
    await requireAdmin(request);
    
    const pessoas = await prisma.pessoa.findMany({
      select: {
        id_nome: true,
        nome: true,
        funcao: true,
        email: true,
        hourlyRate: true,        
        ativo: true,
      },
      orderBy: {
        nome: 'desc',
      },
  });
    
    //const clientes = await prisma.cliente.findMany();
    return ({ pessoas });
  };

  export const action = async ({ request }: ClientActionFunctionArgs) => {
    const formData = await request.formData();
    const action = formData.get("_action");
  
    if (action === "create") {  
      return await prisma.pessoa.create({
        data: {
          nome: formData.get("nome") as string,
          funcao: formData.get("funcao") as string,
          email: formData.get("email") as string,
          hourlyRate: parseFloat(formData.get("hourlyRate") as string),
          data_criacao: new Date(),
          ativo: formData.get("ativo") === "true",
        },
      });
    }
  
    if (action === "update") {  
      return await prisma.pessoa.update({
        where: { id_nome: parseInt(formData.get("id_nome") as string) },
        data: {
          nome: formData.get("nome") as string,
          funcao: formData.get("funcao") as string,
          email: formData.get("email") as string,
          hourlyRate: parseFloat(formData.get("hourlyRate") as string),
          ativo: formData.get("ativo") === "true",
        },
      });
    }
  
    if (action === "delete") {
      return await prisma.pessoa.delete({
        where: { id_nome: parseInt(formData.get("id_nome") as string) },
      });
    }
  
    return null;
  };  

  export default function Pessoas() {
    const { pessoas } = useLoaderData<typeof loader>();
    const [editingPessoa, setEditingPessoa] = useState<typeof pessoas[0] | null>(null);
  
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Gestão de Pessoas</h1>
  
        {/* Create Form */}
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Novo Cadastro</h2>
          <Form method="post" className="grid grid-cols-2 gap-4">
            <input type="hidden" name="_action" value={editingPessoa ? "update" : "create"}  />
  
            {editingPessoa && (<input type="hidden" name="id_nome" value={editingPessoa.id_nome} />)}
             
            <div>
              <label className="block text-sm font-medium mb-1">Nome da Pessoa</label>
              <input
                type="text"
                name="nome"
                className="w-full p-2 border rounded"
                defaultValue={editingPessoa?.nome || ""}
                required
              />
            </div>
  
            <div>
              <label className="block text-sm font-medium mb-1">Função</label>
              <input
                  type="text"
                  name="funcao" 
                  className="w-full p-2 border rounded" 
                  defaultValue={editingPessoa?.funcao || ""}
                  required               
              />
            </div>
  
            <div>
              <label className="block text-sm font-medium mb-1">Taxa horaria</label>
              <input
                type="number"
                name="hourlyRate"
                className="w-full p-2 border rounded"
              />
            </div>
             
  
            <div className="col-span-2 flex gap-2">
              <button
                  type="submit"
                  className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 flex-1"
              >
                  {editingPessoa ? "Salvar Alterações" : "Criar Cadastro de Pessoa"}
              </button>
              {editingPessoa && (
                  <button
                  type="button"
                  onClick={() => setEditingPessoa(null)}
                  className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
                  >
                  Cancelar
                  </button>
              )}
              </div>
          </Form>
        </div>
  
        {/* List of Pessoas */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-100">                
                <th className="px-4 py-2">Nome</th>
                <th className="px-4 py-2">Função</th>
                {/* <th className="px-4 py-2">Data Início</th> */}
                <th className="px-4 py-2">Taxa horaria</th>                
              </tr>
            </thead>
            <tbody>
              {pessoas.map((pessoa) => (
                <tr key={pessoa.id_nome} className="border-t">                  
                  <td className="px-4 py-2">{pessoa.nome}</td>
                  <td className="px-4 py-2">{pessoa.funcao}</td>
                  <td className="px-4 py-2">{pessoa.hourlyRate}</td>
                  <td className="px-4 py-2">
                  <button
                      onClick={() => setEditingPessoa(pessoa)}
                      className="bg-yellow-500 text-white py-1 px-3 rounded text-sm hover:bg-yellow-600 mr-2"
                  >
                      Editar
                  </button>
                  <Form method="post" className="inline">
                      <input type="hidden" name="_action" value="delete" />
                      <input type="hidden" name="id_nome" value={pessoa.id_nome} />
                      <button
                      type="submit"
                      className="bg-red-500 text-white py-1 px-3 rounded text-sm hover:bg-red-600"
                      onClick={(e) => {
                          if (!confirm("Confirma exclusão deste registro?")) {
                          e.preventDefault();
                          }
                      }}
                      >
                      Excluir
                      </button>
                  </Form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
    