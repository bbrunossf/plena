//função que será usada no loader e nas requisições GET
import { prisma } from "~/db.server";

export async function getTasks() {
  return await prisma.task.findMany({
    orderBy: { id: "asc" },  // Essa é a ordem que as tarefas são apresentadas no gráfico de gantt
    select: {
      id: true,
      taskName: true,
      startDate: true,
      endDate: true,
      duration: true,
      progress: true,
      parentId: true,
      predecessor: true,
      notes: true,
      order: true,
      taskResources: {
        select: {
          taskResourceId: true
        }
      }
    }
  });
}

export async function getResources() {
  return await prisma.taskResource.findMany({
    orderBy: { id: "asc" },  // Garante a ordenação
    select: {
              id: true,
              resourceName: true,     
            }    
  });
}

export async function getUsedResources() {
  return await prisma.task.findMany({
    include: {     
      taskResources: {
        select: {taskResourceId: true}          
      },
    }
  });
}

// export async function getUsedResources() {  
//     const tasksWithResources = await prisma.task.findMany({
//       include: {
//         taskResources: {
//           include: {
//             taskResource: {
//               include: {
//                 taskAssignments: true, // Inclui os detalhes do recurso
//               },
//             },
//           },
//         },
//       },
//     });
//     return tasksWithResources;
//   }

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