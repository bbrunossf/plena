// app/routes/api/save-gantt.ts
import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
// import { prisma } from "~/db.server"; // seu cliente Prisma

import { PrismaClient } from "@prisma/client";
// Cria uma instância do Prisma Client
const prisma = new PrismaClient();




// Função auxiliar para "achatar" os dados hierárquicos (se necessário)
function flattenTasks(tasks: any[]): any[] {
  let flat: any[] = [];
  for (const task of tasks) {
    // Cria uma cópia do objeto sem a propriedade de subtasks (se desejar)
    const { subtasks, ...rest } = task;
    flat.push(rest);
    if (subtasks && Array.isArray(subtasks)) {
      flat = flat.concat(flattenTasks(subtasks));
    }
  }
  return flat;
}

export const action: ActionFunction = async ({ request }) => {
  try {
    // Supondo que o DataManager envia os dados via formData com campo "data"
    const formData = await request.formData();
    const dataJson = formData.get("data");
    console.log("Dados recebidos:", dataJson);
    if (!dataJson) {
      throw new Error("Nenhum dado recebido");
    }
    const tasks = JSON.parse(dataJson);
    
    // Processa cada tarefa para atualizar ou inserir no banco
    for (const task of tasks) {
      await prisma.task.upsert({
        where: { id: task.TaskID },
        update: {
          taskName: task.taskName,
          startDate: new Date(task.StartDate),
          endDate: new Date(task.EndDate),
          duration: task.Duration,
          progress: task.Progress,
          parentId: task.parentId,
        },
        create: {
          id: task.TaskID,
          taskName: task.taskName,
          startDate: new Date(task.StartDate),
          endDate: new Date(task.EndDate),
          duration: task.Duration,
          progress: task.Progress,
          parentId: task.parentId,
        },
      });
    }

    return json({ success: true });
  } catch (error) {
    console.error("Erro ao salvar os dados:", error);
    return json({ success: false, error: error.message }, { status: 500 });
  }
};

   