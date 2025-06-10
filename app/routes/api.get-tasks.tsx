// routes/api/get-tasks.tsx
import { json } from '@remix-run/node';
import { getTasks, getLastOrder, getResources, getUsedResources, getEvents } from "~/utils/tasks";

export async function loader() {
  // Obtenha as tarefas, recursos e eventos
  const tasks = await getTasks(); // Já vem com os recursos incluídos
  const resources = await getResources(); // Mantemos essa chamada caso precise dos recursos independentes
  const eventos = await getEvents(); // Se você precisar fazer mais manipulações com eventos, mantenha esta chamada
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
  //console.log("Recursos formatados:", formattedResources); //devolve uma lista/array de recursos (dicts), com todos os campos id, resourceName, resourceRole

  const formattedEventos = eventos.map(evento => ({
    Id: evento.id,
    Subject: evento.titulo,
    Description: evento.descricao,
    StartTime: new Date(evento.data_hora_inicio),
    EndTime: new Date(evento.data_hora_termino),
    IsAllDay: evento.dia_inteiro,        
    ObraId: evento.id_obra,  // campo personalizado para o código da obra
    entregue: evento.entregue,        
    entregue_em: evento.entregue_em,        
  }));  

  //return { tasks: tasksWithId, resources }; // Retorna as tarefas formatadas e a lista de recursos
  return ({ tasks: tasksWithId, resources: formattedResources, eventos: formattedEventos, x });
}