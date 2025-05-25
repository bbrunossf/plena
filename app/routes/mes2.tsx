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
  ColumnSeries,
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
  //     p.id_nome,
  //     p.nome,
  //     p.hourlyRate,
  //     o.nome_obra,
  //     o.cod_obra,
  //     t.nome_tipo,
  //     cat.nome_categoria,
  //     DATETIME (r.timestamp) AS data_hora,
  //     r.duracao_minutos AS horas_trabalhadas,
  //     strftime('%Y-%m', r.timestamp) AS ano_mes
  //   FROM Registro r
  //   INNER JOIN Obra o ON r.id_obra = o.id_obra
  //   INNER JOIN TipoTarefa t ON r.id_tipo_tarefa = t.id_tipo_tarefa
  //   INNER JOIN Categoria cat ON r.id_categoria = cat.id_categoria
  //   INNER JOIN Pessoa p ON r.id_nome = p.id_nome
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


  // Get unique employees
  const funcionarios = _.uniqBy(registros, "pessoa.id_nome").map(r => ({
    id: r.pessoa.id_nome,
    nome: r.pessoa.nome,
    hourlyRate: r.pessoa.hourlyRate
  }));

  //console.log("funcionarios listados:", funcionarios);
  return ({ registros: registrosComAnoMes, funcionarios });
  
};

export default function RelatorioMensal() {
  const { registros, funcionarios } = useLoaderData();
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState(
    funcionarios.length > 0 ? funcionarios[0].id : null
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

  // Filter records by selected employee
  const registrosFuncionario = registros.filter(r => 
    r.pessoa.id_nome === funcionarioSelecionado 
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
        totalHours: 0,
        totalValue: 0
      };
    }

    // Sum hours by month
    registrosFuncionario.forEach(registro => {
      const monthKey = registro.ano_mes;
      if (monthsMap[monthKey]) {
        monthsMap[monthKey].totalHours += _.round((registro.duracao_minutos / 60),2); // Convert minutes to hours
        monthsMap[monthKey].totalValue += (registro.duracao_minutos / 60) * registro.pessoa.hourlyRate;
      }
    });

    // Convert to array and sort by month
    return Object.values(monthsMap).sort((a, b) => a.month - b.month);
  })();

  // Calculate totals for summary
  const totalHoursYear = _.round((_.sumBy(dadosMensais, 'totalHours')),2);
  const totalValueYear = _.round((_.sumBy(dadosMensais, 'totalValue')),2);
  const averageMonthlyHours = totalHoursYear / (dadosMensais.filter(m => m.totalHours > 0).length || 1);
  const highestMonth = _.maxBy(dadosMensais, 'totalHours');
  const lowestMonth = dadosMensais.filter(m => m.totalHours > 0).length > 0 
    ? _.minBy(dadosMensais.filter(m => m.totalHours > 0), 'totalHours') 
    : { monthName: 'N/A', totalHours: 0 };

  // Get selected employee name and rate
  const funcionarioAtual = funcionarios.find(f => f.id === funcionarioSelecionado) || { nome: '', hourlyRate: 0 };

  // Format currency values
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };

  // Format number with 2 decimal places
  const formatNumber = (value) => {
    return value.toFixed(2);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Relatório Mensal de Horas</h1>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-lg font-semibold mb-2">Selecionar Funcionário</label>
          <div className="space-y-2 bg-gray-50 p-4 rounded border">
            {funcionarios.map((funcionario) => (
              <div key={funcionario.id} className="flex items-center">
                <RadioButtonComponent 
                  id={`func-${funcionario.id}`}
                  name="funcionarioGroup"
                  label={funcionario.nome}
                  value={funcionario.id}
                  checked={funcionario.id === funcionarioSelecionado}
                  change={(e) => setFuncionarioSelecionado(e.value)}
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
          <p className="text-2xl font-bold">{formatNumber(totalHoursYear)}</p>
          
        </div>
        <div className="bg-green-100 p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Mês com Mais Horas</h2>
          <p className="text-xl font-bold">{highestMonth?.monthName || 'N/A'}</p>
          <p>{highestMonth ? formatNumber(highestMonth.totalHours) : 0} horas</p>
        </div>
        <div className="bg-yellow-100 p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Média Mensal</h2>
          <p className="text-xl font-bold">{formatNumber(averageMonthlyHours)} horas</p>
          
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
      
      {/* Gráfico de barras para as horas mensais */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Horas Trabalhadas por Mês - {funcionarioAtual.nome} ({ano})</h2>
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
          <ChartInject services={[ColumnSeries, LineSeries, Legend, Tooltip, Category, DataLabel]} />
          <SeriesCollectionDirective>
            <SeriesDirective
              dataSource={dadosMensais}
              xName="monthName"
              yName="totalHours"
              name="Horas Trabalhadas"
              type="Column"
              marker={{ dataLabel: { visible: true, format: '{value} h' } }}
            />            
          </SeriesCollectionDirective>
        </ChartComponent>
      </div>

      
      </div>
    </div>
  );
}