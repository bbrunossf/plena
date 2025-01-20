import { useEffect, useState } from 'react';
import { prisma} from "~/db.server";
import { json } from "@remix-run/node";
import { useLoaderData, useSearchParams  } from "@remix-run/react";

import { ButtonComponent } from "@syncfusion/ej2-react-buttons";
//import pkg from '@syncfusion/ej2-react-buttons';
//const {ButtonComponent} = pkg;



//import pkg2 from '@syncfusion/ej2-base';
//const {enableRipple} = pkg2;
import { enableRipple } from '@syncfusion/ej2-base';
enableRipple(true);

import '@syncfusion/ej2-react-buttons/styles/material3.css';

export const loader = async ({ request }: { request: Request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const pageSize = 5; //o maximo que deu sem dar erros foi 17
    const skip = (page - 1) * pageSize;
  
    // Get total count for pagination
    const totalCount = await prisma.registro.count();
    const totalPages = Math.ceil(totalCount / pageSize);
  
    const horasPlena = await prisma.registro.findMany({
      take: pageSize,
      skip: skip,
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
      }
    });
  
    console.log("registros de horas:", horasPlena) //só retorna a qtde de registros definidos em pageSize
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
  
    return ({ 
      consolidatedCosts: Object.values(consolidatedCosts),
      pagination: {
        currentPage: page,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });
  };
  
  export default function Costs() {
    const { consolidatedCosts, pagination } = useLoaderData<typeof loader>();
    const [searchParams, setSearchParams] = useSearchParams();
  
    const handlePageChange = (newPage: number) => {
      setSearchParams({ page: newPage.toString() });	  
    };
	
	// const handlePageChange = (newPage: number) => {
	  // console.log('Changing to page:', newPage);
	  // const current = Object.fromEntries(searchParams);
	  // setSearchParams({ ...current, page: newPage.toString() });
	// };
  
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