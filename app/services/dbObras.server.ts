// app/models/obra.server.ts
import { prisma } from "~/db.server";

// export async function getObras() {
//   const obras = await prisma.$queryRaw`SELECT
//   id_obra,
//   cod_obra,
//   nome_obra,
//   id_cliente,

//   -- CASE 
//   --       WHEN data_inicio IS NOT NULL AND data_inicio != '' THEN datetime(data_inicio/1000, 'unixepoch', 'localtime') 
//   --       ELSE NULL 
//   --   END AS data_inicio,

//   --date(data_inicio) AS data_inicio,
//   CASE
//     WHEN data_inicio IS NOT NULL AND data_inicio != '' 
//       THEN date(data_inicio/1000, 'unixepoch', 'localtime')
//       ELSE NULL 
//     END AS data_inicio,


//   total_horas_planejadas,
//   observacoes_planejamento           
//   FROM Obra;`          
//   return obras;
// }

//quando todas as datas estiverem no formato de milissegundos, tenho que 
//fazer a consulta Raw com 
//SELECT date(data_inicio/1000, 'unixepoch', 'localtime') AS data_inicio
//FROM Obra o WHERE o.id_obra = 232;

// com todos os dados em milissegundos ou com NULL feito certo, o 
// findMany funciona sem erros (ainda passando os parâmetros pra não 
// pegar as colunas data_inicio_planejamento
// e data_termino_planejamento)
export async function getObras() {
  return await prisma.obra.findMany(
    {
      select: {
        id_obra: true,
        cod_obra: true,
        nome_obra: true,
        id_cliente: true,
        data_inicio: true,
        total_horas_planejadas: true,
        observacoes_planejamento: true,
      },
    }
  );
}

export async function getClientes() {
  return await prisma.cliente.findMany();
}

export async function createObra(
    cod_obra: string,
    nome_obra: string,
    id_cliente: number,
    data_inicio: string,
    total_horas_planejadas: number,
    observacoes_planejamento: string
  ) {
    return await prisma.obra.create({
      data: {
        cod_obra,
        nome_obra,
        id_cliente,
        data_inicio,
        total_horas_planejadas,
        observacoes_planejamento,
      },
    });
  }

  export async function updateObra(id_obra: number, data: {
    cod_obra: string;
    nome_obra: string;
    id_cliente: number;
    data_inicio: string;
    total_horas_planejadas: number;
    observacoes_planejamento: string;
  }) {
    return await prisma.obra.update({
      where: { id_obra },
      data: {
        cod_obra: data.cod_obra,
        nome_obra: data.nome_obra,
        id_cliente: data.id_cliente,
        data_inicio: data.data_inicio,
        total_horas_planejadas: data.total_horas_planejadas,
        observacoes_planejamento: data.observacoes_planejamento,
      },
    });
  }


export async function deleteObra(id_obra: number) {
  return await prisma.obra.delete({
    where: { id_obra }
  });
}