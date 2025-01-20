// app/routes/costs.tsx
import { useEffect, useState } from 'react';
import { prisma} from "~/db.server";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

// Função para carregar os dados das obras
// export const loader = async () => {
//   const obras = await prisma.obra.findMany({
//     select: {
//       id_obra: true,
//       cod_obra: true,
//       nome_obra: true,
//       id_cliente: true,
//       // data_inicio: true, //está como string; precisa converter para data
//       total_horas_planejadas: true,
//       // data_inicio_planejamento: true, //está como string; precisa converter para data
//       // data_fim_planejamento: true, //está como string; precisa converter para data
//       observacoes_planejamento : true,
//   },
// },    
//   );    
//   return (obras);
// };

// // Função para carregar os dados das categorias
// export const loader = async () => {
//   const categorias = await prisma.categoria.findMany({
//     select: {
//       id_categoria: true,
//       nome_categoria: true,      
//   },
// },    
//   );    
//   return (categorias);
// };

// // Função para carregar os dados dos clientes
// export const loader = async () => {
//   const clientes = await prisma.cliente.findMany({
//     select: {
//       id_cliente: true,
//       nome_cliente: true,      
//       contato: true,
//   },
// },    
//   );    
//   return (clientes);
// };

// //Função para carregar os dados dos funcionarios
// export const loader = async () => {
//   const pessoas = await prisma.pessoa.findMany({
//     select: {
//       id_nome: true,
//       nome: true,
//       funcao: true,
//       email: true,
//       hourlyRate: true,
//       data_criacao: true,
//       ativo: true,      
//   },
// },    
//   );    
//   return (pessoas);
// };

// //Função para carregar os dados dos registros de horas
// export const loader = async () => {
//   const registros = await prisma.registro.findMany({
//     select: {
//       id_registro: true,
//       timestamp: true,
//       id_nome: true,
//       id_obra: true,
//       id_tipo_tarefa: true,
//       id_categoria: true,
//       duracao_minutos: true,      
//   },
// },    
//   );    
//   return (registros);
// };

// //Função para carregar os dados dos tipos de tarefas
// export const loader = async () => {
//   const tarefas = await prisma.tipoTarefa.findMany({
//     select: {
//       id_tipo_tarefa: true,
//       nome_tipo: true,      
//   },
// },    
//   );    
//   return (tarefas);
// };
export const loader = async () => {
  const horasPlena = await prisma.registro.findMany({
    take: 10, // LIMIT 10
    skip: 0,  // OFFSET 0
    select: {
      id_registro: true,
      duracao_minutos: true,
      pessoa: {
        select: {
          hourlyRate: true,
          nome: true
        }
      },
      obra: {
        select: {
          nome_obra: true,
          cod_obra: true
        }
      },
      tipoTarefa: {
        select: {
          nome_tipo: true
        }
      }
    },
    // orderBy: {
    //   obra: {
    //     id_obra: 'asc'
    //   }
    // }    
  }
);
//console.log(horasPlena);

  const consolidatedCosts = horasPlena.reduce((acc, registro) => {
    const key = `${registro.obra.nome_obra}-${registro.tipoTarefa.nome_tipo}`;
    const hoursWorked = registro.duracao_minutos / 60;
    const cost = hoursWorked * (registro.pessoa.hourlyRate || 0);

    if (!acc[key]) {
      acc[key] = {
        obra: registro.obra.nome_obra,
        codigoObra: registro.obra.cod_obra,
        tipoTarefa: registro.tipoTarefa.nome_tipo,
        totalHoras: hoursWorked,
        totalCusto: cost
      };
    } else {
      acc[key].totalHoras += hoursWorked;
      acc[key].totalCusto += cost;
    }
    return acc;
  }, {});

  return json({ consolidatedCosts: Object.values(consolidatedCosts) });
};


export default function Costs() {
  const { consolidatedCosts } = useLoaderData<typeof loader>();

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Custos Consolidados por Obra e Tipo de Tarefa</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead>
            <tr>
              <th className="px-4 py-2">Obra</th>
              <th className="px-4 py-2">Código</th>
              <th className="px-4 py-2">Tipo de Tarefa</th>
              <th className="px-4 py-2">Total Horas</th>
              <th className="px-4 py-2">Custo Total</th>
            </tr>
          </thead>
          <tbody>
            {consolidatedCosts.map((item, index) => (
              <tr key={index}>
                <td className="border px-4 py-2">{item.obra}</td>
                <td className="border px-4 py-2">{item.codigoObra}</td>
                <td className="border px-4 py-2">{item.tipoTarefa}</td>
                <td className="border px-4 py-2">{item.totalHoras.toFixed(2)}</td>
                <td className="border px-4 py-2">R$ {item.totalCusto.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
