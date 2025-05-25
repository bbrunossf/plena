import { useEffect, useState } from 'react';
import { prisma } from "~/db.server";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { ButtonComponent } from "@syncfusion/ej2-react-buttons";
import _ from 'lodash';

import { LoaderFunctionArgs , redirect } from "@remix-run/node";
import { requireAdmin } from "~/auth.server";


export const loader = async ({ request }: LoaderFunctionArgs) => {
  
    // // Verifica se o usuário está autenticado
    await requireAdmin(request);

    // Busca todos os dados necessários de uma vez
    // const registros = await prisma.$queryRaw`
    //   SELECT 
    //     o.nome_obra,
    //     o.cod_obra,
    //     t.nome_tipo,
    //     p.hourlyRate,
    //     p.nome,
    //     r.duracao_minutos AS horas_trabalhadas 
    //   FROM Registro r
    //   INNER JOIN Obra o ON r.id_obra = o.id_obra
    //   INNER JOIN TipoTarefa t ON r.id_tipo_tarefa = t.id_tipo_tarefa
    //   INNER JOIN Pessoa p ON r.id_nome = p.id_nome   
    //   ORDER BY o.nome_obra, t.nome_tipo
    // `;
    const registros = await prisma.registro.findMany({                  
      select: {
        timestamp: false,
        duracao_minutos: true,
        hora_extra: true,
        
        obra: {
          select: {
            nome_obra: true,
            cod_obra: true,
          },
        },

        tipoTarefa: {
          select: {
            nome_tipo: true,
          },
        },        

        pessoa: {
          select: {
            nome: true,
            hourlyRate: true,
          },
        }, 
      },
      where: { 
        timestamp: {
          gte: new Date("2025-01-01"), // Data de início do filtro
        },
      },
      orderBy: [        
        {
          obra: {
            nome_obra: "asc",
          },
          
        },
      ],      
    });

    // Retorna os registros no formato JSON
    return ({ registros });
  };

export default function Costs() {
    const { registros } = useLoaderData<typeof loader>();
    const [viewType, setViewType] = useState<'obra' | 'tipo' | 'pessoa'>('obra');
    const [aggregatedData, setAggregatedData] = useState<any[]>([]);
  
    useEffect(() => {
      const processData = () => {
        switch (viewType) {
          case 'obra':
            return _.chain(registros)
              .groupBy('obra.nome_obra')
              .map((group, key) => ({
                categoria: key,
                codigo: group[0].obra.cod_obra,
                total_horas: _.sumBy(group, r => r.duracao_minutos / 60),
                custo_total: _.sumBy(group, r => r.duracao_minutos / 60 * r.pessoa.hourlyRate),
                pessoas_envolvidas: _.uniqBy(group, 'pessoa.nome').length,
                tipos_tarefa: _.uniqBy(group, 'tipoTarefa.nome_tipo').length,
                custo_medio_hora: _.meanBy(group, r => r.pessoa.hourlyRate)
              }))                          
              .orderBy(['nome_obra', 'custo_total'], ['asc', 'desc'])
              .value();
  
          case 'tipo':
            return _.chain(registros)
              .groupBy('tipoTarefa.nome_tipo')
              .map((group, key) => ({
                categoria: key,
                total_horas: _.sumBy(group, r => r.duracao_minutos / 60),
                custo_total: _.sumBy(group, r => r.duracao_minutos / 60 * r.pessoa.hourlyRate),
                obras_relacionadas: _.uniqBy(group, 'obra.nome_obra').length,
                pessoas_envolvidas: _.uniqBy(group, 'pessoa.nome').length,
                custo_medio_hora: _.meanBy(group, r => r.pessoa.hourlyRate)
              }))
              .orderBy(['total_horas'], ['desc'])
              .value();
  
          case 'pessoa':
            return _.chain(registros)
              .groupBy('pessoa.nome')
              .map((group, key) => ({
                categoria: key,
                total_horas: _.sumBy(group, r => r.duracao_minutos / 60),
                custo_total: _.sumBy(group, r => r.duracao_minutos / 60 * r.pessoa.hourlyRate),
                obras_envolvidas: _.uniqBy(group, 'obra.nome_obra').length,
                tipos_realizados: _.uniqBy(group, 'tipoTarefa.nome_tipo').length,
                valor_hora: group[0].pessoa.hourlyRate
              }))
              .orderBy(['custo_total'], ['desc'])
              .value();
        }
      };
  
      setAggregatedData(processData());
    }, [registros, viewType]);
  
    const renderTableHeaders = () => {
      const commonHeaders = [
        'Total Horas',
        'Custo Total',
      ];
  
      const specificHeaders = {
        obra: ['Código', 'Pessoas Envolvidas', 'Tipos de Tarefa', 'Custo Médio/Hora'],
        tipo: ['Obras Relacionadas', 'Pessoas Envolvidas', 'Custo Médio/Hora'],
        pessoa: ['Valor/Hora', 'Obras Envolvidas', 'Tipos Realizados']
      };
  
      return [...commonHeaders, ...specificHeaders[viewType]];
    };
  
    const renderTableCell = (item: any, header: string) => {
      switch (header) {
        case 'Total Horas':
          return Number(item.total_horas).toFixed(2);
        case 'Custo Total':
        case 'Valor/Hora':
        case 'Custo Médio/Hora':
          return Number(header === 'Custo Total' ? item.custo_total : 
                       header === 'Valor/Hora' ? item.valor_hora : 
                       item.custo_medio_hora)
            .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        default:
          return item[_.camelCase(header.toLowerCase())];
      }
    };
  
    return (
      // <div className="p-4">
      <div className="w-full min-w-full px-2 ml-1">
      {/* // <div className="flex w-full max-w-screen overflow-hidden"> */}
        {/* // <div className="flex justify-between items-left mb-4"> */}
        <div className="flex justify-between items-center w-full mb-4 gap-4">
          <h2 className="text-2xl font-bold">Análise de Custos e Horas</h2>
          <div className="space-x-2">
            <ButtonComponent 
              cssClass={`e-primary ${viewType === 'obra' ? 'e-info' : 'default-class'}`}
              onClick={() => setViewType('obra')}
            >
              Por Obra
            </ButtonComponent>
            <ButtonComponent 
              cssClass={`e-primary ${viewType === 'tipo' ? 'e-info' : 'default-class'}`}
              onClick={() => setViewType('tipo')}
            >
              Por Tipo
            </ButtonComponent>
            <ButtonComponent 
              cssClass={`e-primary ${viewType === 'pessoa' ? 'e-info' : 'default-class'}`}
              onClick={() => setViewType('pessoa')}
            >
              Por Pessoa
            </ButtonComponent>
          </div>
        </div>
  
        {/* <div className="overflow-x-auto"> */}
        <div className="overflow-x-auto w-full">
          {/* <table className="min-w-full table-auto"> */}
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr>
                <th className="px-4 py-2">
                  {viewType === 'obra' ? 'Obra' : 
                   viewType === 'tipo' ? 'Tipo de Tarefa' : 
                   'Pessoa'}
                </th>
                {renderTableHeaders().map(header => (
                  <th key={header} className="px-4 py-2">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {aggregatedData.map((item) => (
                <tr key={item.categoria}>
                  <td className="border px-4 py-2">{item.categoria}</td>
                  {renderTableHeaders().map(header => (
                    <td key={header} className="border px-4 py-2 text-right">
                      {renderTableCell(item, header)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }