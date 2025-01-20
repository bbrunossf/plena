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

  const groupedData = _.groupBy(registros, "nome_obra");

  const totalObras = _.uniqBy(registros, "nome_obra").length;
  const projetoMaisTrabalhado = _.maxBy(
    Object.entries(groupedData).map(([obra, registros]) => ({
      obra,
      horas_totais: _.sumBy(registros, "horas_trabalhadas") / 60,
    })),
    "horas_totais"
  );
  const tipoMaisExecutado = _.maxBy(
    _.map(
      _.groupBy(registros, "nome_tipo"),
      (tarefas, tipo) => ({ tipo, count: tarefas.length })
    ),
    "count"
  );

  return json({ groupedData, totalObras, projetoMaisTrabalhado, tipoMaisExecutado });
};

export default function ProjetoHoras() {
  const { groupedData, totalObras, projetoMaisTrabalhado, tipoMaisExecutado } = useLoaderData();

  const chartData = Object.entries(groupedData).map(([obra, registros]) => {
    return {
      nome_obra: obra,
      horas_totais: _.sumBy(registros, "horas_trabalhadas") / 60,
    };
  });

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Sua Produção</h1>

      {/* Métricas principais */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-100 p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Projetos Trabalhados</h2>
          <p className="text-2xl font-bold">{totalObras}</p>
        </div>
        <div className="bg-green-100 p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Projeto com Mais Horas</h2>
          <p className="text-xl font-bold">{projetoMaisTrabalhado?.obra || "N/A"}</p>
          <p>{projetoMaisTrabalhado?.horas_totais.toFixed(2) || 0} horas</p>
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
          <GridComponent dataSource={Object.values(groupedData)} allowPaging={true} toolbar={["Search"]}>
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
