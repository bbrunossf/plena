import { data, json } from '@remix-run/node'
import type { ActionFunction, LoaderFunction } from '@remix-run/node'
import { getTasks, getResources, getLastOrder } from "~/utils/tasks";
import { prisma } from "~/db.server";

// export const action: ActionFunction = async ({ request, params }) => {
// //export async function action({ request }) {
//     try {
//       const data = await request.json();
//       const method = request.method; // Obtém o método HTTP
//       console.log("Método chamado:", method);
//       console.log("dados raw:", data);        
//       console.log("Método HTTP:", method);        
//       console.log("URL:", request.url); // detalhes da requisição

//       if (method === "POST") {
//         return Response.json({ answer: "nada a declarar POST" });
//       }      
//       else if (method === "PUT") {
//         return Response.json({ answer: "nada a declarar PUT" });
//       }
//       else if (method === "DELETE") {
//         return Response.json({ answer: "nada a declarar DELETE" });
//       }      
//   } catch (error) {
//     console.error("Erro!!!!!!:", error);
//     return data(
//       {
//         success: false,
//         error: error instanceof Error ? error.message : "Erro desconhecido"
//       },
//       { status: 500 }
//     );
//   }
// }

//função para tratar as requisições HTTP POST e PUT
export const action: ActionFunction = async ({ request }) => {
  try {
    //const tasks = await request.json();
    const { updatedData, deletedTasks } = await request.json(); // Destructure updated and deleted tasks

    const method = request.method; // Obtém o método HTTP
    console.log("Método chamado:", method);
    //console.log("dados raw:", tasks);        
    console.log("Método HTTP:", method);        
    console.log("URL:", request.url); // detalhes da requisição    
    //console.log("Dados recebidos (atualizados):", updatedData);
    //console.log("Dados recebidos (excluídos):", deletedTasks);

    const x = await getLastOrder()
    console.log("último order encontrado:", x);

    // Process deleted tasks
    for (const task of deletedTasks) {
      // Deletar associações de recursos antes de deletar a tarefa
      await prisma.taskResourceAssignment.deleteMany({
        where: { taskId: task.TaskID },
      });

      // Deletar a tarefa
      await prisma.task.delete({
        where: { id: task.TaskID },
      });
      console.log(`Tarefa excluída: ID ${task.TaskID}`);
    }
    
    // Processa cada tarefa para atualizar ou inserir no banco
    //for (const task of tasks) {
      for (const task of updatedData) {
      // await prisma.tasks.upsert({
      //   where: { id: task.TaskID },
      //   update: {
      //     taskName: task.taskName,
      //     startDate: new Date(task.StartDate),
      //     endDate: new Date(task.EndDate),
      //     duration: task.Duration,
      //     progress: task.Progress || 0,
      //     predecessor: task.Predecessor,
      //     parentId: task.parentId || undefined,
      //   },
      //   create: {
      //     id: task.TaskID,
      //     taskName: task.taskName,
      //     startDate: new Date(task.StartDate),
      //     endDate: new Date(task.EndDate),
      //     duration: task.Duration,
      //     progress: task.Progress || 0,
      //     predecessor: task.Predecessor,
      //     parentId: task.parentId || undefined,
      //   },
      // });
      // Criação ou atualização da tarefa na tabela 'tasks'
      console.log(">>>>>>>>>Dados recebidos, por tarefa:", task);
        const upsertedTask = await prisma.task.upsert({
          where: { id: task.TaskID },
          update: {
              taskName: task.taskName,
              startDate: new Date(task.StartDate),
              endDate: new Date(task.EndDate),
              duration: task.Duration,
              progress: task.Progress || 0,
              predecessor: task.Predecessor,
              parentId: task.parentId !== null ? task.parentId.toString() : null,
              //taskResources: task.Resources.id, //com Resources deu certo, apareceu o recurso inteiro na tarefa
              notes: task.notes,
          },
          create: {
              taskName: task.taskName,
              startDate: new Date(task.StartDate),
              endDate: new Date(task.EndDate),
              duration: task.Duration,
              progress: task.Progress || 0,
              predecessor: task.Predecessor,
              parentId: task.parentId !== null ? task.parentId.toString() : null,
              //taskResources: task.Resources.id, //com Resources deu certo, apareceu o recurso inteiro na tarefa na hora de inserir, 
              //mas aparece tudo em dict, e não só o id do recurso
              notes: task.notes,
          },
  });
      // Atualizar associações de recursos
      console.log(`Atualizando associações de recursos para a tarefa ID ${upsertedTask.id}`);

      // Remover associações existentes
      await prisma.taskResourceAssignment.deleteMany({
        where: { taskId: upsertedTask.id },
      });

      // //check task.Resources type and content
      // console.log("task.Resources:", task.Resources);
      // //convert task.Resources to an array if it's not already
      // const resourcesArray = Array.isArray(task.Resources) ? task.Resources : [task.Resources];
      // console.log("resourcesArray:", resourcesArray);

      // Inserir novas associações, somente se task.Resources não estiver vazio
      if (task.Resources && task.Resources.length > 0) {
        for (const resourceId of task.Resources) {
          console.log(`Associando recurso ID ${resourceId} à tarefa ID ${upsertedTask.id}`);
          console.log("Recursos:", task.Resources);
          await prisma.taskResourceAssignment.create({
            data: {
              taskId: upsertedTask.id,
              taskResourceId: parseInt(resourceId.id),
            },
          });
        }
    }
  }
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
      