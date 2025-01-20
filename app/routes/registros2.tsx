import { json } from "@remix-run/node";
import { prisma } from "~/db.server";
import { useLoaderData } from "@remix-run/react";
import _ from "lodash";
import {
  GridComponent,
  ColumnsDirective,
  ColumnDirective,
  Inject,
  Page,
  Toolbar,
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

export const loader = async () => {
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

  // Agrupando os dados para exibição mais clara
  const groupedData = _.groupBy(registros, "nome_obra");

  return json({ groupedData });
};

export default function ProjetoHoras() {
  const { groupedData } = useLoaderData();

  const chartData = Object.entries(groupedData).map(([obra, registros]) => {
    return {
      nome_obra: obra,
      horas_totais: _.sumBy(registros, "horas_trabalhadas") / 60, // Convertendo minutos para horas
    };
  });

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Visão de Lançamento de Horas</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tabela de Dados */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Detalhamento por Projeto</h2>
          <GridComponent dataSource={Object.values(groupedData)} allowPaging={true} toolbar={['Search']}>
            <ColumnsDirective>
              <ColumnDirective field="nome" headerText="Funcionário" width="150" />
              <ColumnDirective field="nome_obra" headerText="Projeto" width="150" />
              <ColumnDirective field="nome_tipo" headerText="Tipo de Tarefa" width="150" />
              <ColumnDirective field="horas_trabalhadas" headerText="Horas Trabalhadas" width="150" textAlign="Right" />
            </ColumnsDirective>
            <Inject services={[Page, Toolbar]} />
          </GridComponent>
        </div>

        {/* Gráfico */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Resumo de Horas por Projeto</h2>
          <ChartComponent primaryXAxis={{ valueType: "Category" }} legendSettings={{ visible: true }} tooltip={{ enable: true }}>
            <SeriesCollectionDirective>
              <SeriesDirective
                dataSource={chartData}
                xName="nome_obra"
                yName="horas_totais"
                name="Horas Trabalhadas"
                type="Column"
              />
            </SeriesCollectionDirective>
            <Inject services={[ColumnSeries, Category, Legend, Tooltip]} />
          </ChartComponent>
        </div>
      </div>
    </div>
  );
}
