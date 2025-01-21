import { useEffect, useState } from 'react';
import { prisma } from "~/db.server";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { ButtonComponent } from "@syncfusion/ej2-react-buttons";
import _ from 'lodash';

import { LoaderFunctionArgs , redirect } from "@remix-run/node";
import { requireAdmin } from "~/auth.server";


export async function loader({ request }: LoaderFunctionArgs ) {
  try {
    // // Verifica se o usuário está autenticado
    await requireAdmin(request);

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

    // Retorna os registros no formato JSON
    return json({ registros });
  } catch (error) {
    // Captura e retorna erros adequados
    return json(
      {
        error: "Erro ao carregar os dados",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export default function Costs() {
    const { registros } = useLoaderData<typeof loader>();
    const [viewType, setViewType] = useState<'obra' | 'tipo' | 'pessoa'>('obra');
    const [aggregatedData, setAggregatedData] = useState<any[]>([]);
  
    useEffect(() => {
      const processData = () => {
        switch (viewType) {
          case 'obra':
            return _.chain(registros)
              .groupBy('nome_obra')
              .map((group, key) => ({
                categoria: key,
                codigo: group[0].cod_obra,
                total_horas: _.sumBy(group, r => r.horas_trabalhadas / 60),
                custo_total: _.sumBy(group, r => r.horas_trabalhadas / 60 * r.hourlyRate),
                pessoas_envolvidas: _.uniqBy(group, 'nome').length,
                tipos_tarefa: _.uniqBy(group, 'nome_tipo').length,
                custo_medio_hora: _.meanBy(group, r => r.hourlyRate)
              }))                          
              .orderBy(['nome_obra', 'custo_total'], ['asc', 'desc'])
              .value();
  
          case 'tipo':
            return _.chain(registros)
              .groupBy('nome_tipo')
              .map((group, key) => ({
                categoria: key,
                total_horas: _.sumBy(group, r => r.horas_trabalhadas / 60),
                custo_total: _.sumBy(group, r => r.horas_trabalhadas / 60 * r.hourlyRate),
                obras_relacionadas: _.uniqBy(group, 'nome_obra').length,
                pessoas_envolvidas: _.uniqBy(group, 'nome').length,
                custo_medio_hora: _.meanBy(group, r => r.hourlyRate)
              }))
              .orderBy(['total_horas'], ['desc'])
              .value();
  
          case 'pessoa':
            return _.chain(registros)
              .groupBy('nome')
              .map((group, key) => ({
                categoria: key,
                total_horas: _.sumBy(group, r => r.horas_trabalhadas / 60),
                custo_total: _.sumBy(group, r => r.horas_trabalhadas / 60 * r.hourlyRate),
                obras_envolvidas: _.uniqBy(group, 'nome_obra').length,
                tipos_realizados: _.uniqBy(group, 'nome_tipo').length,
                valor_hora: group[0].hourlyRate
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
        {/* <div className="flex justify-between items-left mb-4"> */}
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