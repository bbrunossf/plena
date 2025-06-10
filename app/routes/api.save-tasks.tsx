import { data, json } from '@remix-run/node'
import type { ActionFunction, LoaderFunction } from '@remix-run/node'
import { getTasks, getResources, getLastOrder } from "~/utils/tasks";
import { prisma } from "~/db.server";

export async function loader() {
  // Obtenha as tarefas, recursos e eventos
  const tasks = await getTasks(); // Já vem com os recursos incluídos
  const resources = await getResources(); // Mantemos essa chamada caso precise dos recursos independentes  
  const x = await getLastOrder(); //ultima numeração de ordem (order) das tarefas
  
  // Não precisamos mais do usedResources, já que as tarefas já vêm com recursos

  // Mapeando cada tarefa para a estrutura desejada
  const tasksWithId = tasks.map((task: any) => ({
    TaskID: task.id,
    taskName: task.taskName,
    StartDate: new Date(task.startDate),
    EndDate: new Date(task.endDate),
    Duration: task.duration,
    Progress: task.progress,
    parentId: task.parentId, //? String(task.parentId) : null,
    Predecessor: task.predecessor,    
    notes: task.notes,
    order: task.order,
    ////Resources: task.taskResources.taskResourceId // Já vem como um array de IDs
    // Mapeando taskResources para extrair os taskResourceId como um array
    Resources: task.taskResources.map((resource: any) => resource.taskResourceId)
  }));

  // Map resources to match the GanttComponent's resourceFields
  const formattedResources = resources.map((resource: any) => ({
    id: resource.id,
    resourceName: resource.resourceName,
    resourceRole: resource.resourceRole,
  }));  

  
  return ({ tasks: tasksWithId, resources: formattedResources, x});
}

export const action: ActionFunction = async ({ request }) => {
  console.log(request.method, " - ", request.url); //só pra checar
  try {
    const { updatedData, deletedTasks, x } = await request.json();
    console.log("Dados recebidos no endpoint!");

    if (!updatedData && !deletedTasks) {
      return json({ success: false, error: "Nenhum dado para atualizar ou excluir." }, { status: 400 });
    }

    // Processar tarefas excluídas primeiro
    if (deletedTasks && deletedTasks.length > 0) {
      // Excluir associações de recursos para tarefas excluídas
      await prisma.taskResourceAssignment.deleteMany({
        where: { taskId: { in: deletedTasks.map(task => task.TaskID) } },
      });
      
      // Excluir tarefas
      await prisma.task.deleteMany({
        where: { id: { in: deletedTasks.map(task => task.TaskID) } },
      });
    }

    // Obter o maior valor de order
    console.log("Valor de order na função loader", x.order);
    const lastOrderResult = parseInt(x.order);    
    const nextOrder = lastOrderResult + 1;
    console.log("Próximo valor de order:", nextOrder);
    console.log("Maior valor de order:", lastOrderResult);

    // Processar tarefas atualizadas
    if (updatedData && updatedData.length > 0) {
      for (const task of updatedData) {
        // Atualizar ou criar a tarefa
        const taskData = {
          taskName: task.taskName,
          startDate: new Date(task.StartDate),
          endDate: new Date(task.EndDate),
          duration: task.Duration,
          progress: task.Progress || 0,
          predecessor: task.Predecessor,
          parentId: task.parentId !== null ? task.parentId.toString() : null,
          notes: task.notes,
          order: task.order, //se a tarefa foi colada, ela tem o order definido
        };
        //check: exibir o campo de notas, para conferir
        //console.log("Notas:", task.notes);
        
        // Para tarefas novas, adicionar o order
        if (!task.order) {
          console.log("Tarefa nova, atribuindo order:", nextOrder);
          taskData.order = nextOrder; // já incrementado anteriormente
        }
        
        const upsertedTask = await prisma.task.upsert({
          where: { id: parseInt(task.TaskID) }, //sempre vai ter um TaskID, mesmo que seja novo
          update: taskData,
          create: { ...taskData},
        });
        
        // Processar associações de recursos de forma incremental
        // 1. Obter associações existentes para esta tarefa
        const existingAssignments = await prisma.taskResourceAssignment.findMany({
          where: { taskId: upsertedTask.id },
          select: { taskResourceId: true }
        });
        
        // 2. Determinar quais IDs de recursos existem atualmente
        const existingResourceIds = new Set(
          existingAssignments.map(assignment => assignment.taskResourceId)
        );
        
        // 3. Determinar quais IDs de recursos são desejados
        const desiredResourceIds = new Set(
          (task.Resources || []).map(resource => parseInt(resource.id))
        );
        
        // 4. Determinar quais associações adicionar (estão em desiredResourceIds mas não em existingResourceIds)
        const toAdd = [...desiredResourceIds].filter(id => !existingResourceIds.has(id));
        
        // 5. Determinar quais associações remover (estão em existingResourceIds mas não em desiredResourceIds)
        const toRemove = [...existingResourceIds].filter(id => !desiredResourceIds.has(id));
        
        // 6. Adicionar novas associações
        if (toAdd.length > 0) {
          await prisma.taskResourceAssignment.createMany({
            data: toAdd.map(resourceId => ({
              taskId: upsertedTask.id,
              taskResourceId: resourceId
            })),
            //skipDuplicates: true
          });
        }
        
        // 7. Remover associações desnecessárias
        if (toRemove.length > 0) {
          await prisma.taskResourceAssignment.deleteMany({
            where: {
              taskId: upsertedTask.id,
              taskResourceId: { in: toRemove }
            }
          });
        }
      }
    }
    console.log("Dados salvos com sucesso!") ;    

    return json({ success: true });    
  } catch (error) {
    console.error("Erro ao salvar os dados:", error);
    return json({ success: false, error: error.message }, { status: 500 });
  }
};