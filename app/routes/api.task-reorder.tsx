// app/routes/api/tasks.reorder.tsx
import type { ActionFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { prisma } from '~/db.server';
import type { ActionFunction, LoaderFunction } from '@remix-run/node';
import { getTasks, getUsedResources, getResources } from "~/utils/tasks";
import { z } from 'zod';

// Schema para validação do payload
// const ReorderSchema = z.object({
//   draggedTask: z.object({
//     id: z.number(),
//     currentParent: z.string().nullable(),
//     currentOrder: z.number()
//   }),
//   targetTask: z.object({
//     id: z.number(),
//     parentId: z.string().nullable(),
//     order: z.number()
//   }).nullable(),
//   operation: z.object({
//     type: z.enum(['topSegment', 'bottomSegment', 'middleSegment']),
//     newParentId: z.string().nullable()
//   })
// });


export const action: ActionFunction = async ({ request }) => {
  try{
    const payload = await request.json();
    //const { draggedTask, targetTask, operation } = ReorderSchema.parse(payload);
    console.log('++++++++++++++++Payload recebido:', payload);
    const { draggedTask, targetTask, operation } = payload;
    console.log("============Dragged Item:", draggedTask);
    console.log("=======Target Item:", targetTask);
    console.log("====Operation:", operation);
    
    

    return await prisma.$transaction(async (tx) => {
      // 1. Update previous siblings (remove from old position)
      if (draggedTask.currentParent !== null) {
        await tx.task.updateMany({
          where: {
            parentId: draggedTask.currentParent,
            order: { gt: draggedTask.currentOrder }
          },
          data: { order: { decrement: 1 } }
        });
      }

      // 2. Calculate new order position
      let newOrder: number;
      const siblings = await tx.task.findMany({
        where: { parentId: operation.newParentId },
        orderBy: { order: 'asc' }
      });

      // Case 1: Adding to empty parent
      if (!targetTask) {
        newOrder = siblings.length > 0 ? siblings[siblings.length - 1].order + 1 : 0;
      }
      // Case 2: Position-based calculation
      else {
        const targetIndex = siblings.findIndex(t => t.id === targetTask.id);
        
        switch(operation.type) {
          case 'topSegment':
            newOrder = targetIndex > 0 ? siblings[targetIndex - 1].order + 1 : 0;
            break;
            
          case 'bottomSegment':
            newOrder = siblings[targetIndex].order + 1;
            break;
            
          case 'middleSegment':
            const children = await tx.task.findMany({
              where: { parentId: targetTask.id },
              orderBy: { order: 'asc' }
            });
            newOrder = children.length > 0 ? children[children.length - 1].order + 1 : 0;
            break;
            
          default:
            throw new Error('Invalid drop position');
        }
      }

      // 3. Create space for moved item
      await tx.task.updateMany({
        where: {
          parentId: operation.newParentId,
          order: { gte: newOrder }
        },
        data: { order: { increment: 1 } }
      });

      // 4. Update moved task
      await tx.task.update({
        where: { id: draggedTask.id },
        data: {
          parentId: operation.newParentId,
          order: newOrder
        }
      });

      return json({ 
        success: true, 
        newParent: operation.newParentId,
        newOrder
      });
    });

  } catch (error) {
    console.error('Reordering failed:', error);
    return json(
      { error: 'Reordering operation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
  };



export async function loader() {
  const tasks = await getTasks();
  const resources = await getResources();
  const usedResources = await getUsedResources();
  
  //return { tasks, resources };
  //console.log("Recursos encontrados:", resources); //devolve uma lista/array de recursos (dicts), com todos os campos id, resourceName, resourceRole
  //console.log("Recursos usados:", JSON.stringify(usedResources)); //devolve uma lista/array de recursos (dicts), com todos os campos id, resourceName, resourceRole

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
    //Resources: resources.map((resource: any) => resource.id) // Map resource IDs, mas aparece todos os recursos em cada tarefa, e é o que é passado para a API
    //Resources: resources.map((resource: any) => resource.id) //não achei esse campo na documentação ainda
    //Resources: task.taskResources    
    //Resources: resources.map((resource: any) => resource.resourceName)
    Resources: usedResources[index].taskResources.map((resource: any) => resource.taskResourceId)
  }));
  
  // Map resources to match the GanttComponent's resourceFields
  const formattedResources = resources.map((resource: any) => ({
    id: resource.id,
    resourceName: resource.resourceName,
    resourceRole: resource.resourceRole,
  }));
  //console.log("Recursos formatados:", formattedResources); //devolve uma lista/array de recursos (dicts), com todos os campos id, resourceName, resourceRole

  

  //console.log("tarefas FORMATADAS", tasksWithId);  
  //console.log("Recursos formatados:", formattedResources); //devolve uma lista/array de recursos (dicts), com todos os campos id, resourceName, resourceRole
return ({ tasks: tasksWithId, resources: formattedResources });
};