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





export const loader = async () => {
  const registros = await prisma.$queryRaw`
    SELECT 
      o.nome_obra,
      o.cod_obra,
      t.nome_tipo,
      p.hourlyRate,
      p.nome,
      DATETIME (r.timestamp) AS data_hora,
      r.duracao_minutos AS horas_trabalhadas 
    FROM Registro r
    INNER JOIN Obra o ON r.id_obra = o.id_obra
    INNER JOIN TipoTarefa t ON r.id_tipo_tarefa = t.id_tipo_tarefa
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
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState("");
  const [obraSelecionada, setObraSelecionada] = useState("");

  const obrasDisponiveis = funcionarioSelecionado
    ? _.uniqBy(
        registros.filter((r) => r.nome === funcionarioSelecionado),
        "nome_obra"
      ).map((r) => r.nome_obra)
    : _.uniqBy(registros, "nome_obra").map((r) => r.nome_obra);
    
  // const dadosFiltrados = funcionarioSelecionado
  //   ? registros.filter((registro) => registro.nome === funcionarioSelecionado)
  //   : registros;
  const dadosFiltrados = registros.filter((registro) => {
    if (funcionarioSelecionado && registro.nome !== funcionarioSelecionado) return false;
    if (obraSelecionada && registro.nome_obra !== obraSelecionada) return false;
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
        horas: _.sumBy(registros, "horas_trabalhadas") / 60,
      }));
      
    const totalHoras = _.sumBy(data, "horas");
    
    return data.map(item => ({
      ...item,
      percentual: (item.horas / totalHoras) * 100,
    }));
  })();
  

  
//   const onChartLoad = (args: IAccLoadedEventArgs): void => {
//     document.getElementById('pie-chart').setAttribute('title', '');
// };
// const load = (args: IAccLoadedEventArgs): void => {
//     let selectedTheme: string = location.hash.split('/')[1];
//     selectedTheme = selectedTheme ? selectedTheme : 'Fluent2';
//     args.accumulation.theme = (selectedTheme.charAt(0).toUpperCase() + selectedTheme.slice(1)).replace(/-dark/i, "Dark").replace(/light/i, "Light").replace(/contrast/i,'Contrast').replace(/-highContrast/i, 'HighContrast') as AccumulationTheme;
// };



  const selectionSettings : SelectionSettingsModel= { mode: 'Row', type: 'Single' };

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
        value={obraSelecionada}
        onChange={(e) => setObraSelecionada(e.target.value)}
        className="w-full p-2 border rounded"
      >
        <option value="">Todas</option>
        {obrasDisponiveis.map((obra) => (
          <option key={obra} value={obra}>
            {obra}
          </option>
        ))}
      </select>
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

      </div>
    </div>
  );
}
