import { json } from "@remix-run/node";
import { prisma } from "~/db.server";

export const action = async ({ request }) => {
  const formData = await request.formData();
  const id = parseInt(formData.get("id"), 10);
  const entregue = formData.get("entregue") ===  'true';
  //const entregue_em = new Date(formData.get("entregue_em"));
  const entregue_em = formData.get("entregue_em") === "null" ? null : new Date(formData.get("entregue_em")); // Converte para Date ou null

  try {
    const updatedEvent = await prisma.agenda.update({
      where: { id },
      data: { entregue, entregue_em },
    });
    return json(updatedEvent);
  } catch (error) {
    console.error("Erro ao atualizar evento:", error);
    return json({ error: "Erro ao atualizar evento" }, { status: 500 });
  }
};