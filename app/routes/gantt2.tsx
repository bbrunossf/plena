//na caixa de seleção do 'isPaused', falta corrigir a lógica para atualizar no banco de dados

import { registerLicense } from '@syncfusion/ej2-base';
registerLicense("ORg4AjUWIQA/Gnt2XVhhQlJHfV5AQmBIYVp/TGpJfl96cVxMZVVBJAtUQF1hTH5Wd0xjX31Xc31cQ2hbWkZ+");

import { useLoaderData } from '@remix-run/react'
import { useRef, useEffect } from 'react';

import '~/custom.css';

import '@syncfusion/ej2-base/styles/material.css';
import '@syncfusion/ej2-buttons/styles/material.css';
import '@syncfusion/ej2-calendars/styles/material.css';
import '@syncfusion/ej2-dropdowns/styles/material.css';
import '@syncfusion/ej2-gantt/styles/material.css';
import '@syncfusion/ej2-grids/styles/material.css';
import '@syncfusion/ej2-inputs/styles/material.css';
import '@syncfusion/ej2-layouts/styles/material.css';
import '@syncfusion/ej2-lists/styles/material.css';
import '@syncfusion/ej2-navigations/styles/material.css';
import '@syncfusion/ej2-popups/styles/material.css';
import '@syncfusion/ej2-splitbuttons/styles/material.css';
import '@syncfusion/ej2-treegrid/styles/material.css';
import '@syncfusion/ej2-react-schedule/styles/material.css';
import '@syncfusion/ej2-react-grids/styles/material.css';

import '@syncfusion/ej2-richtexteditor/styles/material.css';

import { GanttComponent } from '@syncfusion/ej2-react-gantt'
//import { DataManager, WebApiAdaptor } from '@syncfusion/ej2-data'
import { ColumnsDirective, ColumnDirective, Inject, Selection, AddDialogFieldsDirective, AddDialogFieldDirective, EditDialogFieldsDirective, EditDialogFieldDirective, RowDD, ZoomTimelineSettings, UndoRedo } from '@syncfusion/ej2-react-gantt';
import { Edit, Toolbar, ToolbarItem } from '@syncfusion/ej2-react-gantt';
import { DayMarkers, ContextMenu, Reorder, ColumnMenu, Filter, Sort } from '@syncfusion/ej2-react-gantt';
import { DropDownList } from '@syncfusion/ej2-react-dropdowns';

import { getTasks, getLastOrder, getResources, getUsedResources, getEvents } from "~/utils/tasks";
import { PropertyPane } from '~/utils/propertyPane';
//import { DropDownListComponent } from '@syncfusion/ej2-react-dropdowns';


// import { 
//   ScheduleComponent, 
//   Day,  
//   Month,
//   Week,
//   Agenda,   
//   DragAndDrop,
//   Resize,
//   ViewsDirective,
//   ViewDirective,  
//   TimelineViews, TimelineMonth,
//   ResourcesDirective, ResourceDirective, EventRenderedArgs, renderCell, CellTemplateArgs  
// } from '@syncfusion/ej2-react-schedule';

import {
  ChartComponent,
  SeriesCollectionDirective,
  SeriesDirective,
  ColumnSeries,
  Legend,
  Tooltip,
  Category,  
} from '@syncfusion/ej2-react-charts';



import { useState } from 'react';
import { useFetcher } from "@remix-run/react";
import { TreeViewComponent, NodeSelectEventArgs } from '@syncfusion/ej2-react-navigations';

//import { c } from "node_modules/vite/dist/node/types.d-aGj9QkWt";
//import { TbRuler3 } from 'react-icons/tb';


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
    isPaused: task.isPaused , //adicionar no banco de dados
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


//função para o grafico de horas por recurso
function agruparHorasPorRecurso(tasks: any[], resources: any[]) {
  const hoje = new Date();
  const semanas = [0, 1, 2, 3].map((i) => {
    const inicio = new Date(hoje);
    inicio.setDate(hoje.getDate() + i * 7);
    const fim = new Date(inicio);
    fim.setDate(inicio.getDate() + 6);
    return { inicio, fim };
  });

  const cargaPorRecurso: Record<string, number[]> = {};

  resources.forEach((recurso) => {       
    cargaPorRecurso[recurso.id] = [0, 0, 0, 0]; //representa as 4 semanas    
  });

  for (const tarefa of tasks) {
    const inicioTarefa = new Date(tarefa.StartDate);
    const fimTarefa = new Date(tarefa.EndDate);
    const duracao = Number(tarefa.Duration) || 0;
    const recursos = tarefa.Resources || [];

    // Distribui a duração da tarefa proporcionalmente entre as semanas em que ela ocorre
    semanas.forEach((semana, index) => {
      const intersecaoInicio = new Date(Math.max(inicioTarefa.getTime(), semana.inicio.getTime()));
      const intersecaoFim = new Date(Math.min(fimTarefa.getTime(), semana.fim.getTime()));

      if (intersecaoInicio <= intersecaoFim) {
        const diasNaSemana = (intersecaoFim.getTime() - intersecaoInicio.getTime()) / (1000 * 60 * 60 * 24) + 1;
        const diasTotais = (fimTarefa.getTime() - inicioTarefa.getTime()) / (1000 * 60 * 60 * 24) + 1;
        const proporcao = diasNaSemana / diasTotais;
        const cargaParcial = proporcao * duracao;

        // for (const recursoId of recursos) {
        //   cargaPorRecurso[recursoId][index] += cargaParcial;
        // }
        for (const recursoId of recursos) {
          //console.log("recursoId:", recursoId);
          if (cargaPorRecurso[recursoId.id]) {
            cargaPorRecurso[recursoId.id][index] += cargaParcial;
          } else {
            console.warn(`Recurso com ID ${recursoId} não encontrado na lista de recursos.`);
          }
        }
      }
    });
  }

  // Formata os dados para o ChartComponent
  const resultado = resources.map((recurso) => {
    const [sem1, sem2, sem3, sem4] = cargaPorRecurso[recurso.id];
    return {
      recurso: recurso.resourceName,
      semana1: sem1,
      semana2: sem2,
      semana3: sem3,
      semana4: sem4,
    };
  });

  return resultado;
}



export default function GanttRoute() {  
  const ganttRef = useRef<GanttComponent>(null);  
  const {tasks, resources, eventos, x} = useLoaderData<typeof loader>();
  //console.log("tasks:", tasks);
  
  const [isLoading, setIsLoading] = useState(false); // Estado para controle do spinner
  const [showPasteModal, setShowPasteModal] = useState(false); // Estado para controlar o modal
  const [pasteData, setPasteData] = useState(''); // Estado para armazenar os dados colados  
  const [selectedResource, setSelectedResource] = useState(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [updatedTasks, setUpdatedTasks] = useState<any[]>([]);  

 // Função para atualizar o gráfico de colunas com os dados do Gantt
 const handleUpdateChart = () => {
  if (ganttRef.current) {
    const ganttInstance = ganttRef.current;
    const updatedData = ganttInstance?.dataSource; // Obtendo os dados atuais do Gantt
    //console.log("Dados do Gantt atualizados:", updatedData);
    
    // Usar a função agruparHorasPorRecurso para processar os dados corretamente
    const newChartData = agruparHorasPorRecurso(updatedData, resources);
    
    // Atualiza o estado do gráfico
    setChartData(newChartData);
    
    // Se quiser verificar os dados, use setTimeout para garantir que o estado foi atualizado
    setTimeout(() => {
      console.log("Dados do gráfico atualizados:", chartData);
    }, 0);
  }  
};
  

const deletedTasks: any[] = []; // lista para salvar as tarefas excluídas

//função para o botão de salvar
const handleSaveButton = async () => {
    setIsLoading(true); // Ativa o spinner
    try {
        const ganttInstance = ganttRef.current;
        //const updatedData = ganttInstance?.dataSource;        
        const rawData = ganttInstance?.dataSource;
        const updatedData = flattenTasks(rawData);


        //console.log('Dados para salvar:', updatedData);
        //console.log('Tarefas excluídas:', deletedTasks);

        //salva os dados na sessionStorage
        sessionStorage.setItem('tasks', JSON.stringify(updatedData));
        //alert("Dados salvos com sucesso!"); // Exibe mensagem de sucesso

        //setTimeout(async () => {
            const response = await fetch("/api/save-tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ updatedData, deletedTasks, x }), // Send both updated and deleted tasks
            });
        //}, 500); // Espera 500ms para garantir que o GanttComponent tenha atualizado os dados
        
        console.log("tentando atualizar o GanttComponent após salvar");
        
        // Aguarda um pequeno tempo e busca os dados atualizados do backend
        setTimeout(async () => {
            const response2 = await fetch("/api/save-tasks");
            const result = await response2.json();

            // Atualiza o GanttComponent com os novos dados
            if (ganttInstance && result?.tasks) {
            console.log("Dados atualizados do GanttComponent:", result.tasks);
            ganttInstance.dataSource = result.tasks;
            ganttInstance.refresh(); // ou ganttInstance.refreshDataSource();
            }
        }, 500); // Espera 500ms para garantir que o GanttComponent tenha atualizado os dados
        

    } catch (error) {
        console.error("Erro ao salvar os dados:", error);
    } finally {
        setIsLoading(false); // Desativa o spinner
    }
};

  // Função para lidar com a seleção de um recurso
  const onResourceSelected = (args: NodeSelectEventArgs) => {
    console.log(args);    
    const action = args.action; // 'select' ou 'unselect'

    if (action === 'select') {
      const selectedResource = args.nodeData.text;
      console.log("Recurso selecionado:", selectedResource);
      if (ganttRef.current) {
        ganttRef.current.filterByColumn(
          'Resources', // Campo a ser filtrado
          'equal', // Operador
          selectedResource // Valor
        );
      }
    } else if (action === 'un-select') {
      if (ganttRef.current) {
        ganttRef.current.clearFiltering(); // Remove todos os filtros
      }
    }    
  };

  function flattenTasks(tasks: any[], parentId: number | null = null, seenIds = new Set()): any[] {
  let flatList: any[] = [];

  for (const task of tasks) {
    // Evita tarefas duplicadas com base no TaskID
    if (seenIds.has(task.TaskID)) continue;
    seenIds.add(task.TaskID);

    const { Children, ...rest } = task;

    flatList.push({
      ...rest,
      parentId: parentId ?? task.parentId ?? null, // prioridade: contexto > campo da própria tarefa
      isPaused: task.isPaused ?? false,
    });

    if (Array.isArray(Children) && Children.length > 0) {
      const childTasks = flattenTasks(Children, task.TaskID, seenIds);
      flatList = flatList.concat(childTasks);
    }
  }

  return flatList;
}


  //para exibir a resposta do componente após uma ação
  const handleActionComplete = async (args: any) => {
    console.log("ActionComplete acionada"); //args só vem os registros alterados/afetados

    //checar quando uma tarefa é adicionada entre duas tarefas existentes
    //console.log("args da ação de inserir tarefa:", args);
    
    const ganttInstance = ganttRef.current;
    const newData = ganttInstance?.dataSource;   
    console.log("Dados atualizados", newData); 
    
    // Ordena com base no campo 'order'
    // Verifica se é inserção de tarefa via Gantt (não colagem)
    if ((args.requestType === 'save' || args.requestType === 'add')) {
        const hasNewTasksWithoutOrder = newData.some(task => task.order === undefined || task.order === null);

        if (hasNewTasksWithoutOrder) {
        // Ordena tarefas existentes por 'order', undefined vai para o fim
        const orderedTasks = [...newData].sort((a, b) => {
            const aOrder = a.order ?? Infinity;
            const bOrder = b.order ?? Infinity;
            return aOrder - bOrder;
        });

        // Atualiza o campo 'order' sequencialmente
        let currentOrder = 0;
        for (let i = 0; i < orderedTasks.length; i++) {
            const task = orderedTasks[i];

            if (task.order === undefined || task.order === null) {
            currentOrder += 1;
            task.order = currentOrder;
            } else {
            currentOrder = task.order;
            }

            // Garante unicidade dos próximos
            if (i < orderedTasks.length - 1) {
            const nextTask = orderedTasks[i + 1];
            if (nextTask.order !== undefined && nextTask.order <= task.order) {
                nextTask.order = task.order + 1;
            }
            }
        }

        // Atualiza o GanttComponent e o estado local
        if (ganttInstance) {
            ganttInstance.dataSource = orderedTasks;
            ganttInstance.refresh(); // ou refreshDataSource()
        }

        setUpdatedTasks(orderedTasks);
        }
    }

    if (args.action === 'TaskbarEditing') {
      console.log("TaskbarEditing acionada");        
      setUpdatedTasks(newData); // Atualiza o estado com os novos dados      
    }    
    if (args.requestType === 'delete') {
      deletedTasks.push(...args.data); // Add deleted tasks to the array
      //console.log('Tarefas excluídas:', deletedTasks);
    } 
    if (args.requestType === 'rowDropped') {      
      console.log('rowDropped ACIONADO============:', args.fromIndex);
    }       
  }  

//   //map all resources from 'resources' object and list its id and resourceName
//   const resourceData: { [key: string]: Object }[] = resources.map((resource: any) => ({
//     id: resource.id,
//     text: resource.resourceName
//   }));
  
  const processPastedData = (data: string) => {
    const rows = data.split('\n');
    let currentOrder = x.order || 0; // <- Ponto de partida correto

    rows.forEach((row) => {
      currentOrder += 1; // <- Incrementa o order a cada nova tarefa
      if (row.trim() !== '') {
        const newTask = {
          //TaskID: tasks.length + 1, //TaskID é gerado automaticamente pelo Gantt
          taskName: row.trim(),
          StartDate: new Date(), //para o Gantt, sempre objetos Date
          // Set EndDate as one day after StartDate. Não pode usar StartDate como variável
          EndDate: new Date(new Date().getTime() + 24 * 60 * 60 * 1000), //para o Gantt, sempre objetos Date          
          Duration: 1,
          Progress: 0,         
          order: currentOrder, // <- Valor único e sequencial
        };
        ganttRef.current?.addRecord(newTask);
      }
    });
  };

  // Função para abrir o modal de colagem
  const handleOpenPasteModal = () => {
    setShowPasteModal(true);
  };

  // Função para fechar o modal e processar os dados colados
  const handlePasteSubmit = () => {
    processPastedData(pasteData);
    setShowPasteModal(false);
    setPasteData('');
  };

  // Função para cancelar o modal
  const handlePasteCancel = () => {
    setShowPasteModal(false);
    setPasteData('');
  };

  // Botão customizado para a toolbar
  // toolbar={['Add', 'Edit', 'Update', 'Delete', 'Cancel', 'Indent', 'Outdent', 
            //   'ZoomIn', 'ZoomOut', 'ExpandAll', 'CollapseAll']}
  const customToolbarItems: any[] = [
    'Edit', 'Update', 'Delete', 'Cancel', 'Indent', 'Outdent', 
    'ZoomIn', 'ZoomOut', 'ZoomToFit', 'Undo', 'Redo',
    { text: 'Colar Tarefas', tooltipText: 'Colar Tarefas', id: 'pasteTasks' },
  ];

  // Função para lidar com cliques na toolbar
  const handleToolbarClick = (args: any) => {
    if (args.item.id === 'pasteTasks') {
      handleOpenPasteModal();
    }
  }
  
  const taskFields={
    id: 'TaskID',
    name: 'taskName', //tem que ser name!
    startDate: 'StartDate',
    endDate: 'EndDate',
    duration: 'Duration',
    progress: 'Progress',
    parentID: 'parentId', //esse é a relação para dados flat 
    notes: 'notes',          
    resourceInfo: 'Resources', //resourceInfo precisa ter para aparecer na caixa de diálogo, senão nem aparece. 
    //resourceInfo:'Resources' aparece todos os recursos selecionados para a tarefa
    //resourceInfo: 'resource' aparece os recursos selecionados para a tarefa, mas nenhum selecionado ?
    //parece que tem ser o mesmo  valor colocado em ColumnDirective (mas eu não coloquei)
    //child: 'subtasks', //Não se usa o child, pois os dados são planos (flat)          
    dependency: 'Predecessor', //tem que ser 'dependency'; o da direita é o nome do campo no GanttComponent   
    isPaused: 'isPaused' 
  }

  const NotesAditionalParams={
    
  }
  
  function queryTaskbarInfo(args) {
    //function to check if the task is a summary task    
    if (args.data.hasChildRecords)
      {  
        args.rowElement.style.backgroundColor = 'lightblue';  
        args.taskbarBgColor = "gray"; 
      }

    if(args.data.Resources === 'Leonardo'){
        args.taskbarBgColor = '#DFECFF';
        args.progressBarBgColor = '#006AA6'
    }else if(args.data.Resources === 'Dayana'){
        args.taskbarBgColor = '#E4E4E7';
        args.progressBarBgColor = '#766B7C'
    }
    else if(args.data.Resources === 'Thadeu'){
        args.taskbarBgColor = '#DFFFE2';
        args.progressBarBgColor = '#00A653'
    }
    else if(args.data.Resources === 'Eduardo'){
        args.taskbarBgColor = '#FFEBE9';
        args.progressBarBgColor = '#FF3740'
    }
    else if(args.data.Resources === 'Bruno'){
      args.taskbarBgColor = '#F0E5FF';
      args.progressBarBgColor = '#8A4FFF'
    }
    else if(args.data.Resources === 'Carol'){
    args.taskbarBgColor = '#FFF0E5';
    args.progressBarBgColor = '#FF6B35'
    }
    if (args.data.isPaused) {
      args.taskbarBgColor = '#FFF3CD'; // amarelo claro
      args.progressBarBgColor = '#FFA500'; // laranja
    }
  //add a simple color if none of the above. Tenho que tirar senão sobrescreve a regra da tarefa resumo
  // else{
  // args.taskbarBgColor = '#E4E4E7';
  // args.progressBarBgColor = '#766B7C'
  // }

  }

  const rowDataBound = (args) => {
    // novamente verificando se a tarefa é do tipo resumo, ou seja, se ela tem tarefas filhas
    if (args.data.hasChildRecords) {
      args.row.style.fontWeight = 'bold'; // Define o texto em negrito
    }
    // Verifica se a tarefa é uma tarefa filha (tem um parentId)
    else if (args.data.parentId) {
      args.row.style.fontStyle = 'italic'; // Define o texto em itálico
    }
    else if (args.data.isPaused) {
      args.row.style.color = '#ff0000'; // texto vermelho, não funciona
      //args.row.style.fontStyle = 'italic';    
      args.row.style.fontColor = '#ff0000'; // texto vermelho, não funciona
      args.row.style.backgroundColor = '#FFF3CD'; // amarelo claro
    }
  
  };

  const labelSettings = {
    rightLabel: 'Resources'
};


//cores em função do recurso associado à tarefa
const resColumnTemplate = (props) => {
  if (props.ganttProperties.resourceNames) {
    if (props.ganttProperties.resourceNames === 'Leonardo') {
      return (
        <div style={{ width:'140px', height:'24px', borderRadius:'100px', backgroundColor:'#DFECFF', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <span style={{ color: '#006AA6', fontWeight: 500 }}>{props.ganttProperties.resourceNames}</span>
        </div>
      );
    }

    if (props.ganttProperties.resourceNames === 'Dayana') {
      return (
        <div style={{ width:'140px', height:'24px', borderRadius:'100px', backgroundColor:'#E4E4E7', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <span style={{ color: '#766B7C', fontWeight: 500 }}>{props.ganttProperties.resourceNames}</span>
        </div>
      );
    }

    if (props.ganttProperties.resourceNames === 'Thadeu') {
      return (
        <div style={{ width:'140px', height:'24px', borderRadius:'100px', backgroundColor:'#DFFFE2', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <span style={{ color: '#00A653', fontWeight: 500 }}>{props.ganttProperties.resourceNames}</span>
        </div>
      );
    }

    if (props.ganttProperties.resourceNames === 'Eduardo') {
      return (
        <div style={{ width:'140px', height:'24px', borderRadius:'100px', backgroundColor:'#FFEBE9', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <span style={{ color: '#FF3740', fontWeight: 500 }}>{props.ganttProperties.resourceNames}</span>
        </div>
      );
    }

    if (props.ganttProperties.resourceNames === 'Bruno') {
      return (
        <div style={{ width:'140px', height:'24px', borderRadius:'100px', backgroundColor:'#F0E5FF', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <span style={{ color: '#8A4FFF', fontWeight: 500 }}>{props.ganttProperties.resourceNames}</span>
        </div>
      );
    }

    if (props.ganttProperties.resourceNames === 'Carol') {
      return (
        <div style={{ width:'140px', height:'24px', borderRadius:'100px', backgroundColor:'#FFF0E5', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <span style={{ color: '#FF6B35', fontWeight: 500 }}>{props.ganttProperties.resourceNames}</span>
        </div>
      );
    }
    //add when none  of the above
    else{
      return (
        <div style={{ width:'140px', height:'24px', borderRadius:'100px', backgroundColor:'#E4E4E7', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <span style={{ color: '#766B7C', fontWeight: 500 }}>{props.ganttProperties.resourceNames}</span>
        </div>
      );

   
  // else {
  //   return <div></div>
   }
 } 
}

const template = resColumnTemplate.bind(this);

// const rowDrop = async (args: any) => {
//   console.log(args);  

//   // Verifica se há valor em taskData ou se a tarefa foi arrastada para a posição 'middleSegment'
//   if (!args.data || !args.data[0] || !args.data[0].taskData || args.dropPosition === 'middleSegment') {
//     console.warn('Nenhum dado de tarefa encontrado ou Drop na posição MiddleSegment. A ação de drop não será executada.');
//     args.cancel = true;
//     const ganttInstance = ganttRef.current;
//     if (ganttInstance) {
//       ganttInstance.refresh();
//     }
//     return; // Interrompe a execução se não houver dados
//   }
//   if (args.dropPosition != "middleSegment") {
//    const dragidMapping = args.data[0].taskData.TaskID;// Obter o ID da tarefa arrastada    
//    const dropidMapping = args.dropRecord?.taskData?.TaskID || null; // Obter o ID da tarefa de destino // Pode ser null se for root
   
//    const payload = {
//     dragidMapping: dragidMapping,
//     dropidMapping: dropidMapping,
//     dragorderMapping: args.data[0].taskData.order,
//     droporderMapping: args.dropRecord?.taskData.order || null,
//     position: args.dropPosition
//   };

//   console.log('==========================Payload Enviado:', JSON.stringify(payload, null, 2));
//   // Enviar para a API
//   const response = await fetch("/api/task-reorder", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(payload),   
//   });
// };
// }
const rowDrop = async (args: any) => {
  console.log('rowDrop event:', args);  

  // Verifica se é realmente uma operação de reordenação de linhas
  // e não outras operações de drag and drop
  if (!args.data || !Array.isArray(args.data) || args.data.length === 0) {
    console.warn('Nenhum dado de tarefa encontrado para reordenação.');
    return; // Não cancela, apenas retorna
  }

  // Verifica se há taskData válido
  const taskData = args.data[0]?.taskData;
  if (!taskData) {
    console.warn('TaskData não encontrado.');
    return; // Não cancela, apenas retorna
  }

  // Só processa se for uma operação de reordenação válida
  // middleSegment indica que está sendo arrastado para dentro de outra tarefa (hierarquia)
  if (args.dropPosition === 'middleSegment') {
    console.log('Drop em middleSegment - operação de hierarquia permitida');
    return; // Permite a operação, não interfere
  }

  // Verifica se é uma operação de reordenação entre tarefas do mesmo nível
  if (args.dropPosition === 'topSegment' || args.dropPosition === 'bottomSegment') {
    console.log('Processando reordenação de tarefas...');
    
    const dragidMapping = taskData.TaskID;
    const dropidMapping = args.dropRecord?.taskData?.TaskID || null;
    
    const payload = {
      dragidMapping: dragidMapping,
      dropidMapping: dropidMapping,
      dragorderMapping: taskData.order,
      droporderMapping: args.dropRecord?.taskData?.order || null,
      position: args.dropPosition
    };

    console.log('Payload para reordenação:', JSON.stringify(payload, null, 2));
    
    try {
      const response = await fetch("/api/task-reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),   
      });
      
      if (!response.ok) {
        console.error('Erro na API de reordenação:', response.statusText);
      }
    } catch (error) {
      console.error('Erro ao executar reordenação:', error);
    }
  }
  
  // Remove o refresh desnecessário que estava causando interferência
  // O GanttComponent já gerencia suas próprias atualizações
};

//niveis de zoom com o scroll do mouse
let customZoomingLevels: ZoomTimelineSettings[] =  [{
  topTier: { unit: 'Month', format: 'MMM, yyyy', count: 1 },
                bottomTier: { unit: 'Week', format: 'dd MMM', count: 1 }, timelineUnitSize: 66, level: 0,
                timelineViewMode: 'Month', weekStartDay: 0, updateTimescaleView: true, showTooltip: true
}];
function dataBound() {
  const ganttInstance = ganttRef.current;
  ganttInstance.zoomingLevels = customZoomingLevels;
};

//let isPausedDropDownObj = null;

// const handleActionBegin = (args) => {
//   if (args.requestType === 'openEditDialog') {
//     const dialogElement = args.dialog && args.dialog.dialogContent;
//     const rowData = args.rowData;

//     if (!dialogElement) {
//       console.warn('Elemento do diálogo não disponível.');
//       return;
//     }

//     // Evita duplicação ao editar várias vezes
//     if (dialogElement.querySelector('[data-field="isPaused"]')) return;

//     // Cria container do campo
//     const container = document.createElement('div');
//     container.className = 'e-field';
//     container.setAttribute('data-field', 'isPaused');
//     container.style.marginTop = '12px';

//     const label = document.createElement('label');
//     label.innerText = 'Paralisada';
//     label.style.display = 'block';
//     label.style.marginBottom = '4px';

//     const input = document.createElement('input');
//     input.id = 'isPausedDropDown';

//     container.appendChild(label);
//     container.appendChild(input);
//     dialogElement.appendChild(container);

//     const dropDown = new DropDownList({
//       dataSource: [
//         { text: 'Sim', value: true },
//         { text: 'Não', value: false }
//       ],
//       fields: { text: 'text', value: 'value' },
//       value: rowData.isPaused ?? false,
//       change: (e) => {
//         rowData.isPaused = e.value;
//       },
//       placeholder: 'Paralisada?',
//       floatLabelType: 'Always',
//       width: '100%'
//     });

//     dropDown.appendTo(input);
//   }
// };






// incluir variável para receber os eventos da Agenda e mostrar no PropertyPane
  

  return (
    //<div className='flex flex-col'> {/* Container pai para empilhar verticalmente */}
    <div className='flex flex-col w-full max-w-screen-2xl mx-auto overflow-hidden'> {/* Container pai para a linha principal */}

      {/* <div className='w-3/4 pr-4'>  Coluna 1: Gantt (ocupa 3/4 da largura) */}
      <div className='w-full pr-4'>
      {isLoading && <div className="spinner">Carregando...</div>} {/* Exibição do spinner em cima do grafico de gantt*/}
        {/* <div className='flex'>  Container para Gantt e Botão */}
        {/*  <div className='w-3/4'>  GanttComponent ocupa 3/4 da largura */}    
        <GanttComponent
          ref={ganttRef}
          id='Default'
          queryTaskbarInfo= {queryTaskbarInfo}
          rowDataBound={rowDataBound}
          dataBound = {dataBound} 
          dataSource={tasks} //com os campos mapeados
          //dataSource={filteredTasks} // Usando a lista de tarefas filtradas
          resources={resources} //relaciona aqui os recursos que aparecem no campo de recursos do ganttcomponent, senão fica vazio
          actionComplete={handleActionComplete}
          rowDrop={rowDrop}
          allowFiltering={true} //Filter deve ser injetado
          enableImmutableMode = {false}
          enableCriticalPath={true}
          enableUndoRedo={true}
          //actionBegin={handleActionBegin}

          resourceIDMapping='id'
          //viewType='ResourceView' //fica muito feio, agrupado por recursos

          labelSettings = {labelSettings }

          //resourceFields: define o mapa de campos para os recursos
          resourceFields={{
            id: 'id',
            name: 'resourceName',
            group: 'resourceRole',
            //não tenho um campo para Unit na tabela no banco de dados
          }}

          dateFormat="dd/MM/yyyy" //se aplica a todos os campos de data

          //show only 3 columns
          splitterSettings={{
            columnIndex: 4,
          }}
          //treeColumnIndex={1}
          //projectStartDate={new Date(2025,1,1)}
          //projectEndDate={new Date(2025,8,30)}        
          
          //taskFields: define o mapa de campos para as tarefas
          taskFields={taskFields}

          allowSelection={true}
          allowSorting={true} //classificar/ordenar as LINHAS ao clicar nos cabeçalhos das COLUNAS
          allowResizing={true} //redimensionar as COLUNAS
          allowReordering={true} //reordenar as COLUNAS
          allowRowDragAndDrop={true} //arrastar e soltar LINHAS
          allowTaskbarDragAndDrop={true} //arrastar e soltar TAREFAS
          enableContextMenu={true}

          //editSettings são relacionadas a alterações nas tarefas
          editSettings={{
            allowAdding: true,
            allowEditing: true,
            allowDeleting: true,
            //habilitar a caixa de confirmação para excluir
            showDeleteConfirmDialog: true,
            allowTaskbarEditing: true,
            newRowPosition: 'Below', //abaixo da linha selecionada
            mode: 'Dialog', //'Auto', 'Dialog'
          }}

          toolbar={customToolbarItems} 
          toolbarClick={handleToolbarClick}

          //toolbar={['Add', 'Edit', 'Update', 'Delete', 'Cancel', 'Indent', 'Outdent']}
          height="700px"
        >
          {/* campos a serem exibidos na caixa de diálogo de Adicionar. Se não declarar aqui, e não tiver campo para tal, não aparece.
      Se não for especificado, os campos derivam dos valores de 'taskSettings' e 'columns'*/}
          <AddDialogFieldsDirective>            
            <AddDialogFieldDirective type='General' headerText='General' ></AddDialogFieldDirective>
            <AddDialogFieldDirective type='Dependency'></AddDialogFieldDirective>
            <AddDialogFieldDirective type='Resources'></AddDialogFieldDirective> {/* ainda não tenho coluna para o 'Resources', então não aparece, mesmo colocando aqui */}
            <AddDialogFieldDirective type='Notes'></AddDialogFieldDirective>            
          </AddDialogFieldsDirective>

          <EditDialogFieldsDirective>
              <EditDialogFieldDirective type='General' headerText='General' fields={['TaskID', 'TaskName', 'StartDate', 'EndDate', 'Duration', 'isPaused']}></EditDialogFieldDirective>
              <EditDialogFieldDirective type='Dependency'></EditDialogFieldDirective>
              <EditDialogFieldDirective type='Resources'></EditDialogFieldDirective>
              <EditDialogFieldDirective type='Notes'></EditDialogFieldDirective>                 
          </EditDialogFieldsDirective>

        {/* Só aparecem as colunas que forem definidas aqui*/}
          <ColumnsDirective>
            < ColumnDirective field= 'TaskID'  headerText= 'TaskID'  width= '120' > </ColumnDirective> {/* tem que ter, senão ele não reconhece nenhum campo como chave primária */}
            < ColumnDirective field= 'taskName' headerText="Nome Tarefa"  width= '270' > </ColumnDirective>
            < ColumnDirective field= 'Resources'  headerText= 'Recurso'  width= '175' template= {template} > </ColumnDirective>
            < ColumnDirective field= 'StartDate' headerText='Início' width= '150' > </ColumnDirective>
            < ColumnDirective field= 'EndDate' headerText='Término' width= '150' > </ColumnDirective>
            < ColumnDirective field= 'Duration' width= '150' > </ColumnDirective>
            < ColumnDirective field= 'Progress' width= '150' > </ColumnDirective>
            <ColumnDirective  field= 'isPaused' headerText='Paralisada' width='150' editType='dropdownedit'
            edit={{
              params: {
                dataSource: [
                  { text: 'Sim', value: true },
                  { text: 'Não', value: false }
                ],
                fields: { text: 'text', value: 'value' }
              }
            }}> </ColumnDirective>
          </ColumnsDirective>

          <Inject services={[Selection, Edit, Toolbar, DayMarkers, ContextMenu, Reorder, ColumnMenu, Filter, Sort, RowDD, UndoRedo]} />
        </GanttComponent>
      </div>

      {/* Modal para colar tarefas */}
    {showPasteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded">
            <textarea
              value={pasteData}
              onChange={(e) => setPasteData(e.target.value)}
              placeholder="Cole os nomes das tarefas aqui (um por linha)..."
              className="w-full h-24 border p-2"
            />
            <button onClick={handlePasteSubmit} className="bg-blue-500 text-white p-2 rounded mt-2">
              Adicionar Tarefas
            </button>
            <button onClick={handlePasteCancel} className="bg-gray-500 text-white p-2 rounded mt-2 ml-2">
              Cancelar
            </button>
          </div>
        </div>
      )}          

      {/* <div className='w-1/4'>  Agenda ocupa 1/4 da largura */}
      {/* <div className='w-1/4 flex flex-col'>  Coluna 2: Schedule, PropertyPane e Botão (ocupa 1/4 da largura, dispostos em coluna, ou seja, um abaixo do outro) */}
      {/* <div className='w-full'> */}
      <div className='w-full mt-4 pr-4'>
        
      <button onClick={handleUpdateChart} className="bg-blue-100 text-white p-2 rounded">
        Atualizar Gráfico
      </button>

        <button onClick={handleSaveButton} className="bg-blue-500 text-white p-2 rounded">
          Salvar Alterações
          </button>

        {/* PropertyPane, debaixo da Agenda, dentro da mesma coluna 2, mais o botão embaixo */}  
         <PropertyPane title='Recursos'>
          <TreeViewComponent 
            id="resourceTree"
            fields={{
              dataSource: resources,
              id: 'id',
              text: 'resourceName',
              child: 'children'
            }}
            //sortOrder="Ascending"
            cssClass="resource-tree"
            allowMultiSelection={true}
            nodeSelected={onResourceSelected} // Adicionando o manipulador de seleção do recurso            
          />
        </PropertyPane> 
          
          {/* <button onClick={() => setSelectedResource(null)} className="bg-blue-800 text-white p-2 rounded">
          Deselecionar recursos
          </button> */}
          
    {chartData.length > 0 && (
      <ChartComponent
        id="resource-load-chart"
        primaryXAxis={{ valueType: 'Category', title: 'Recurso' }}
        primaryYAxis={{ title: 'Horas (por semana)' }}
        legendSettings={{ visible: true }}
        tooltip={{ enable: true }}
      >
        <Inject services={[ColumnSeries, Legend, Tooltip, Category]} />
        <SeriesCollectionDirective>
          <SeriesDirective
            dataSource={chartData}
            xName="recurso"
            yName="semana1"
            name="Semana 1"
            type="Column"
          />
          <SeriesDirective
            dataSource={chartData}
            xName="recurso"
            yName="semana2"
            name="Semana 2"
            type="Column"
          />
          <SeriesDirective
            dataSource={chartData}
            xName="recurso"
            yName="semana3"
            name="Semana 3"
            type="Column"
          />
          <SeriesDirective
            dataSource={chartData}
            xName="recurso"
            yName="semana4"
            name="Semana 4"
            type="Column"
          />
        </SeriesCollectionDirective>
      </ChartComponent>
    )}        

      </div>
    
  </div>
  )
}