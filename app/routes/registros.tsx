import { useEffect, useState } from 'react';
import { prisma } from "~/db.server";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { ButtonComponent } from "@syncfusion/ej2-react-buttons";
import _ from 'lodash';
import { GridComponent, ColumnsDirective, ColumnDirective, Sort, Filter, Page, Inject } from '@syncfusion/ej2-react-grids';

export const loader = async ({ request }: { request: Request }) => {
  try {
    // Busca todos os dados necessários de uma vez
    const registros = await prisma.$queryRaw`
      SELECT 
    o.nome_obra,
    o.cod_obra,
    t.nome_tipo,
    p.hourlyRate,
    p.nome,
    r.duracao_minutos AS horas_trabalhadas 
    FROM Registro r
    INNER JOIN Obra o ON r.id_obra = o.id_obra
    INNER JOIN TipoTarefa t ON r.id_tipo_tarefa = t.id_tipo_tarefa
    INNER JOIN Pessoa p ON r.id_nome = p.id_nome   
    ORDER BY o.nome_obra, t.nome_tipo
    `;

    console.log(registros);
    return { registros };
    

  } catch (error) {
    return json({ 
      error: "Erro ao buscar registros",
      details: error.message 
    }, { status: 500 });
  }
};

export default function Registros() {
  const { registros } = useLoaderData<typeof loader>();

  const formatTime = (minutos: number) => {
    const hours = Math.floor(minutos / 60);
    const minutes = minutos % 60;
    return `${hours}h${minutes}min`;
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Registros de Horas</h2>
      
      <GridComponent 
        dataSource={registros}
        allowSorting={true}
        allowFiltering={true}
        allowPaging={true}
        pageSettings={{ pageSize: 10 }}
      >
        <ColumnsDirective>
          <ColumnDirective 
            field='nome_obra' 
            headerText='Obra' 
            width='200'
          />
          <ColumnDirective 
            field='cod_obra' 
            headerText='Código' 
            width='120'
          />
          <ColumnDirective 
            field='nome_tipo' 
            headerText='Tipo de Tarefa' 
            width='180'
          />
          <ColumnDirective 
            field='nome' 
            headerText='Pessoa' 
            width='180'
          />
          <ColumnDirective 
            field='horas_trabalhadas' 
            headerText='Tempo' 
            width='120'
            valueAccessor={(field: any) => formatTime(field.horas_trabalhadas)}
          />
          <ColumnDirective 
            field='hourlyRate' 
            headerText='Valor Hora' 
            width='120'
            valueAccessor={(field: any) => formatCurrency(field.hourlyRate)}
          />
          <ColumnDirective 
            field='custo' 
            headerText='Custo Total' 
            width='120'
            valueAccessor={(field: any) => formatCurrency((field.horas_trabalhadas / 60) * field.hourlyRate)}
          />
        </ColumnsDirective>
        <Inject services={[Sort, Filter, Page]} />
      </GridComponent>
    </div>
  );
}