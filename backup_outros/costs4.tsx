import { useEffect, useState } from 'react';
import { prisma} from "~/db.server";
import { json } from "@remix-run/node";
import { useLoaderData, useSearchParams  } from "@remix-run/react";

import { ButtonComponent } from "@syncfusion/ej2-react-buttons";

import { enableRipple } from '@syncfusion/ej2-base';
enableRipple(true);

import '@syncfusion/ej2-react-buttons/styles/material3.css';

export const loader = async ({ request }: { request: Request }) => {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const pageSize = 7; // Aumentamos para 20 para testar
  const skip = (page - 1) * pageSize;

  // Log dos parâmetros de paginação
  console.log("Parâmetros de paginação:", {
    page,
    pageSize,
    skip
  });

  // Get total count for pagination
  const totalCount = await prisma.registro.count();
  console.log("Total de registros:", totalCount);

  const totalPages = Math.ceil(totalCount / pageSize);
  console.log("Total de páginas:", totalPages);
    
  try {  
    const horasPlena = await prisma.$queryRaw`
    SELECT 
    o.nome_obra,
    o.cod_obra,
    t.nome_tipo,
    p.hourlyRate,
    p.nome
    FROM Registro r
    INNER JOIN Obra o ON r.id_obra = o.id_obra
    INNER JOIN TipoTarefa t ON r.id_tipo_tarefa = t.id_tipo_tarefa
    INNER JOIN Pessoa p ON r.id_nome = p.id_nome   
    ORDER BY o.nome_obra, t.nome_tipo
    LIMIT ${pageSize}
    OFFSET ${skip}`


    // const horasPlena = await prisma.registro.findMany(
    //   {
    //     take: pageSize,
    //     skip: skip,

    //     include: {
    //       obra: {
    //         select: {              
    //           cod_obra: true
    //         }
    //       }
    //     },

    //     // include: {
    //     //   obra: {
    //     //     select: {
    //     //       nome_obra: true,
    //     //       cod_obra: true
    //     //     }
    //     //   },
    //     // },
    //   }
    //);

    console.log("Quantidade de registros retornados:", horasPlena.length);
    console.log(horasPlena);

        
    return ({ 
      horasPlena,      
      pagination: {
        currentPage: page,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });

  } catch (error) {
    console.error("Erro ao buscar registros:", error);
    return json({ 
      error: "Erro ao buscar registros",
      details: error.message 
    }, { status: 500 });
  }
};
  
  export default function Costs() {
    const { horasPlena, pagination } = useLoaderData<typeof loader>();
    const [searchParams, setSearchParams] = useSearchParams();
  
    const handlePageChange = (newPage: number) => {
      setSearchParams({ page: newPage.toString() });	  
    };
	
	  
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
              {horasPlena.map((registro) => (
                <tr key={registro.id_registro}>
                  <td className="border px-4 py-2">{registro.nome_obra}</td>
                  <td className="border px-4 py-2">{registro.cod_obra}</td>
                  <td className="border px-4 py-2">{registro.nome_tipo}</td>                  
                </tr>
              ))}
            </tbody>
          </table>
        </div>
  
        <div className="flex justify-center gap-2 mt-4">
        <ButtonComponent 
          onClick={() => handlePageChange(pagination.currentPage - 1)}
          disabled={!pagination.hasPreviousPage}
          cssClass="e-primary"
          
        >
          Anterior
        </ButtonComponent>
        <span className="py-2 px-4">
          Página {pagination.currentPage} de {pagination.totalPages}
        </span>
        <ButtonComponent 
          onClick={() => handlePageChange(pagination.currentPage + 1)}
          disabled={!pagination.hasNextPage}
          cssClass="e-primary"
          
        >
          Próxima
        </ButtonComponent>
        </div>
      </div>
    );
  }