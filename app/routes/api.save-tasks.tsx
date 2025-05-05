import { data, json } from '@remix-run/node'
import type { ActionFunction, LoaderFunction } from '@remix-run/node'
import { getTasks, getResources, getLastOrder } from "~/utils/tasks";
import { prisma } from "~/db.server";

export const action: ActionFunction = async ({ request }) => {
  try {
    const { updatedData, deletedTasks } = await request.json();

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
    const lastOrderResult = await getLastOrder();
    let nextOrder = lastOrderResult.order + 1;
    console.log("Maior valor de order:", nextOrder);

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
          order: task.order,
        };
        
        // Para tarefas novas, adicionar o order
        if (!task.TaskID) {
          taskData.order = nextOrder++;
        }
        
        const upsertedTask = await prisma.task.upsert({
          where: { id: parseInt(task.TaskID) || 'new-task-' + Date.now() },
          update: taskData,
          create: { ...taskData, order: taskData.order || nextOrder++ },
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

export const loader: LoaderFunction = async ({ request }) => {
    console.log("Solicitação GET no servidor=====");
    //chamar a função que retorna os dados    
      const tasks = await getTasks();
      const resources = await getResources();
        //return { tasks, resources };
        //console.log("Recursos encontrados:", resources);
      
      //depois tem que mapear os campos
      //mapear cada campo da tarefa para um objeto
      const tasksWithId = tasks.map((task: any, index: number) => ({
        TaskID: task.id,
          taskName: task.taskName,
          StartDate: new Date(task.startDate),//.toISOString().split('T')[0],
          EndDate: new Date(task.endDate),//.toISOString().split('T')[0],
          Duration: task.duration,
          Progress: task.progress,
          parentId: task.parentId,
          Predecessor: task.predecessor,    
          notes: task.notes,
          Resources: resources.map((resource: any) => resource.resourceName) // Map resource IDs
        }));
      
        // Map resources to match the GanttComponent's resourceFields
        const formattedResources = resources.map((resource: any) => ({
          id: resource.id,
          resourceName: resource.resourceName,
          resourceRole: resource.resourceRole,
        }));
      
        console.log("tarefas FORMATADAS", tasksWithId);
        //console.log("Recursos formatados:", formattedResources);
      return ({ tasks: tasksWithId, resources: formattedResources });
      };
      