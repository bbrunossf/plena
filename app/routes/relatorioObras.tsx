import { json } from "@remix-run/node";
import { prisma } from "~/db.server";
import { useLoaderData } from "@remix-run/react";
import { useState } from "react";
import _ from "lodash";
import {
  GridComponent,
  ColumnsDirective,
  ColumnDirective,
  Inject as GridInject,
  Page,
  Toolbar,
  Sort
} from "@syncfusion/ej2-react-grids";
import {
  ChartComponent,
  SeriesCollectionDirective,
  SeriesDirective,
  LineSeries,
  Category,
  Legend,
  Tooltip,
  DataLabel,
  Inject as ChartInject
} from "@syncfusion/ej2-react-charts";
import { RadioButtonComponent } from "@syncfusion/ej2-react-buttons";

export const loader = async () => {
  // Fetch all records with relevant joins
  // const registros = await prisma.$queryRaw`
  //   SELECT 
  //     o.id_obra,
  //     o.nome_obra,
  //     o.cod_obra,
  //     DATETIME (r.timestamp) AS data_hora,
  //     r.duracao_minutos AS horas_trabalhadas,
  //     strftime('%Y-%m', r.timestamp) AS ano_mes
  //   FROM Registro r
  //   INNER JOIN Obra o ON r.id_obra = o.id_obra
  //   WHERE r."timestamp" > "2025-01-01"   
  //   ORDER BY r.timestamp DESC
  // `;
  const registros = await prisma.registro.findMany({                  
      select: {
        timestamp: true,
        duracao_minutos: true,
        hora_extra: true,
        
        obra: {
          select: {
            id_obra: true,
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
            id_nome: true,
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
          timestamp: "desc",
        },
        {
          tipoTarefa: {
            nome_tipo: "asc",
          },
        },
      ],      
    });
//não é possível criar coluna 'ano_mes' diretamente no Prisma,
//então usamos map para adicionar essa coluna após a consulta
const registrosComAnoMes = registros.map((r) => ({
  ...r,
  ano_mes: new Date(r.timestamp).toISOString().slice(0, 7) // Formato 'YYYY-MM'
}));    

  // Get unique projects
  const obras = _.uniqBy(registros, "obra.id_obra").map(r => ({
    id: r.obra.id_obra,
    nome: r.obra.nome_obra,
    cod_obra: r.obra.cod_obra
  }));

  return ({ registros: registrosComAnoMes, obras });
};

export default function RelatorioMensalObras() {
  const { registros, obras } = useLoaderData();
  const [obraSelecionada, setObraSelecionada] = useState(
    obras.length > 0 ? obras[0].id : null
  );
  const [ano, setAno] = useState(new Date().getFullYear().toString());

  // Extract all available years from the data
  const anosDisponiveis = _.uniq(
    registros.map(r => new Date(r.timestamp).getFullYear().toString())
  ).sort().reverse();

  // If the current year is not in the data, default to the most recent year
  if (!anosDisponiveis.includes(ano) && anosDisponiveis.length > 0) {
    setAno(anosDisponiveis[0]);
  }

  // Filter records by selected project
  const registrosObra = registros.filter(r => 
    r.obra.id_obra === obraSelecionada &&
    new Date(r.timestamp).getFullYear().toString().startsWith(ano)
  );

  // Group data by month and sum hours
  const dadosMensais = (() => {
    // Create a map to hold all months (even those with zero hours)
    const monthsMap = {};
    for (let i = 1; i <= 12; i++) {
      const monthKey = `${ano}-${i.toString().padStart(2, '0')}`;
      monthsMap[monthKey] = {
        month: i,
        monthName: new Date(parseInt(ano), i-1, 1).toLocaleString('default', { month: 'long' }),
        totalHours: 0
      };
    }

    // Sum hours by month
    registrosObra.forEach(registro => {
      const monthKey = registro.ano_mes;
      if (monthsMap[monthKey]) {
        monthsMap[monthKey].totalHours += _.round((registro.duracao_minutos / 60), 2); // Convert minutes to hours
      }
    });

    // Convert to array and sort by month
    return Object.values(monthsMap).sort((a, b) => a.month - b.month);
  })();

  // Calculate totals for summary
  const totalHorasAno = _.round((_.sumBy(dadosMensais, 'totalHours')), 2);
  const mediaMensalHoras = totalHorasAno / (dadosMensais.filter(m => m.totalHours > 0).length || 1);
  const mesMaiorHoras = _.maxBy(dadosMensais, 'totalHours');
  const mesMenorHoras = dadosMensais.filter(m => m.totalHours > 0).length > 0 
    ? _.minBy(dadosMensais.filter(m => m.totalHours > 0), 'totalHours') 
    : { monthName: 'N/A', totalHours: 0 };

  // Get selected project details
  const obraAtual = obras.find(o => o.id === obraSelecionada) || { nome: '', cod_obra: '' };

  // Format number with 2 decimal places
  const formatNumber = (value) => {
    return value.toFixed(2);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Relatório Mensal de Horas por Obra</h1>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-lg font-semibold mb-2">Selecionar Obra</label>
          <div className="space-y-2 bg-gray-50 p-4 rounded border">
            {obras.map((obra) => (
              <div key={obra.id} className="flex items-center">
                <RadioButtonComponent 
                  id={`obra-${obra.id}`}
                  name="obraGroup"
                  label={`${obra.nome} (${obra.cod_obra})`}
                  value={obra.id}
                  checked={obra.id === obraSelecionada}
                  change={(e) => setObraSelecionada(e.value)}
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="anoSelect" className="block text-lg font-semibold mb-2">Selecionar Ano</label>
          <select
            id="anoSelect"
            value={ano}
            onChange={(e) => setAno(e.target.value)}
            className="w-full p-2 border rounded"
          >
            {anosDisponiveis.map((anoDisp) => (
              <option key={anoDisp} value={anoDisp}>
                {anoDisp}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Métricas de resumo */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-100 p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Total de Horas ({ano})</h2>
          <p className="text-2xl font-bold">{formatNumber(totalHorasAno)}</p>
        </div>
        <div className="bg-green-100 p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Mês com Mais Horas</h2>
          <p className="text-xl font-bold">{mesMaiorHoras?.monthName || 'N/A'}</p>
          <p>{mesMaiorHoras ? formatNumber(mesMaiorHoras.totalHours) : 0} horas</p>
        </div>
        <div className="bg-yellow-100 p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Média Mensal</h2>
          <p className="text-xl font-bold">{formatNumber(mediaMensalHoras)} horas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tabela detalhada */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Detalhamento por Mês</h2>
          <GridComponent
            dataSource={dadosMensais}
            allowPaging={false}
            allowSorting={true}
          >
            <GridInject services={[Page, Toolbar, Sort]} />
            <ColumnsDirective>
              <ColumnDirective field="month" headerText="Mês #" width="80" textAlign="Right" />
              <ColumnDirective field="monthName" headerText="Mês" width="120" />
              <ColumnDirective 
                field="totalHours" 
                headerText="Horas Trabalhadas" 
                width="150" 
                textAlign="Right" 
                format="N2"
              />
            </ColumnsDirective>
          </GridComponent>
        </div>
        
        {/* Gráfico de linhas para as horas mensais */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">
            Horas Trabalhadas por Mês - {obraAtual.nome} ({ano})
          </h2>
          <ChartComponent
            id="monthlyChart"
            primaryXAxis={{ 
              valueType: 'Category',
              title: 'Mês',
              labelIntersectAction: 'Rotate45'
            }}
            primaryYAxis={{ 
              title: 'Horas Trabalhadas',            
              labelFormat: '{value} h'
            }}
            tooltip={{ enable: true }}
            legendSettings={{ visible: true }}
            height="400px"
          >
            <ChartInject services={[LineSeries, Legend, Tooltip, Category, DataLabel]} />
            <SeriesCollectionDirective>
              <SeriesDirective
                dataSource={dadosMensais}
                xName="monthName"
                yName="totalHours"
                name="Horas Trabalhadas"
                type="Line"
                marker={{ visible: true, dataLabel: { visible: true, format: '{value} h' } }}
              />            
            </SeriesCollectionDirective>
          </ChartComponent>
        </div>
      </div>
    </div>
  );
}
