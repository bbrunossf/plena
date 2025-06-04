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
      console.log("Dados brutos recebidos:", data);  
      // Remove id_obra dos dados para criação (será gerado automaticamente)
      const { id_obra, ...dadosParaCriacao } = data;  
      console.log("Dados após remover id_obra:", dadosParaCriacao);
  
      const resultado = await createObra(
        dadosParaCriacao.cod_obra,
        dadosParaCriacao.nome_obra,
        dadosParaCriacao.id_cliente,
        new Date(dadosParaCriacao.data_inicio).toISOString(),
        dadosParaCriacao.total_horas_planejadas,
        dadosParaCriacao.observacoes_planejamento
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