//função que será usada no loader e nas requisições GET
import { prisma } from "~/db.server";

export async function getTasks() {
  return await prisma.task.findMany({
    orderBy: { id: "asc" },  // Garante a ordenação
  });
}

export async function getResources() {
  return await prisma.taskResource.findMany({
    orderBy: { id: "asc" },  // Garante a ordenação
  });
}

export async function getUsedResources() {
  return await prisma.task.findMany({
    //select: { taskResources: true },
    select: { 
      taskResources: {
        select: {taskResourceId: true}          
      },
    }
  });
}

export async function getEvents() {
  // return await prisma.agenda.findMany({
  //   orderBy: { id: "asc" },  // Garante a ordenação
  // });
  return await prisma.$queryRaw`       
        SELECT 
        id, 
        titulo,
        descricao,
        strftime('%m-%d-%Y', data_hora_inicio) AS data_hora_inicial,
        strftime('%m-%d-%Y', data_hora_termino) AS data_hora_final,
        dia_inteiro,
        id_obra,
        entregue,
        entregue em        
        FROM Agenda         
        `
}