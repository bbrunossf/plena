import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { 
  createObra, 
  updateObra, 
  deleteObra 
} from "~/services/dbObras.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const data = await request.json();
  console.log("dados recebidos:",data);
  const method = request.method;

  try {
    // Criar
    if (method === "POST") {
      const resultado = await createObra(
        data.cod_obra,
        data.nome_obra,
        data.id_cliente,
        new Date(data.data_inicio).toISOString(),
        data.total_horas_planejadas,
        data.observacoes_planejamento
      );
      return json({ success: true, data: resultado });
    }
    
    // Atualizar
    if (method === "PUT") {
      const resultado = await updateObra(data.id_obra, data);
      return json({ success: true, data: resultado });
    }
    
    // Deletar
    if (method === "DELETE") {
      const resultado = await deleteObra(data.id_obra);
      return json({ success: true, data: resultado });
    }
    
    return json({ success: false, error: "Método não suportado" }, { status: 405 });
  } catch (error) {
    return json({ success: false, error: error.message }, { status: 500 });
  }
};