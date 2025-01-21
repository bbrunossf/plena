import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { prisma } from "~/db.server";

interface ConsolidatedCost {
  obra: string;
  codigoObra: string;
  tipoTarefa: string;
  totalHoras: number;
  totalCusto: number;
  details: {
    nome: string;
    horas: number;
    custo: number;
  }[];
}

export const loader = async () => {
  const horasPlena = await prisma.registro.findMany({
    take: 10, // LIMIT 10
    skip: 0,  // OFFSET 0
    select: {
      id_registro: true,
      duracao_minutos: true,
      pessoa: {
        select: {
          hourlyRate: true,
          nome: true
        }
      },
      obra: {
        select: {
          nome_obra: true,
          cod_obra: true
        }
      },
      tipoTarefa: {
        select: {
          nome_tipo: true
        }
      }
    },
    // orderBy: {
    //   obra: {
    //     id_obra: 'asc'
    //   }
    // }
  });

  const consolidatedCosts = horasPlena.reduce((acc, registro) => {
    const key = `${registro.obra.nome_obra}-${registro.tipoTarefa.nome_tipo}`;
    const hoursWorked = registro.duracao_minutos / 60;
    const cost = hoursWorked * (registro.pessoa.hourlyRate || 0);

    if (!acc[key]) {
      acc[key] = {
        obra: registro.obra.nome_obra,
        codigoObra: registro.obra.cod_obra,
        tipoTarefa: registro.tipoTarefa.nome_tipo,
        totalHoras: hoursWorked,
        totalCusto: cost,
        details: [{
          nome: registro.pessoa.nome,
          horas: hoursWorked,
          custo: cost
        }]
      };
    } else {
      acc[key].totalHoras += hoursWorked;
      acc[key].totalCusto += cost;

      const existingDetail = acc[key].details.find(d => d.nome === registro.pessoa.nome);
      if (existingDetail) {
        existingDetail.horas += hoursWorked;
        existingDetail.custo += cost;
      } else {
        acc[key].details.push({
          nome: registro.pessoa.nome,
          horas: hoursWorked,
          custo: cost
        });
      }
    }
    return acc;
  }, {} as Record<string, ConsolidatedCost>);

  return json({ consolidatedCosts: Object.values(consolidatedCosts) });
};

export default function Costs() {
  const { consolidatedCosts } = useLoaderData<typeof loader>();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Resumo de Custos por Obra e Tipo de Tarefa</h1>
      
      <div className="overflow-x-auto mb-8">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Obra</th>
              <th className="border p-2 text-left">Código</th>
              <th className="border p-2 text-left">Tipo de Tarefa</th>
              <th className="border p-2 text-right">Total Horas</th>
              <th className="border p-2 text-right">Custo Total</th>
            </tr>
          </thead>
          <tbody>
            {consolidatedCosts.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="border p-2">{item.obra}</td>
                <td className="border p-2">{item.codigoObra}</td>
                <td className="border p-2">{item.tipoTarefa}</td>
                <td className="border p-2 text-right">{item.totalHoras.toFixed(2)}</td>
                <td className="border p-2 text-right">
                  R$ {item.totalCusto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-100 font-bold">
            <tr>
              <td colSpan={3} className="border p-2 text-right">Total Geral:</td>
              <td className="border p-2 text-right">
                {consolidatedCosts.reduce((acc, curr) => acc + curr.totalHoras, 0).toFixed(2)}
              </td>
              <td className="border p-2 text-right">
                R$ {consolidatedCosts
                  .reduce((acc, curr) => acc + curr.totalCusto, 0)
                  .toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <h2 className="text-xl font-bold mb-4">Detalhes por Funcionário</h2>
      {consolidatedCosts.map((item, index) => (
        <div key={index} className="mb-6">
          <h3 className="text-lg mb-2">
            Obra: {item.obra} - Tipo de Tarefa: {item.tipoTarefa}
          </h3>
          <table className="w-full border-collapse mb-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">Funcionário</th>
                <th className="border p-2 text-right">Horas</th>
                <th className="border p-2 text-right">Custo</th>
              </tr>
            </thead>
            <tbody>
              {item.details.map((detail, detailIndex) => (
                <tr key={detailIndex} className="hover:bg-gray-50">
                  <td className="border p-2">{detail.nome}</td>
                  <td className="border p-2 text-right">{detail.horas.toFixed(2)}</td>
                  <td className="border p-2 text-right">
                    R$ {detail.custo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}