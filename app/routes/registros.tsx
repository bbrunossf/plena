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
  SelectionMode    
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




export const loader = async () => {
  const registros = await prisma.$queryRaw`
    SELECT 
      o.nome_obra,
      o.cod_obra,
      t.nome_tipo,
	  cat.nome_categoria,
      p.hourlyRate,
      p.nome,
      DATETIME (r.timestamp) AS data_hora,
      r.duracao_minutos AS horas_trabalhadas 
    FROM Registro r
    INNER JOIN Obra o ON r.id_obra = o.id_obra
    INNER JOIN TipoTarefa t ON r.id_tipo_tarefa = t.id_tipo_tarefa
	INNER JOIN Categoria cat ON r.id_categoria = cat.id_categoria
    INNER JOIN Pessoa p ON r.id_nome = p.id_nome
    WHERE r."timestamp" > "2025-01-01"   
    ORDER BY r.timestamp DESC, t.nome_tipo
  `;


 

  const groupedData = _.groupBy(registros, "nome_obra"); 
  const nomesFuncionarios = _.uniqBy(registros, "nome").map((r) => r.nome);

  return json({ registros, groupedData, nomesFuncionarios });
};



export default function ProjetoHoras() {    
  const { registros, groupedData, nomesFuncionarios } = useLoaderData();
  //const { registros2 } = useLoaderData();
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState("");
  //const [obraSelecionada, setObraSelecionada] = useState("");
  const [obrasSelecionadas, setObrasSelecionadas] = useState<string[]>([]);

  // New state variables for date range filter
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  // Get default date range values (for initial values)
  const getDefaultDateRange = () => {
    if (registros && registros.length > 0) {
      const allDates = registros.map(r => new Date(r.data_hora));
      const minDate = new Date(Math.min(...allDates));
      const maxDate = new Date(Math.max(...allDates));
      
      return {
        min: minDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
        max: maxDate.toISOString().split('T')[0]
      };
    }
    
    return { min: "", max: "" };
  };

  // Get date range for input fields' min/max properties
  const dateRange = getDefaultDateRange();


  

  // const obrasDisponiveis = funcionarioSelecionado
  //   ? _.uniqBy(
  //       registros.filter((r) => r.nome === funcionarioSelecionado),
  //       "nome_obra"
  //     ).map((r) => r.nome_obra).sort()
  //   : _.uniqBy(registros, "nome_obra").map((r) => r.nome_obra).sort();

  const obrasDisponiveis = funcionarioSelecionado
  ? _.uniqBy(
      registros.filter((r) => r.nome === funcionarioSelecionado),
      "nome_obra"
    ).map((r) => ({ // Modificado para retornar um objeto com cod_obra e nome_obra
      cod_obra: r.cod_obra,
      nome_obra: r.nome_obra,
      nome_concatenado: `${r.cod_obra} - ${r.nome_obra}`
    })).sort((a, b) => a.nome_concatenado.localeCompare(b.nome_concatenado)) // Ordena pelo nome concatenado
  : _.uniqBy(registros, "nome_obra").map((r) => ({ // Modificado para retornar um objeto com cod_obra e nome_obra
      cod_obra: r.cod_obra,
      nome_obra: r.nome_obra,
      nome_concatenado: `${r.cod_obra} - ${r.nome_obra}`
    })).sort((a, b) =>  a.nome_concatenado.localeCompare(b.nome_concatenado)); // Ordena pelo nome concatenado
    
  // const dadosFiltrados = funcionarioSelecionado
  //   ? registros.filter((registro) => registro.nome === funcionarioSelecionado)
  //   : registros;
  // const dadosFiltrados = registros.filter((registro) => {
  //   if (funcionarioSelecionado && registro.nome !== funcionarioSelecionado) return false;
  //   if (obraSelecionada && registro.nome_obra !== obraSelecionada) return false;
  //   return true;
  // });

  // const dadosFiltrados = registros.filter((registro) => {
  //   if (funcionarioSelecionado && registro.nome !== funcionarioSelecionado) return false;
  //   if (obrasSelecionadas.length > 0 && !obrasSelecionadas.includes(registro.nome_obra)) return false;
  //   return true;
  // });
  
  // Updated filter to include date range
  // const dadosFiltrados = registros.filter((registro) => {
  //   // Check employee filter
  //   if (funcionarioSelecionado && registro.nome !== funcionarioSelecionado) return false;
    
  //   // Check project filter
  //   if (obrasSelecionadas.length > 0 && !obrasSelecionadas.includes(registro.nome_obra)) return false;
    
  //   // Check date range filter
  //   if (dataInicio) {
  //     const registroDate = new Date(registro.data_hora);
  //     const startDate = new Date(dataInicio);
  //     // Set time to beginning of day for comparison
  //     startDate.setHours(0, 0, 0, 0);
  //     if (registroDate < startDate) return false;
  //   }
    
  //   if (dataFim) {
  //     const registroDate = new Date(registro.data_hora);
  //     const endDate = new Date(dataFim);
  //     // Set time to end of day for comparison
  //     endDate.setHours(23, 59, 59, 999);
  //     if (registroDate > endDate) return false;
  //   }
    
  //   return true;
  // });
  // 2. Modifique a parte do filtro por data no método filter
const dadosFiltrados = registros.filter((registro) => {
  // Check employee filter
  if (funcionarioSelecionado && registro.nome !== funcionarioSelecionado) return false;
  
  // Check project filter
  if (obrasSelecionadas.length > 0 && !obrasSelecionadas.includes(registro.nome_obra)) return false;
  
  // Check date range filter
  if (dataInicio) {
    const registroDate = new Date(registro.data_hora);
    
    // Cria a data de início considerando o fuso horário local
    const [yearStart, monthStart, dayStart] = dataInicio.split('-');
    const startDate = new Date(yearStart, monthStart - 1, dayStart);
    startDate.setHours(0, 0, 0, 0);
    
    if (registroDate < startDate) return false;
  }
  
  if (dataFim) {
    const registroDate = new Date(registro.data_hora);
    
    // Cria a data final considerando o fuso horário local
    const [yearEnd, monthEnd, dayEnd] = dataFim.split('-');
    const endDate = new Date(yearEnd, monthEnd - 1, dayEnd);
    endDate.setHours(23, 59, 59, 999);
    
    if (registroDate > endDate) return false;
  }
  
  return true;
});
  

  const totalObras = _.uniqBy(dadosFiltrados, "nome_obra").length;
  const projetoMaisTrabalhado = _.maxBy(
    Object.entries(_.groupBy(dadosFiltrados, "nome_obra")).map(([obra, registros]) => ({
      obra,
      horas_totais: _.sumBy(registros, "horas_trabalhadas") / 60,
    })),
    "horas_totais"
  );
  const tipoMaisExecutado = _.maxBy(
    _.map(
      _.groupBy(dadosFiltrados, "nome_tipo"),
      (tarefas, tipo) => ({ tipo, count: tarefas.length })
    ),
    "count"
  );

  // const chartData = Object.entries(_.groupBy(dadosFiltrados, "nome_obra")).map(([obra, registros]) => ({
  //   nome_obra: obra,
  //   horas_totais: _.sumBy(registros, "horas_trabalhadas") / 60,      
  // }));

  const obrasData = Object.entries(_.groupBy(dadosFiltrados, "nome_obra")).map(([obra, registros]) => ({
    nome_obra: obra,
    horas_totais: _.sumBy(registros, "horas_trabalhadas") / 60,
  }));
  
  const totalGeralData = [
    {
      nome_obra: "Total Geral",
      horas_totais: _.sumBy(dadosFiltrados, "horas_trabalhadas") / 60,
    },
  ];

  const tipoTarefaData = (() => {
    const data = Object.entries(_.groupBy(dadosFiltrados, "nome_tipo"))
      .map(([tipo, registros]) => ({
        tipo,
        horas: _.round((_.sumBy(registros, "horas_trabalhadas") / 60), 2),
      }));
      
    const totalHoras = _.sumBy(data, "horas");
    
    return data.map(item => ({
      ...item,
      percentual: (item.horas / totalHoras) * 100,
    }));
  })();
  
// Mapear os dados para o formato esperado pelo TreeMap, mas sem somar os valores
  // const treeMapData = dadosFiltrados.map((registro) => ({
    // categoria: registro.nome_categoria,
    // valor: registro.horas_trabalhadas,
  // }));
  // console.log(treeMapData)
  
  const treeMapData = Object.entries(_.groupBy(dadosFiltrados, "nome_categoria"))
  .map(([categoria, registros]) => ({
    categoria,
    valor: _.round((_.sumBy(registros, "horas_trabalhadas") / 60), 2), // Soma das horas por categoria
  }));
  //console.log(treeMapData)
  
//   const onChartLoad = (args: IAccLoadedEventArgs): void => {
//     document.getElementById('pie-chart').setAttribute('title', '');
// };
// const load = (args: IAccLoadedEventArgs): void => {
//     let selectedTheme: string = location.hash.split('/')[1];
//     selectedTheme = selectedTheme ? selectedTheme : 'Fluent2';
//     args.accumulation.theme = (selectedTheme.charAt(0).toUpperCase() + selectedTheme.slice(1)).replace(/-dark/i, "Dark").replace(/light/i, "Light").replace(/contrast/i,'Contrast').replace(/-highContrast/i, 'HighContrast') as AccumulationTheme;
// };



  const selectionSettings : SelectionSettingsModel= { mode: 'Row', type: 'Single' };

  // Helper function to format date for display
  // const formatDateForDisplay = (dateString) => {
  //   if (!dateString) return '';
  //   const date = new Date(dateString);
  //   return date.toLocaleDateString();
  // };
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
          >
            <ColumnsDirective>
              {/* <ColumnDirective field="nome" headerText="Funcionário" width="150" /> */}
              <ColumnDirective field="data_hora" headerText="Data" width="180" />
              <ColumnDirective field="cod_obra" headerText="Obra" width="80" />
              <ColumnDirective field="nome_obra" headerText="Projeto" width="180" />
              <ColumnDirective field="nome_tipo" headerText="Tipo de Tarefa" width="250" />
              {/* <ColumnDirective field="horas_trabalhadas" headerText="Horas Trabalhadas" width="150" textAlign="Right" /> */}
            </ColumnsDirective>
            <Inject services={[Page, Toolbar, Selection]} />
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
          {            value: 'Conferência',            color: '#D3D3B3'          },
          {            value: 'Execução',            color: '#A9A9F9'          },
		  {            value: 'Orçamento',            color: '#8080C0'          },
		  {            value: 'Planejamento',            color: '#B34D6D'          },
		  {            value: 'Revisão',            color: '#B34D31'          },		  
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
