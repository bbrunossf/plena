import { json, redirect } from "@remix-run/node";
import { useLoaderData, Form, useActionData,  useNavigation } from "@remix-run/react";
import { prisma } from "~/db.server";
import { requireAdmin } from "~/auth.server";; // Função de autenticação
import { z } from "zod";
import { formatarDataBR, formatarValorBR } from "~/lib/utils/date";
import { format, fromZonedTime, toZonedTime } from "date-fns-tz";
import { parseISO  } from "date-fns";

export const loader = async ({ request }: { request: Request }) => {
  await requireAdmin(request); // Garante que só usuários autenticados acessem

  const pessoas = await prisma.pessoa.findMany({
    include: {
      custos: {
        orderBy: { inicioVigencia: "desc" }
      }
    }
  });

  // Formata a data para exibição
  const pessoasFormatadas = pessoas.map(pessoa => ({
    ...pessoa,
    // Mapeie os custos e formate a data para cada custo
    custos: pessoa.custos.map(custo => ({
      ...custo,
      inicioVigencia: custo.inicioVigencia // Formato adequado para datetime-local
    })) ?? [] // Certifique-se de lidar com o caso em que pessoa.custos é undefined
  }));

  //return json({ pessoas });
  return json({pessoas: pessoasFormatadas});
};

const CustoHoraSchema = z.object({
  pessoaId: z.string(),
  custoHora: z.string(),
  custoHoraExtra: z.string(),
  inicioVigencia: z.string(),
  fimVigencia: z.string().optional()
});

// export const action = async ({ request }: { request: Request }) => {
//   // const user = await requireAdmin(request);
//   // if (user.role !== "ADMIN") {
//   //   return json({ error: "Não autorizado" }, { status: 403 });
//   // }

//   const formData = await request.formData();
//   const data = Object.fromEntries(formData);

//   const parseResult = CustoHoraSchema.safeParse(data);
//   if (!parseResult.success) {
//     return json({ error: "Dados inválidos" }, { status: 400 });
//   }

//   const { pessoaId, custoHora, custoHoraExtra, inicioVigencia, fimVigencia } = parseResult.data;

//   const inicio = new Date(inicioVigencia);
//   const fim = fimVigencia ? new Date(fimVigencia) : null;

//   // Verifica sobreposição de vigência
//   const sobreposicao = await prisma.custoHora.findFirst({
//     where: {
//       pessoaId: parseInt(pessoaId),
//       OR: [
//         {
//           inicioVigencia: { lte: fim ?? new Date("9999-12-31") },
//           fimVigencia: { gte: inicio }
//         },
//         {
//           inicioVigencia: { lte: inicio },
//           fimVigencia: { gte: inicio }
//         }
//       ]
//     }
//   });

//   if (sobreposicao) {
//     return json({ error: "Já existe uma vigência sobreposta para esta pessoa." }, { status: 400 });
//   }

//   await prisma.custoHora.create({
//     data: {
//       pessoaId: parseInt(pessoaId),
//       custoHora: parseFloat(custoHora),
//       custoHoraExtra: parseFloat(custoHoraExtra),
//       inicioVigencia: inicio,
//       fimVigencia: fim
//     }
//   });

//   return redirect("/custoHora");
// };
export const action = async ({ request }: { request: Request }) => {
  // const user = await requireAdmin(request);
  // if (user.role !== "ADMIN") {
  //   return json({ error: "Não autorizado" }, { status: 403 });
  // }

  const formData = await request.formData();
  const data = Object.fromEntries(formData);

  const parseResult = CustoHoraSchema.safeParse(data);
  if (!parseResult.success) {
    return json({ error: "Dados inválidos" }, { status: 400 });
  }

  const { pessoaId, custoHora, custoHoraExtra, inicioVigencia, fimVigencia } = parseResult.data;

  // Converte a data de entrada do formulário para UTC
  const inicioVigenciaUTC = fromZonedTime(inicioVigencia, 'America/Sao_Paulo');
  const fimVigenciaUTC = fromZonedTime(fimVigencia, 'America/Sao_Paulo');

  const inicio = new Date(inicioVigenciaUTC);
  const fim = fimVigencia ? new Date(fimVigenciaUTC) : null;

  // Calcula a data de fim para as vigências anteriores (um dia antes da nova vigência)
  const fimVigenciaAnterior = new Date(inicio);
  fimVigenciaAnterior.setDate(fimVigenciaAnterior.getDate() - 1);

  // Verifica se já existe uma vigência ativa no mesmo período
  const sobreposicao = await prisma.custoHora.findFirst({
    where: {
      pessoaId: parseInt(pessoaId),
      inicioVigencia: { lte: inicio },
      OR: [
        { fimVigencia: null },
        { fimVigencia: { gte: inicio } }
      ]
    }
  });

  if (sobreposicao && sobreposicao.inicioVigencia.getTime() === inicio.getTime()) {
    return json({ error: "Já existe uma vigência com a mesma data de início." }, { status: 400 });
  }

  // Inicia uma transação para garantir consistência
  await prisma.$transaction(async (tx) => {
    // Atualiza todas as vigências anteriores que não têm fim definido ou que se estendem além da nova data
    await tx.custoHora.updateMany({
      where: {
        pessoaId: parseInt(pessoaId),
        inicioVigencia: { lt: inicio },
        OR: [
          { fimVigencia: null },
          { fimVigencia: { gte: inicio } }
        ]
      },
      data: {
        fimVigencia: fimVigenciaAnterior
      }
    });

    // Cria a nova vigência
    await tx.custoHora.create({
      data: {
        pessoaId: parseInt(pessoaId),
        custoHora: parseFloat(custoHora),
        custoHoraExtra: parseFloat(custoHoraExtra),
        inicioVigencia: inicio,
        fimVigencia: fim
      }
    });
  });

  return redirect("/custoHora");
};

export default function CustoHoraAdminPage() {
  const { pessoas } = useLoaderData<typeof loader>();
  console.log(pessoas[0].custos[0].inicioVigencia); //2025-01-01T00:00:00.000Z usando fromZonedTime no loader
  //console.log( format (pessoas[0].custos[0].inicioVigencia, "dd/MM/yyyy") ); //31/12/2024 usando fromZonedTime no loader
  //console.log( format ((new Date(pessoas[0].custos[0].inicioVigencia)), "dd/MM/yyyy") ); //31/12/2024 usando fromZonedTime no loader

  const actionData = useActionData<typeof action>();
  const navigation  = useNavigation();

  // Função auxiliar para converter UTC para timezone local na exibição
  const formatarDataParaExibicao = (data: Date) => {
    const datalocal = new Date(data.getTime() + (3 * 60 * 60 * 1000)).toLocaleDateString('pt-BR');  
    console.log("resultado da conversão:", datalocal);
    return datalocal
  };

  return (
    //{/* container principal */}
    <div className="flex space-x-4 w-full"> {/* Início do contêiner principal flex */}
      <div className="p-8 flex-grow"> {/* Início do contêiner do título e formulários */}
        

        {actionData?.error && (
          <div className="bg-red-100 text-red-700 p-2 mb-4 rounded">{actionData.error}</div>
        )}

        <h1 className="text-2xl font-bold mb-4">Gerenciar Custo Hora</h1> {/* Título principal */}

        <div className="flex space-x-4"> {/* Início do contêiner flex para formulário e histórico */}
          <div className="w-1/3"> {/* Início da seção do formulário */}
            <Form method="post" className="space-y-4">
              <div>
                <label className="block mb-1 font-semibold">Pessoa</label>
                <select name="pessoaId" className="border p-2 rounded w-full">
                  {pessoas.map((pessoa) => (
                    <option key={pessoa.id_nome} value={pessoa.id_nome}>
                      {pessoa.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1 font-semibold">Custo Hora</label>
                <input
                  type="number"
                  step="0.01"
                  name="custoHora"
                  className="border p-2 rounded w-full"
                  required
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold">Custo Hora Extra</label>
                <input
                  type="number"
                  step="0.01"
                  name="custoHoraExtra"
                  className="border p-2 rounded w-full"
                  required
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold">Início Vigência</label>
                <input
                  type="date"
                  name="inicioVigencia"
                  className="border p-2 rounded w-full"
                  required
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold">Fim Vigência</label>
                <input
                  type="date"
                  name="fimVigencia"
                  className="border p-2 rounded w-full"
                />
              </div>

              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                disabled={navigation.state === "submitting"}
              >
                {navigation.state === "submitting" ? "Salvando..." : "Salvar"}
              </button>
            </Form>
          </div> {/* Fim da seção do formulário */}
        
          <div className="w-2/3"> {/* Início da seção de Histórico de Custos */}
            <h2 className="text-xl font-bold mb-4">Histórico de Custos</h2>

            {pessoas.map((pessoa) => (
              <div key={pessoa.id_nome} className="mb-6">
                <h3 className="font-semibold">{pessoa.nome}</h3>
                <ul className="list-disc pl-6">
                  {pessoa.custos.map((custo) => (
                    <li key={custo.id}>
                      {`R$ ${custo.custoHora} / R$ ${custo.custoHoraExtra} `}
                      ({formatarDataParaExibicao(new Date(custo.inicioVigencia))} -{" "}
                      {custo.fimVigencia
                      ? formatarDataParaExibicao(new Date(custo.fimVigencia))
                      : "Ativo"})
                      
                       {/* (Início: {format(new Date(custo.inicioVigencia), "dd/MM/yyyy")} - 
                       Fim: {custo.fimVigencia ? format(new Date(custo.fimVigencia), "dd/MM/yyyy") : "Ativo"})   */}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div> {/* Fim da seção de Histórico de Custos */}  
        </div> {/* Fim do contêiner flex para formulário e histórico */}
        
      </div> {/* Fim do contêiner do título e formulários */}
    </div> //* Fim do contêiner principal flex *
  );
}
