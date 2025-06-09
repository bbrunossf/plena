//inclusão da Categoria na consulta e nos graficos
// resolvidas as cores mas sem usar o colormapping
// dados somados e arredondados
//ref: <https://ej2.syncfusion.com/react/documentation/treemap/getting-started?cs-save-lang=1&cs-lang=ts>
//adicionado nome concatenado para o select. Alterado na variável obrasDisponiveis e no option do 'Selecionar Obra'

import { json } from "@remix-run/node";
import { prisma } from "~/db.server";
import { useLoaderData } from "@remix-run/react";
import { useState } from "react";
import _ from "lodash";
import {
  GridComponent,
  ColumnsDirective,
  ColumnDirective,
  Inject,
  Page,
  Toolbar,  
  SelectionSettingsModel,
  Selection,
  SelectionMode,
  Sort    
} from "@syncfusion/ej2-react-grids";
import {
  ChartComponent,
  SeriesCollectionDirective,
  SeriesDirective,
  ColumnSeries,
  Category,
  Legend,
  Tooltip,
} from "@syncfusion/ej2-react-charts";
import { PieSeries, AccumulationLegend, AccumulationTooltip,
    AccumulationChartComponent, AccumulationSeriesCollectionDirective, AccumulationSeriesDirective,
    IAccLoadedEventArgs, AccumulationTheme, AccumulationDataLabel
} from "@syncfusion/ej2-react-charts";
import { TreeMapComponent, LevelsDirective, LevelDirective, Inject, TreeMapTooltip } from '@syncfusion/ej2-react-treemap';

//importação do css para o TreeMapComponent. Nao resolveu
//import '@syncfusion/ej2-base/styles/material.css';
//import '@syncfusion/ej2-react-treemap/node_modules/@syncfusion/ej2-base/styles/material.css';



//troquei o DATETIME (r.timestamp) AS data_hora, pelo strftime para o formato brasileiro
//ver se o filtro do 'where' está funcionando. Sim, está funcionando
export const loader = async () => {
    const registros = await prisma.registro.findMany({                  
      select: {
        timestamp: true,
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

        categoria: {
          select: {
            nome_categoria: true,
          },
        },

        pessoa: {
          select: {
            nome: true,
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
          timestamp: "desc",
        },
        {
          tipoTarefa: {
            nome_tipo: "asc",
          },
        },
      ],      
    });

const registrosFormatados = registros.map(registro => {
  // Cria uma nova data ajustando o timezone para evitar mudança de dia
  const date = new Date(registro.timestamp);
  const adjustedDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  
  return {
    ...registro,      
    timestamp: adjustedDate
  };
}) ?? []
 

  const groupedData = _.groupBy(registros, "obra.nome_obra"); 
  const nomesFuncionarios = _.uniqBy(registros, "pessoa.nome").map((r) => r.pessoa.nome);

  return ({ registros: registrosFormatados, groupedData, nomesFuncionarios });
};



export default function ProjetoHoras() {    
  const { registros, groupedData, nomesFuncionarios } = useLoaderData();
  //console.log("Registros:", registros);
  
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState("");
  //const [obraSelecionada, setObraSelecionada] = useState("");
  const [obrasSelecionadas, setObrasSelecionadas] = useState<string[]>([]);

  // New state variables for date range filter
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  // Get default date range values (for initial values)
  const getDefaultDateRange = () => {
    if (registros && registros.length > 0) {
      const allDates = registros.map(r => new Date(r.timestamp));
      const minDate = new Date(Math.min(...allDates));      
      const maxDate = new Date(Math.max(...allDates));

      //console.log(minDate.toISOString().split('T')[0]);
      //console.log(maxDate.toISOString().split('T')[0]);
      
      return {
        min: minDate.toISOString().split('T')[0], // Format as YYYY-MM-DD //não precisa mais porque arrumei na query
        max: maxDate.toISOString().split('T')[0]
        // min: minDate.toDateString(),
        // max: maxDate.toDateString()
      };
    }
    
    return { min: "", max: "" };
  };

  // Get date range for input fields' min/max properties
  const dateRange = getDefaultDateRange();


  


  const obrasDisponiveis = funcionarioSelecionado
  ? _.uniqBy(
      registros.filter((r) => r.pessoa.nome === funcionarioSelecionado),
      "obra.nome_obra"
    ).map((r) => ({ // Modificado para retornar um objeto com cod_obra e nome_obra
      cod_obra: r.obra.cod_obra,
      nome_obra: r.obra.nome_obra,
      nome_concatenado: `${r.obra.cod_obra} - ${r.obra.nome_obra}`
    })).sort((a, b) => a.nome_concatenado.localeCompare(b.nome_concatenado)) // Ordena pelo nome concatenado
  : _.uniqBy(registros, "obra.nome_obra").map((r) => ({ // Modificado para retornar um objeto com cod_obra e nome_obra
      cod_obra: r.obra.cod_obra,
      nome_obra: r.obra.nome_obra,
      nome_concatenado: `${r.obra.cod_obra} - ${r.obra.nome_obra}`
    })).sort((a, b) =>  a.nome_concatenado.localeCompare(b.nome_concatenado)); // Ordena pelo nome concatenado
    
  
  // 2. Modifique a parte do filtro por data no método filter
  const dadosFiltrados = registros.filter((registro) => {
  // Check employee filter
  if (funcionarioSelecionado && registro.pessoa.nome !== funcionarioSelecionado) return false;
  
  // Check project filter
  if (obrasSelecionadas.length > 0 && !obrasSelecionadas.includes(registro.obra.nome_obra)) return false;
  
  // Check date range filter
  if (dataInicio) {
    const registroDate = new Date(registro.timestamp);
    
    // Cria a data de início considerando o fuso horário local
    const [yearStart, monthStart, dayStart] = dataInicio.split('-');
    const startDate = new Date(yearStart, monthStart - 1, dayStart);
    startDate.setHours(0, 0, 0, 0);
    
    if (registroDate < startDate) return false;
  }
  
  if (dataFim) {
    const registroDate = new Date(registro.timestamp);
    
    // Cria a data final considerando o fuso horário local
    const [yearEnd, monthEnd, dayEnd] = dataFim.split('-');
    const endDate = new Date(yearEnd, monthEnd - 1, dayEnd);
    endDate.setHours(23, 59, 59, 999);
    
    if (registroDate > endDate) return false;
  }
  
  return true;
});
  

  const totalObras = _.uniqBy(dadosFiltrados, "obra.nome_obra").length;
  const projetoMaisTrabalhado = _.maxBy(
    Object.entries(_.groupBy(dadosFiltrados, "obra.nome_obra")).map(([obra, registros]) => ({
      obra,
      horas_totais: _.sumBy(registros, "duracao_minutos") / 60,
    })),
    "horas_totais"
  );
  const tipoMaisExecutado = _.maxBy(
    _.map(
      _.groupBy(dadosFiltrados, "tipoTarefa.nome_tipo"),
      (tarefas, tipo) => ({ tipo, count: tarefas.length })
    ),
    "count"
  );
  

  const obrasData = Object.entries(_.groupBy(dadosFiltrados, "obra.nome_obra")).map(([obra, registros]) => ({
    nome_obra: obra,
    horas_totais: _.sumBy(registros, "duracao_minutos") / 60,
  }));
  
  const totalGeralData = [
    {
      nome_obra: "Total Geral",
      horas_totais: _.sumBy(dadosFiltrados, "duracao_minutos") / 60,
    },
  ];

  const tipoTarefaData = (() => {
    const data = Object.entries(_.groupBy(dadosFiltrados, "tipoTarefa.nome_tipo"))
      .map(([tipo, registros]) => ({
        tipo,
        horas: _.round((_.sumBy(registros, "duracao_minutos") / 60), 2),
      }));
      
    const totalHoras = _.sumBy(data, "horas");
    
    return data.map(item => ({
      ...item,
      percentual: (item.horas / totalHoras) * 100,
    }));
  })();
  
  
  const treeMapData = Object.entries(_.groupBy(dadosFiltrados, "categoria.nome_categoria"))
  .map(([categoria, registros]) => ({
    categoria,
    valor: _.round((_.sumBy(registros, "duracao_minutos") / 60), 2), // Soma das horas por categoria
  }));


  const selectionSettings : SelectionSettingsModel= { mode: 'Row', type: 'Single' };


  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    
    // Use o split para pegar apenas a parte da data (YYYY-MM-DD)
    // e construa uma data no fuso horário local
    const [year, month, day] = dateString.split('-');
    
    // Cria a data usando componentes específicos (ano, mês-1, dia)
    // para evitar problemas de fuso horário
    const date = new Date(year, month - 1, day);
    
    // Formata a data para exibição conforme o local
    return date.toLocaleDateString();
  };

  // Reset filters function
  const resetFilters = () => {
    setFuncionarioSelecionado("");
    setObrasSelecionadas([]);
    setDataInicio("");
    setDataFim("");
  };

  // Format for the GridComponent
  //HH = 24 hours, hh = 12 hours
  const shipFormat: object = { type: 'dateTime', format: 'dd/MM/yyyy HH:mm:ss' }; //não precisa mais porque arrumei na query


  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Sua Produção</h1>

      <div className="mb-4">
        <label htmlFor="funcionario" className="block text-lg font-semibold mb-2">
          Selecionar Funcionário
        </label>
        <select
          id="funcionario"
          value={funcionarioSelecionado}
          onChange={(e) => setFuncionarioSelecionado(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="">Todos</option>
          {nomesFuncionarios.map((nome) => (
            <option key={nome} value={nome}>
              {nome}
            </option>
          ))}
        </select>
      </div>

    <div className="mb-4">
      <label htmlFor="obra" className="block text-lg font-semibold mb-2">
        Selecionar Obra
      </label>
      <select
        id="obra"
        multiple
        value={obrasSelecionadas}
        onChange={(e) => {
          const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
          setObrasSelecionadas(selectedOptions);
        }}
        className="w-full p-2 border rounded"
      >
        <option value="">Todas</option>
        {/* {obrasDisponiveis.map((obra) => (
          <option key={obra} value={obra}>
            {obra}
          </option>
        ))} */}
        {obrasDisponiveis.map((obra) => (
        <option key={obra.nome_obra} value={obra.nome_obra}> {/* Usando nome_obra como value */}
        {obra.nome_concatenado} {/* Exibindo o nome concatenado */}
    </option>
  ))}
      </select>

    </div>

    {/* Bloco para o filtro de datas */}
    <div>
          <label className="block text-lg font-semibold mb-2">
            Intervalo de Datas
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="dataInicio" className="block text-sm mb-1">De:</label>
              <input
                type="date"
                id="dataInicio"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                min={dateRange.min}
                max={dateRange.max}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label htmlFor="dataFim" className="block text-sm mb-1">Até:</label>
              <input
                type="date"
                id="dataFim"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                min={dataInicio || dateRange.min}
                max={dateRange.max}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
        </div>
      

      {/* Filtros aplicados e botão para limpar */}
      <div className="mb-4 flex justify-between items-center">
        <div>
          <span className="font-semibold">Filtros Aplicados:</span> 
          {funcionarioSelecionado && <span className="ml-2 bg-blue-100 px-2 py-1 rounded">{funcionarioSelecionado}</span>}
          {obrasSelecionadas.length > 0 && <span className="ml-2 bg-green-100 px-2 py-1 rounded">{obrasSelecionadas.join(", ")}</span>}
          {dataInicio && <span className="ml-2 bg-yellow-100 px-2 py-1 rounded">De: {formatDateForDisplay(dataInicio)}</span>}
          {dataFim && <span className="ml-2 bg-yellow-100 px-2 py-1 rounded">Até: {formatDateForDisplay(dataFim)}</span>}
          {!funcionarioSelecionado && obrasSelecionadas.length === 0 && !dataInicio && !dataFim && 
            <span className="ml-2 text-gray-500">Nenhum</span>}
        </div>
        <button 
          onClick={resetFilters}
          className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded"
        >
          Limpar Filtros
        </button>
      </div>

      {/* Métricas principais */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-100 p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Projetos Trabalhados</h2>
          <p className="text-2xl font-bold">{totalObras}</p>
        </div>
        <div className="bg-green-100 p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Projeto com Mais Horas</h2>
          <p className="text-xl font-bold">{projetoMaisTrabalhado?.obra || "N/A"}</p>
          <p>{projetoMaisTrabalhado?.horas_totais?.toFixed(2) || 0} horas</p>
        </div>
        <div className="bg-yellow-100 p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Tarefa Mais Executada</h2>
          <p className="text-xl font-bold">{tipoMaisExecutado?.tipo || "N/A"}</p>
          <p>{tipoMaisExecutado?.count || 0} registros</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tabela de Dados */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Detalhamento por Projeto</h2>
          <GridComponent           
          dataSource={dadosFiltrados} 
          selectionSettings={selectionSettings}  
          allowPaging={true}     
          allowSorting={true}          
          >
            <ColumnsDirective>
              {/* <ColumnDirective field="nome" headerText="Funcionário" width="150" /> */}
              <ColumnDirective field="timestamp" headerText="Data" width="180" format={shipFormat} type="date"/>
              <ColumnDirective field="obra.cod_obra" headerText="Obra" width="80" />
              <ColumnDirective field="obra.nome_obra" headerText="Projeto" width="180" />
              <ColumnDirective field="tipoTarefa.nome_tipo" headerText="Tipo de Tarefa" width="200" />
              <ColumnDirective field="hora_extra" headerText="Hora Extra" width="50" />
              {/* <ColumnDirective field="horas_trabalhadas" headerText="Horas Trabalhadas" width="150" textAlign="Right" /> */}
            </ColumnsDirective>
            <Inject services={[Page, Toolbar, Selection, Sort]} />
          </GridComponent>
        </div>

        {/* Gráfico1 */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Resumo de Horas por Projeto</h2>
          <ChartComponent 
          primaryXAxis={{ valueType: "Category" }}
          primaryYAxis={{ title: "Horas Trabalhadas" }}
          axes={[
            {
              name: "secondaryAxis",
              opposedPosition: true, // Coloca o eixo no lado direito
              title: "Total Geral",
              labelFormat: "{value} h",
            },
          ]}
          legendSettings={{ visible: true }}
          tooltip={{ enable: true }}
          >
            <SeriesCollectionDirective>
            {/* Série para as obras */}
            <SeriesDirective
              dataSource={obrasData}
              xName="nome_obra"
              yName="horas_totais"
              name="Horas Trabalhadas"
              type="Column"
            />
            {/* Série para o Total Geral */}
            <SeriesDirective
              dataSource={totalGeralData}
              xName="nome_obra"
              yName="horas_totais"
              name="Total Geral"
              type="Column"
              yAxisName="secondaryAxis" // Eixo secundário
              fill="blue" // Cor da barra
            />
          </SeriesCollectionDirective>
            <Inject services={[ColumnSeries, Category, Legend, Tooltip]} />
          </ChartComponent>
        </div>

        {/* Gráfico2 */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Distribuição por Tipo de Tarefa</h2>
          
          <AccumulationChartComponent 
            id='pie-chart' 
            title='Distribuição de Horas no projeto selecionado'             
            legendSettings={{ visible: true }} 
            enableSmartLabels={true} 
            enableAnimation={true} 
            center={{ x: '50%', y: '50%' }} 
            enableBorderOnMouseMove={true} 
            tooltip={{ enable: true,                 
                  enableHighlight: false}}            
          >
            <Inject services={[AccumulationLegend, PieSeries, AccumulationTooltip, AccumulationDataLabel]} />
            
            <AccumulationSeriesCollectionDirective>            
            <AccumulationSeriesDirective 
              dataSource={tipoTarefaData}
              xName="tipo"
              yName="horas"
              type="Pie"
              dataLabel={{
                visible: true,
                name: 'text',
                position: 'Outside',
                template: '${point.x}: ${point.y}h (${point.percentual}%)',
                font: { fontWeight: '600' },
                connectorStyle:{ length : '20px' ,type: 'Curve'}
              }}              
              />
            </AccumulationSeriesCollectionDirective>
          </AccumulationChartComponent>
        </div>
		
		<div>
		<TreeMapComponent
        dataSource={treeMapData}
        weightValuePath='valor'
		    equalColorValuePath='categoria'
		    //palette= {['red','green', 'blue', 'orange', 'white']} //assim deu certo; com colormapping fica tudo preto
        leafItemSettings={{
          labelPath: 'categoria',
		      colorMapping: [
          {value: 'Conferência',  color: '#D3D3B3'},
          {value: 'Execução',     color: '#A9A9F9'},
		      {value: 'Orçamento',    color: '#8080C0'},
		      {value: 'Planejamento', color: '#B34D6D'},
		      {value: 'Revisão',      color: '#B34D31'},		  
        ],		
				  
        }}
		
		tooltipSettings={{
          visible: true,
          format: '${categoria}: ${valor} horas'
        }}
      >
	  {/*
        <LevelsDirective>
          <LevelDirective groupPath='categorias' headerTemplate='${categoria}' />
        </LevelsDirective>
		*/}
        <Inject services={[TreeMapTooltip]} />
      </TreeMapComponent>
		</div>
		
		

      </div>
    </div>
  );
}
