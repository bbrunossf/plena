//precisa arrumar, agora que as colunas de custos sairam da tabela pessoa e foram para a tabela custoHora

import { useEffect, useState } from 'react';
import { prisma } from "~/db.server";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { ButtonComponent } from "@syncfusion/ej2-react-buttons";
import _ from 'lodash';
import { useNavigate, useSearchParams } from "@remix-run/react";

import DataGrid from 'react-data-grid';
import 'react-data-grid/lib/styles.css';

import { LoaderFunctionArgs , redirect } from "@remix-run/node";
import { requireAdmin } from "~/auth.server";
import { s } from 'node_modules/vite/dist/node/types.d-aGj9QkWt';


export const loader = async ({ request }: LoaderFunctionArgs) => {
  
    // // Verifica se o usuário está autenticado
    await requireAdmin(request);

    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate') || new Date(new Date().getFullYear(), 0, 1).toISOString();
    const endDate = url.searchParams.get('endDate') || new Date().toISOString();

    // Busca todos os dados necessários de uma vez   
    const registros = await prisma.registro.findMany({                  
      select: {
        timestamp: true, // Agora precisamos da data
        duracao_minutos: true,
        hora_extra: true,
        
        obra: {
          select: {
            nome_obra: true,
            cod_obra: true,
            data_inicio: true, // Para filtrar obras
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
            custos: {
              select: {
                custoHora: true,
                custoHoraExtra: true,
                inicioVigencia: true,
                fimVigencia: true,
              },
              orderBy: { inicioVigencia: 'desc' }
            }
          },
        }, 
      },
      where: { 
        AND: [
          {
            timestamp: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          },
          {
            obra: {
              data_inicio: {
                lte: new Date(endDate), // Obra deve ter começado antes ou durante o período
              }
            }
          }
        ]
      },
      orderBy: [        
        {
          obra: {
            nome_obra: "asc",
          },
        },
      ],      
    });

    const newStartDate = new Date(startDate).toISOString().slice(0, -1); //esse slice tira o 'Z' do final da string ISO
    const newEndDate = new Date(endDate).toISOString().slice(0, -1);
  
    return { registros, startDate: newStartDate, endDate: newEndDate };
  };
    

export default function Costs() {
    const { registros, startDate, endDate } = useLoaderData<typeof loader>();
    //console.log(startDate, endDate);
    
    const [viewType, setViewType] = useState<'obra' | 'tipo' | 'pessoa'>('obra');
    const [aggregatedData, setAggregatedData] = useState<any[]>([]);
    
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    
    const [dateFilter, setDateFilter] = useState({
    // Usar as datas que vieram do loader
    // startDate: new Date(startDate).toISOString().split('T')[0],
    // endDate: new Date(endDate).toISOString().split('T')[0]
    startDate: new Date(startDate).toLocaleString(), //como já vem com 2025-06-07T00:00:00.000, não precisa converter
    endDate: new Date(endDate).toLocaleString()
    });

    
    // Função corrigida para obter a taxa de uma pessoa em uma data específica
    const obterTaxaPorData = (custosPersona: any[], dataRegistro: string, isHoraExtra: boolean = false) => {
    //   console.log("=== DEBUG obterTaxaPorData ===");
    //   console.log("custosPersona recebido:", custosPersona);
    //   console.log("dataRegistro recebido:", dataRegistro);
    //   console.log("isHoraExtra:", isHoraExtra);

      //custosPersona vem com o array de custos da pessoa: [{custoHora: 10, custoHoraExtra: 15, inicioVigencia: '2023-01-01', fimVigencia: '2023-12-31'},...]



      //recebe a data do registro como string e faz a operação com Date
      //const dataRegistroString = dataRegistro.toISOString().split('T')[0];
      //const dataRegistroString = dataRegistro;
      const dataDateRegistro = new Date(dataRegistro);
      //console.log("dataDateRegistro convertida:", dataDateRegistro);
      
      // Encontrar a taxa válida para a data (ordenada por inicioVigencia desc)
      const taxaValida = custosPersona.find(custo => {
        // console.log("Analisando custo:", custo);
        // console.log("custo.inicioVigencia:", custo.inicioVigencia);
        // console.log("custo.custoHora:", custo.custoHora, "tipo:", typeof custo.custoHora);
        // console.log("custo.custoHoraExtra:", custo.custoHoraExtra, "tipo:", typeof custo.custoHoraExtra);
        
          //const inicioString = new Date(custo.inicioVigencia).toISOString().split('T')[0];
          const inicioDate = new Date(custo.inicioVigencia);
        //   console.log("inicioDate:", inicioDate);
        //   console.log("Comparação dataDateRegistro >= inicioDate:", dataDateRegistro >= inicioDate);

          const fimString = custo.fimVigencia
            ? new Date(custo.fimVigencia)
            : '9999-12-31'; 
        //   console.log("+++++ dataRegistro:", dataDateRegistro);
        //   console.log("+++++ inicioDate:", inicioDate);
        //   console.log("+++++ fimString:", fimString);
        //   console.log("+++++ dataDateRegistro >= inicioDate ?:", dataDateRegistro >= inicioDate);
          return dataDateRegistro >= inicioDate; // && dataDateRegistro <= fimString; //ok, retorna true ou false
      });

      //console.log("taxaValida encontrada:", taxaValida);

      if (!taxaValida) {
          console.warn(`Taxa não encontrada para a pessoa na data ${dataDateRegistro.toISOString()}`);
          return { valor: 0, taxaInfo: null };
      }

      // const valor = isHoraExtra ? (taxaValida.custoHoraExtra) : (taxaValida.custoHora);
      
      // CORREÇÃO: Usar .toNumber() para converter Prisma.Decimal
      const valor = isHoraExtra 
        ? taxaValida.custoHoraExtra
        : taxaValida.custoHora;
      //console.log("+++++ valor", valor);
      

      
      // Retornar tanto o valor quanto informações da taxa para debug/identificação
      return { 
        valor, //já é o valor da hora extra ou da hora normal, como Float
        taxaInfo: {
          inicioVigencia: taxaValida.inicioVigencia,
          fimVigencia: taxaValida.fimVigencia,
          custoHora: taxaValida.custoHora,
          custoHoraExtra: taxaValida.custoHoraExtra
        }
      };
    };
    

    // Função para calcular custo considerando a taxa correta por data
    const calcularCustoComTaxaCorreta = (registros: any[]) => {
      return registros.reduce((total, registro) => {
          const dataRegistro = new Date(registro.timestamp).toISOString().split('T')[0];

          //console.log(`Calculando custo para registro de ${registro.pessoa.nome} em ${dataRegistro}`);
          //console.log(`Taxas disponíveis:`, registro.pessoa.custos); //pode retornar mais de uma taxa, e dentro tem 'custo hora' e 'custo hora extra', além de 'fim vigência' e 'início vigência'
          
          //console.log(`Parâmetros de entrada:`, registro.pessoa.custos, dataRegistro, registro.hora_extra);
          const resultado = obterTaxaPorData(
              registro.pessoa.custos, //array com 'custoHora', 'custoHoraExtra', 'fimVigencia' e 'inicioVigencia'
              dataRegistro, // está no formato 'Tue Jun 03 2025 15:51:37 GMT-0300 (Horário Padrão de Brasília)', porque foi criado com new Date(registro.timestamp)
              registro.hora_extra
          );
          //console.log(`Resultado:`, resultado.valor);
          
          // Opcional: log para debug
          // console.log(`Registro ${registro.pessoa.nome} - ${dataRegistro.toISOString().split('T')[0]}: 
          //   Taxa R$ ${resultado.valor}/hora (${registro.hora_extra ? 'extra' : 'normal'})`);
          
          return total + (registro.duracao_minutos / 60) * resultado.valor;
      }, 0);
    };

    // Função para formatar moeda
  const formatCurrency = (value: number) => {
    return Number(value || 0).toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    });
  };

  // Função para formatar horas
  const formatHours = (value: number) => {
    return Number(value || 0).toFixed(2);
  };

  // Definir colunas para cada tipo de visualização
  const getColumns = () => {
    const baseColumns = [
      { 
        key: 'categoria', 
        name: viewType === 'obra' ? 'Obra' : 
              viewType === 'tipo' ? 'Tipo de Tarefa' : 'Pessoa',
        width: 250
      },
      { 
        key: 'total_horas', 
        name: 'Total Horas', 
        width: 120,
        formatter: ({ row }) => formatHours(row.total_horas)
      },
      { 
        key: 'custo_total', 
        name: 'Custo Total', 
        width: 130,
        formatter: ({ row }) => formatCurrency(row.custo_total)
      }
    ];

    switch (viewType) {
      case 'obra':
        return [
          ...baseColumns.slice(0, 1), // categoria
          { key: 'codigo', name: 'Código', width: 120 },
          ...baseColumns.slice(1), // total_horas e custo_total
          { 
            key: 'horas_normais', 
            name: 'Horas Normais', 
            width: 130,
            sortable: true,
            formatter: ({ row }) => formatHours(row.horas_normais)
          },
          { 
            key: 'horas_extras', 
            name: 'Horas Extras', 
            width: 130,
            sortable: true,
            formatter: ({ row }) => formatHours(row.horas_extras)
          },
          { 
            key: 'custo_normal', 
            name: 'Custo Normal', 
            width: 130,
            sortable: true,
            formatter: ({ row }) => formatCurrency(row.custo_normal)
          },
          { 
            key: 'custo_extra', 
            name: 'Custo Extra', 
            width: 130,
            sortable: true,
            formatter: ({ row }) => formatCurrency(row.custo_extra)
          },
          { 
            key: 'pessoas_envolvidas', 
            name: 'Pessoas', 
            width: 100,
            sortable: true,
            formatter: ({ row }) => (
              <span 
                title={row.nomes_pessoas?.join('\n• ') ? `• ${row.nomes_pessoas.join('\n• ')}` : ''} 
                style={{ 
                  cursor: 'help', 
                  textDecoration: 'underline dotted',
                  color: '#0066cc',
                  fontWeight: 'bold'
                }}
              >
                {row.pessoas_envolvidas}
              </span>
            )
          },
          { key: 'tipos_tarefa', name: 'Tipos Tarefa', width: 120 },
          { 
            key: 'custo_medio_hora', 
            name: 'Custo Médio/Hora', 
            width: 150,
            sortable: true,
            formatter: ({ row }) => formatCurrency(row.custo_medio_hora)
          }
        ];

      case 'tipo':
        return [
          ...baseColumns,
          { 
            key: 'horas_normais', 
            name: 'Horas Normais', 
            width: 130,
            sortable: true,
            formatter: ({ row }) => formatHours(row.horas_normais)
          },
          { 
            key: 'horas_extras', 
            name: 'Horas Extras', 
            width: 130,
            sortable: true,
            formatter: ({ row }) => formatHours(row.horas_extras)
          },
          { 
            key: 'custo_normal', 
            name: 'Custo Normal', 
            width: 130,
            sortable: true,
            formatter: ({ row }) => formatCurrency(row.custo_normal)
          },
          { 
            key: 'custo_extra', 
            name: 'Custo Extra', 
            width: 130,
            sortable: true,
            formatter: ({ row }) => formatCurrency(row.custo_extra)
          },
          { key: 'obras_relacionadas', name: 'Obras', width: 80 },
          { key: 'pessoas_envolvidas', name: 'Pessoas', width: 100 },
          { 
            key: 'custo_medio_hora', 
            name: 'Custo Médio/Hora', 
            width: 150,
            sortable: true,
            formatter: ({ row }) => formatCurrency(row.custo_medio_hora)
          }
        ];

      case 'pessoa':
        return [
          ...baseColumns,
          { 
            key: 'horas_normais', 
            name: 'Horas Normais', 
            width: 130,
            sortable: true,
            formatter: ({ row }) => formatHours(row.horas_normais)
          },
          { 
            key: 'horas_extras', 
            name: 'Horas Extras', 
            width: 130,
            sortable: true,
            formatter: ({ row }) => formatHours(row.horas_extras)
          },
          { 
            key: 'custo_normal', 
            name: 'Custo Normal', 
            width: 130,
            sortable: true,
            formatter: ({ row }) => formatCurrency(row.custo_normal)
          },
          { 
            key: 'custo_extra', 
            name: 'Custo Extra', 
            width: 130,
            sortable: true,
            formatter: ({ row }) => formatCurrency(row.custo_extra)
          },
          { 
            key: 'valor_hora_medio', 
            name: 'Valor/Hora Médio', 
            width: 150,
            sortable: true,
            formatter: ({ row }) => formatCurrency(row.valor_hora_medio)
          },
          { key: 'obras_envolvidas', name: 'Obras', width: 80 },
          { key: 'tipos_realizados', name: 'Tipos', width: 80 }
        ];

      default:
        return baseColumns;
    }
  };
  
    useEffect(() => {
      const processData = () => {
        switch (viewType) {
          case 'obra':
            return _.chain(registros)
              .groupBy('obra.nome_obra')
              .map((group, key) => {
                // Separar registros normais e extras
                const horasNormais = group.filter(r => !r.hora_extra);
                const horasExtras = group.filter(r => r.hora_extra);
                
                // Calcular horas
                const totalHorasNormais = _.sumBy(horasNormais, r => r.duracao_minutos / 60);
                const totalHorasExtras = _.sumBy(horasExtras, r => r.duracao_minutos / 60);
                
                // Calcular custos
                // const custoNormal = _.sumBy(horasNormais, r => 
                //   (r.duracao_minutos / 60) * r.pessoa.hourlyRate
                // );
                // const custoExtra = _.sumBy(horasExtras, r => 
                //   (r.duracao_minutos / 60) * (r.pessoa.overtimeRate || r.pessoa.hourlyRate)
                // );

                // Calcular custos considerando múltiplas taxas
                // const custoNormal = calcularCustoComMultiplasTaxas(horasNormais);
                // const custoExtra = calcularCustoComMultiplasTaxas(horasExtras);
                const custoNormal = calcularCustoComTaxaCorreta(horasNormais);
                const custoExtra = calcularCustoComTaxaCorreta(horasExtras);
                
                return {
                  categoria: key,
                  codigo: group[0].obra.cod_obra,
                  total_horas: totalHorasNormais + totalHorasExtras,
                  horas_normais: totalHorasNormais,
                  horas_extras: totalHorasExtras,
                  custo_total: custoNormal + custoExtra,
                  custo_normal: custoNormal,
                  custo_extra: custoExtra,
                  pessoas_envolvidas: _.uniqBy(group, 'pessoa.nome').length,
                  tipos_tarefa: _.uniqBy(group, 'tipoTarefa.nome_tipo').length,
                  // NOVO: Arrays com os nomes únicos (para os tooltips)
                  nomes_pessoas: _.uniq(_.map(group, 'pessoa.nome')),
                  nomes_tipos_tarefa: _.uniq(_.map(group, 'tipoTarefa.nome_tipo')),
                  //custo_medio_hora: _.meanBy(group, r => r.pessoa.hourlyRate)
                  
                  // Custo médio agora é mais complexo - pode ser a média ponderada por horas
                  custo_medio_hora: (custoNormal + custoExtra) / (totalHorasNormais + totalHorasExtras)
            };                
              })                          
              .orderBy(['nome_obra', 'custo_total'], ['asc', 'desc'])
              .value();
  
          // case 'tipo':
          //   return _.chain(registros)
          //     .groupBy('tipoTarefa.nome_tipo')
          //     .map((group, key) => {
          //       // Para tipo, cada registro pode ser de uma pessoa diferente
          //       const custoTotal = group.reduce((total, registro) => {
          //         const dataRegistro = new Date(registro.timestamp);
          //         const resultado = obterTaxaPorData(
          //           registro.pessoa.custos, // Cada registro tem seus próprios custos
          //           dataRegistro, 
          //           registro.hora_extra
          //         );
          //         return total + (registro.duracao_minutos / 60) * resultado.valor;
          //       }, 0);
          
          //       return {
          //         categoria: key,
          //         total_horas: _.sumBy(group, r => r.duracao_minutos / 60),
          //         custo_total: custoTotal,
          //         obras_relacionadas: _.uniqBy(group, 'obra.nome_obra').length,
          //         pessoas_envolvidas: _.uniqBy(group, 'pessoa.nome').length,
          //         nomes_pessoas: _.uniq(_.map(group, 'pessoa.nome')),
          //         nomes_obras: _.uniq(_.map(group, 'obra.nome_obra')),
          //         custo_medio_hora: custoTotal / _.sumBy(group, r => r.duracao_minutos / 60)
          //       };
          //     })
          //     .orderBy(['total_horas'], ['desc'])
          //     .value();
          case 'tipo':
            return _.chain(registros)
              .groupBy('tipoTarefa.nome_tipo')
              .map((group, key) => {
                // Separar registros normais e extras
                const horasNormais = group.filter(r => !r.hora_extra);
                const horasExtras = group.filter(r => r.hora_extra);
                
                // Calcular horas
                const totalHorasNormais = _.sumBy(horasNormais, r => r.duracao_minutos / 60);
                const totalHorasExtras = _.sumBy(horasExtras, r => r.duracao_minutos / 60);
                
                // Calcular custos usando a função padronizada
                const custoNormal = calcularCustoComTaxaCorreta(horasNormais);
                const custoExtra = calcularCustoComTaxaCorreta(horasExtras);
                
                return {
                  categoria: key,
                  total_horas: totalHorasNormais + totalHorasExtras,
                  horas_normais: totalHorasNormais,
                  horas_extras: totalHorasExtras,
                  custo_total: custoNormal + custoExtra,
                  custo_normal: custoNormal,
                  custo_extra: custoExtra,
                  obras_relacionadas: _.uniqBy(group, 'obra.nome_obra').length,
                  pessoas_envolvidas: _.uniqBy(group, 'pessoa.nome').length,
                  nomes_pessoas: _.uniq(_.map(group, 'pessoa.nome')),
                  nomes_obras: _.uniq(_.map(group, 'obra.nome_obra')),
                  custo_medio_hora: (custoNormal + custoExtra) / (totalHorasNormais + totalHorasExtras)
                };
              })
              .orderBy(['total_horas'], ['desc'])
              .value();
  
          // case 'pessoa':
          //   return _.chain(registros)
          //     .groupBy('pessoa.nome')
          //     .map((group, nomePessoa) => {
          //       // Todos os registros neste group são da mesma pessoa
          //       const custosPersona = group[0].pessoa.custos; // custos desta pessoa específica
                
          //       const custoTotal = group.reduce((total, registro) => {
          //         const dataRegistro = new Date(registro.timestamp);
          //         const taxa = obterTaxaPorData(custosPersona, dataRegistro, registro.hora_extra);
          //         console.log("++++Valor da taxa:", taxa);
          //         return total + (registro.duracao_minutos / 60) * taxa.valor;
          //       }, 0);
                
          //       return {
          //         categoria: nomePessoa,
          //         total_horas: _.sumBy(group, r => r.duracao_minutos / 60),
          //         custo_total: custoTotal,
          //         obras_envolvidas: _.uniqBy(group, 'obra.nome_obra').length,
          //         tipos_realizados: _.uniqBy(group, 'tipoTarefa.nome_tipo').length,
          //         // Valor/hora médio ponderado no período
          //         valor_hora_medio: custoTotal / _.sumBy(group, r => r.duracao_minutos / 60)
          //       };
          //     })
          //     .orderBy(['custo_total'], ['desc'])
          //     .value();
          case 'pessoa':
            return _.chain(registros)
              .groupBy('pessoa.nome')
              .map((group, nomePessoa) => {
                // Separar registros normais e extras
                const horasNormais = group.filter(r => !r.hora_extra);
                const horasExtras = group.filter(r => r.hora_extra);
                
                // Calcular horas
                const totalHorasNormais = _.sumBy(horasNormais, r => r.duracao_minutos / 60);
                const totalHorasExtras = _.sumBy(horasExtras, r => r.duracao_minutos / 60);
                
                // Calcular custos usando a função padronizada
                const custoNormal = calcularCustoComTaxaCorreta(horasNormais);
                const custoExtra = calcularCustoComTaxaCorreta(horasExtras);
                
                return {
                  categoria: nomePessoa,
                  total_horas: totalHorasNormais + totalHorasExtras,
                  horas_normais: totalHorasNormais,
                  horas_extras: totalHorasExtras,
                  custo_total: custoNormal + custoExtra,
                  custo_normal: custoNormal,
                  custo_extra: custoExtra,
                  obras_envolvidas: _.uniqBy(group, 'obra.nome_obra').length,
                  tipos_realizados: _.uniqBy(group, 'tipoTarefa.nome_tipo').length,
                  nomes_obras: _.uniq(_.map(group, 'obra.nome_obra')),
                  nomes_tipos: _.uniq(_.map(group, 'tipoTarefa.nome_tipo')),
                  // Valor/hora médio ponderado no período
                  valor_hora_medio: (custoNormal + custoExtra) / (totalHorasNormais + totalHorasExtras)
                };
              })
              .orderBy(['custo_total'], ['desc'])
              .value();
        }
      };
  
      setAggregatedData(processData());
    }, [registros, viewType]);  
    
  
    return (
    // <div className="p-4">
    <div className="w-full min-w-full px-2 ml-1">
    {/* // <div className="flex w-full max-w-screen overflow-hidden"> */}
        {/* // <div className="flex justify-between items-left mb-4"> */}
        <div className="flex justify-between items-center w-full mb-4 gap-4">
            <h2 className="text-2xl font-bold">Análise de Custos e Horas</h2>

            {/* // Adicionar no JSX antes dos botões*/}
            <div className="flex gap-4 mb-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Data Início:</label>
                    <input
                    type="date"
                    value={dateFilter.startDate}
                    onChange={(e) => setDateFilter(prev => ({...prev, startDate: e.target.value}))}
                    className="border rounded px-2 py-1"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Data Fim:</label>
                    <input
                    type="date"
                    value={dateFilter.endDate}
                    onChange={(e) => setDateFilter(prev => ({...prev, endDate: e.target.value}))}
                    className="border rounded px-2 py-1"
                    />
                </div>
                <div className="flex items-end">
                    <ButtonComponent 
                    cssClass="e-primary"
                    onClick={() => {
                        const params = new URLSearchParams();
                        params.set('startDate', new Date(dateFilter.startDate).toISOString());
                        params.set('endDate', new Date(dateFilter.endDate).toISOString());
                        navigate(`?${params.toString()}`);
                    }}
                    >
                    Filtrar
                    </ButtonComponent>
                </div>
            </div>

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
    <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded">
        <p className="text-sm text-blue-700">
            <strong>Período filtrado:</strong> {new Date(startDate).toLocaleDateString('pt-BR')} até {new Date(endDate).toLocaleDateString('pt-BR')}
        </p>
    </div>
    

    {/* React Data Grid */}
    <div className="mb-4" style={{ height: '600px' }}>
    <DataGrid            
        columns={getColumns()}
        rows={aggregatedData}
        rowKeyGetter={(row) => row.categoria}
        className="rdg-light"
        //defaultColumnOptions não funciona, precisa incluir as colunas com sortable e resizable
        // defaultColumnOptions={{
        //     sortable: true,
        //     resizable: true
        // }}
    />
    </div>

    </div>
    );
  }