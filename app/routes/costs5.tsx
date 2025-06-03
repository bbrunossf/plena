//precisa arrumar, agora que as colunas de custos sairam da tabela pessoa e foram para a tabela custoHora

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
  
    return { registros, startDate, endDate };
  };
    

export default function Costs() {
    const { registros } = useLoaderData<typeof loader>();    
    //console.log("+++++ exemplo de registro", registros[0]);
    //console.log("+++++ exemplo de registro de custo:", registros[0].pessoa.custos);
    const [viewType, setViewType] = useState<'obra' | 'tipo' | 'pessoa'>('obra');
    const [aggregatedData, setAggregatedData] = useState<any[]>([]);
    
    const [dateFilter, setDateFilter] = useState({
      startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // 1º de Janeiro do ano atual
      endDate: new Date().toISOString().split('T')[0] // Hoje
    });

    // Função para obter a taxa de uma pessoa em uma data específica
    // const obterTaxaPorData = (custos: any[], data: Date, isHoraExtra: boolean = false) => {
    //   const taxaValida = custos.find(custo => {
    //     const inicio = new Date(custo.inicioVigencia);
    //     const fim = custo.fimVigencia ? new Date(custo.fimVigencia) : new Date('9999-12-31');
    //     return data >= inicio && data <= fim;
    //   });
      
    //   if (!taxaValida) {
    //     console.warn(`Taxa não encontrada para a data ${data.toISOString()}`);
    //     return 0;
    //   }
      
    //   return isHoraExtra ? parseFloat(taxaValida.custoHoraExtra) : parseFloat(taxaValida.custoHora);
    // };
    // Função corrigida para obter a taxa de uma pessoa em uma data específica
    // Função corrigida para obter a taxa de uma pessoa em uma data específica
    const obterTaxaPorData = (custosPersona: any[], dataRegistro: string, isHoraExtra: boolean = false) => {

      //custosPersona vem com o array de custos da pessoa: [{custoHora: 10, custoHoraExtra: 15, inicioVigencia: '2023-01-01', fimVigencia: '2023-12-31'},...]



      //recebe a data do registro como string e faz a operação com Date
      //const dataRegistroString = dataRegistro.toISOString().split('T')[0];
      //const dataRegistroString = dataRegistro;
      const dataDateRegistro = new Date(dataRegistro);
      
      // Encontrar a taxa válida para a data (ordenada por inicioVigencia desc)
      const taxaValida = custosPersona.find(custo => {
          //const inicioString = new Date(custo.inicioVigencia).toISOString().split('T')[0];
          const inicioDate = new Date(custo.inicioVigencia);
          const fimString = custo.fimVigencia
            ? new Date(custo.fimVigencia)
            : '9999-12-31'; 
          console.log("+++++ dataRegistro:", dataDateRegistro);
          console.log("+++++ inicioDate:", inicioDate);
          console.log("+++++ fimString:", fimString);
          console.log("+++++ dataDateRegistro >= inicioDate ?:", dataDateRegistro >= inicioDate);
          return dataDateRegistro >= inicioDate; // && dataDateRegistro <= fimString; //ok, retorna true ou false
      });

      if (!taxaValida) {
          console.warn(`Taxa não encontrada para a pessoa na data ${dataDateRegistro.toISOString()}`);
          return { valor: 0, taxaInfo: null };
      }

      const valor = isHoraExtra ? (taxaValida.custoHoraExtra) : (taxaValida.custoHora);
      console.log("+++++ valor", valor);
      
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

    // Função para calcular custo considerando múltiplas taxas
  //   const calcularCustoComMultiplasTaxas = (registros: any[]) => {
  //     return registros.reduce((total, registro) => {
  //         const dataRegistro = new Date(registro.timestamp);
          
  //         const taxa = obterTaxaPorData(
  //             registro.pessoa.custos, 
  //             dataRegistro, 
  //             registro.hora_extra
  //         );
          
  //         return total + (registro.duracao_minutos / 60) * taxa;
  //     }, 0);
  // };

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
  
          case 'tipo':
            return _.chain(registros)
              .groupBy('tipoTarefa.nome_tipo')
              .map((group, key) => {
                // Para tipo, cada registro pode ser de uma pessoa diferente
                const custoTotal = group.reduce((total, registro) => {
                  const dataRegistro = new Date(registro.timestamp);
                  const resultado = obterTaxaPorData(
                    registro.pessoa.custos, // Cada registro tem seus próprios custos
                    dataRegistro, 
                    registro.hora_extra
                  );
                  return total + (registro.duracao_minutos / 60) * resultado.valor;
                }, 0);
          
                return {
                  categoria: key,
                  total_horas: _.sumBy(group, r => r.duracao_minutos / 60),
                  custo_total: custoTotal,
                  obras_relacionadas: _.uniqBy(group, 'obra.nome_obra').length,
                  pessoas_envolvidas: _.uniqBy(group, 'pessoa.nome').length,
                  nomes_pessoas: _.uniq(_.map(group, 'pessoa.nome')),
                  nomes_obras: _.uniq(_.map(group, 'obra.nome_obra')),
                  custo_medio_hora: custoTotal / _.sumBy(group, r => r.duracao_minutos / 60)
                };
              })
              .orderBy(['total_horas'], ['desc'])
              .value();
  
          case 'pessoa':
            return _.chain(registros)
              .groupBy('pessoa.nome')
              .map((group, nomePessoa) => {
                // Todos os registros neste group são da mesma pessoa
                const custosPersona = group[0].pessoa.custos; // custos desta pessoa específica
                
                const custoTotal = group.reduce((total, registro) => {
                  const dataRegistro = new Date(registro.timestamp);
                  const taxa = obterTaxaPorData(custosPersona, dataRegistro, registro.hora_extra);
                  console.log("++++Valor da taxa:", taxa);
                  return total + (registro.duracao_minutos / 60) * taxa.valor;
                }, 0);
                
                return {
                  categoria: nomePessoa,
                  total_horas: _.sumBy(group, r => r.duracao_minutos / 60),
                  custo_total: custoTotal,
                  obras_envolvidas: _.uniqBy(group, 'obra.nome_obra').length,
                  tipos_realizados: _.uniqBy(group, 'tipoTarefa.nome_tipo').length,
                  // Valor/hora médio ponderado no período
                  valor_hora_medio: custoTotal / _.sumBy(group, r => r.duracao_minutos / 60)
                };
              })
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
        obra: ['Código', 'Horas Normais', 'Horas Extras', 'Custo Normal', 'Custo Extra', 'Pessoas Envolvidas', 'Tipos de Tarefa', 'Custo Médio/Hora'],
        tipo: ['Obras Relacionadas', 'Pessoas Envolvidas', 'Custo Médio/Hora'],
        pessoa: ['Valor/Hora', 'Obras Envolvidas', 'Tipos Realizados']
      };
  
      return [...commonHeaders, ...specificHeaders[viewType]];
    };
  
    const renderTableCell = (item: any, header: string) => {
      switch (header) {
        case 'Total Horas':
        case 'Horas Normais':
        case 'Horas Extras':
          const hours = header === 'Total Horas' ? item.total_horas :
                      header === 'Horas Normais' ? item.horas_normais :
                      item.horas_extras;
          return Number(hours || 0).toFixed(2);
          
        case 'Custo Total':
        case 'Custo Normal': 
        case 'Custo Extra':
        case 'Valor/Hora':
        case 'Custo Médio/Hora':
          const value = header === 'Custo Total' ? item.custo_total :
                      header === 'Custo Normal' ? item.custo_normal :
                      header === 'Custo Extra' ? item.custo_extra :
                      header === 'Valor/Hora' ? item.valor_hora : 
                      item.custo_medio_hora;
          return Number(value || 0).toLocaleString('pt-BR', { 
            style: 'currency', 
            currency: 'BRL' 
          });
        // Mapeamento específico para cada campo
        case 'Código':
          return item.codigo;
        case 'Pessoas Envolvidas':
          //return item.pessoas_envolvidas;
          // Opção C: Mostrar quantidade + tooltip com nomes
          return (
            <span 
              title={item.nomes_pessoas?.join('\n• ') ? `• ${item.nomes_pessoas.join('\n• ')}` : ''} 
              className="tooltip-cell"
              style={{ 
                cursor: 'help', 
                textDecoration: 'underline dotted',
                color: '#0066cc',
                fontWeight: 'bold'
              }}
            >
              {item.pessoas_envolvidas}
            </span>
          );
        case 'Tipos de Tarefa':
          return item.tipos_tarefa;
        case 'Obras Relacionadas':
          return item.obras_relacionadas;
        case 'Tipos Realizados':
          return item.tipos_realizados;
        case 'Obras Envolvidas':
          return item.obras_envolvidas;
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
                  params.set('startDate', dateFilter.startDate);
                  params.set('endDate', dateFilter.endDate);
                  window.location.search = params.toString();
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