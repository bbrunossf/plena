import { json, redirect } from "@remix-run/node";
import { useLoaderData, Form, useActionData,  useNavigation } from "@remix-run/react";
import { prisma } from "~/db.server";
import { requireAdmin } from "~/auth.server";; // Função de autenticação
import { z } from "zod";

export const loader = async ({ request }: { request: Request }) => {
  await requireAdmin(request); // Garante que só usuários autenticados acessem

  const pessoas = await prisma.pessoa.findMany({
    include: {
      custos: {
        orderBy: { inicioVigencia: "desc" }
      }
    }
  });

  return json({ pessoas });
};

const CustoHoraSchema = z.object({
  pessoaId: z.string(),
  custoHora: z.string(),
  custoHoraExtra: z.string(),
  inicioVigencia: z.string(),
  fimVigencia: z.string().optional()
});

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

  const inicio = new Date(inicioVigencia);
  const fim = fimVigencia ? new Date(fimVigencia) : null;

  // Verifica sobreposição de vigência
  const sobreposicao = await prisma.custoHora.findFirst({
    where: {
      pessoaId: parseInt(pessoaId),
      OR: [
        {
          inicioVigencia: { lte: fim ?? new Date("9999-12-31") },
          fimVigencia: { gte: inicio }
        },
        {
          inicioVigencia: { lte: inicio },
          fimVigencia: { gte: inicio }
        }
      ]
    }
  });

  if (sobreposicao) {
    return json({ error: "Já existe uma vigência sobreposta para esta pessoa." }, { status: 400 });
  }

  await prisma.custoHora.create({
    data: {
      pessoaId: parseInt(pessoaId),
      custoHora: parseFloat(custoHora),
      custoHoraExtra: parseFloat(custoHoraExtra),
      inicioVigencia: inicio,
      fimVigencia: fim
    }
  });

  return redirect("/custoHora");
};

export default function CustoHoraAdminPage() {
  const { pessoas } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation  = useNavigation();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Gerenciar Custo Hora</h1>

      {actionData?.error && (
        <div className="bg-red-100 text-red-700 p-2 mb-4 rounded">{actionData.error}</div>
      )}

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

      <hr className="my-8" />

      <h2 className="text-xl font-bold mb-4">Histórico de Custos</h2>

      {pessoas.map((pessoa) => (
        <div key={pessoa.id} className="mb-6">
          <h3 className="font-semibold">{pessoa.nome}</h3>
          <ul className="list-disc pl-6">
            {pessoa.custos.map((custo) => (
              <li key={custo.id}>
                {`R$ ${custo.custoHora} / R$ ${custo.custoHoraExtra} `}
                ({new Date(custo.inicioVigencia).toLocaleDateString()} -{" "}
                {custo.fimVigencia
                  ? new Date(custo.fimVigencia).toLocaleDateString()
                  : "Ativo"})
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
