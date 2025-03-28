//import { registerLicense } from '@syncfusion/ej2-base';
//registerLicense('Ngo9BigBOggjHTQxAR8/V1NMaF1cXGJCf1FpRmJGdld5fUVHYVZUTXxaS00DNHVRdkdmWXxfdHVQQmZfV0J+X0U=');

import type { MetaFunction } from "@remix-run/node";

import { useLoaderData } from '@remix-run/react'
import { useRef } from 'react';

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

import '@syncfusion/ej2-base/styles/material.css';
import '@syncfusion/ej2-buttons/styles/material.css';
import '@syncfusion/ej2-calendars/styles/material.css';
import '@syncfusion/ej2-dropdowns/styles/material.css';
import '@syncfusion/ej2-inputs/styles/material.css';
import '@syncfusion/ej2-lists/styles/material.css';
import '@syncfusion/ej2-navigations/styles/material.css';
import '@syncfusion/ej2-popups/styles/material.css';
import '@syncfusion/ej2-react-schedule/styles/material.css';
import '@syncfusion/ej2-react-grids/styles/material.css';


import '@syncfusion/ej2-gantt/styles/material.css';
import '@syncfusion/ej2-grids/styles/material.css';
import '@syncfusion/ej2-layouts/styles/material.css';
import '@syncfusion/ej2-splitbuttons/styles/material.css';
import '@syncfusion/ej2-treegrid/styles/material.css';

import { GanttComponent } from '@syncfusion/ej2-react-gantt'
import { DataManager, WebApiAdaptor } from '@syncfusion/ej2-data'
import { ColumnsDirective, ColumnDirective, Inject, Selection, AddDialogFieldsDirective, AddDialogFieldDirective, RowDD } from '@syncfusion/ej2-react-gantt';
import { Edit, Toolbar, ToolbarItem } from '@syncfusion/ej2-react-gantt';
import { DayMarkers, ContextMenu, Reorder, ColumnMenu, Filter, Sort } from '@syncfusion/ej2-react-gantt';

import { getTasks, getResources, getUsedResources, getEvents } from "~/utils/tasks";
import { PropertyPane } from '~/utils/propertyPane';
import { DropDownListComponent } from '@syncfusion/ej2-react-dropdowns';
import { Spinner } from '@syncfusion/ej2-react-popups';

import { 
  ScheduleComponent, 
  Day,  
  Month,
  Week,
  Agenda,   
  DragAndDrop,
  Resize,
  ViewsDirective,
  ViewDirective,  
  TimelineViews, TimelineMonth,
  ResourcesDirective, ResourceDirective, EventRenderedArgs, renderCell, CellTemplateArgs  
} from '@syncfusion/ej2-react-schedule';


import { useState } from 'react';
import { useFetcher } from "@remix-run/react";
import { TreeViewComponent } from '@syncfusion/ej2-react-navigations';


//Ver como mapear os recursos e mostrar eles no campo de recursos do ganttcomponent
//Mudar a API para lidar com as solicitações

export async function loader() {
  const tasks = await getTasks();
  const resources = await getResources();
  const usedResources = await getUsedResources();
  const eventos = await getEvents(); //arrumar depois as datas para poder usar o findMany
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

  const formattedEventos = eventos.map(evento => ({
    Id: evento.id,
    Subject: evento.titulo,
    Description: evento.descricao,
    StartTime: new Date(evento.data_hora_inicial),
    EndTime: new Date(evento.data_hora_final),
    IsAllDay: evento.dia_inteiro,        
    ObraId: evento.id_obra,  // campo personalizado para o código da obra
    entregue: evento.entregue,        
    entregue_em: evento.entregue_em,        
  }));  

  //console.log("tarefas FORMATADAS", tasksWithId);
  //console.log("Eventos encontrados:", formattedEventos);
  //console.log("Recursos formatados:", formattedResources); //devolve uma lista/array de recursos (dicts), com todos os campos id, resourceName, resourceRole
return ({ tasks: tasksWithId, resources: formattedResources, eventos: formattedEventos });
};

export default function GanttRoute() {  
  const ganttRef = useRef<GanttComponent>(null);
  const {tasks, resources, eventos} = useLoaderData<typeof loader>();
  const [isLoading, setIsLoading] = useState(false); // Estado para controle do spinner
  const [showPasteModal, setShowPasteModal] = useState(false); // Estado para controlar o modal
  const [pasteData, setPasteData] = useState(''); // Estado para armazenar os dados colados
  
  if (tasks.length === 0) {
    console.log("Não há tarefas para exibir");
    };

  const deletedTasks: any[] = []; // Track deleted tasks globally or in a state
  //função para o botão de salvar
	const handleSaveButton = async () => {
    setIsLoading(true); // Ativa o spinner
    try {    
      const ganttInstance = ganttRef.current;
      const updatedData = ganttInstance?.dataSource;

      console.log('Dados para salvar:', updatedData);
      console.log('Tarefas excluídas:', deletedTasks);

      //salva os dados na sessionStorage
      sessionStorage.setItem('tasks', JSON.stringify(updatedData));
      alert("Dados salvos com sucesso!"); // Exibe mensagem de sucesso

      
      
    //   const response = await fetch("/api/save-tasks", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ updatedData, deletedTasks }), // Send both updated and deleted tasks
    // });
    setTimeout(async () => {
      const response = await fetch("/api/save-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updatedData, deletedTasks }), // Send both updated and deleted tasks
      });
    }, 2000);

    // if (response.ok) {
    //   alert("Dados salvos com sucesso!"); // Exibe mensagem de sucesso
    // } else {
    //   alert("Erro ao salvar os dados. Tente novamente."); // Exibe mensagem de erro
    // }
    // if (!response.ok) {
    //   alert("Erro ao salvar os dados. Tente novamente"); // Exibe mensagem de sucesso
    // } 
  } catch (error) {
    console.error("Erro ao salvar os dados:", error);    
  }finally {
    setIsLoading(false); // Desativa o spinner
  }
  };

  
  // Configuração do DataManager com WebApiAdaptor
  // const dataManager = new DataManager({
    // url: '/api/tasks',
    // removeUrl: '/api/tasks',
    // adaptor: new WebApiAdaptor(),  
    // crossDomain: true    
  // })

  //para exibir a resposta do componente após uma ação
  const handleActionComplete = async (args: any) => {
    console.log("ActionComplete acionada");
    // if (args.data) {
    //   console.log("Ação completada! (request e data):", args.requestType, args.data);
    // }
    // if (args) {
    //   console.log("Ação completada!! (=================args completo=============):", args);
    // }
    if (args.requestType === 'delete') {
      deletedTasks.push(...args.data); // Add deleted tasks to the array
      console.log('Tarefas excluídas:', deletedTasks);
    } 
    if (args.requestType === 'rowDropped') {      
      console.log('rowDropped ACIONADO============:', args.fromIndex);
    }   
  }

  //map all resources from 'resources' object and list its id and resourceName
  const resourceData: { [key: string]: Object }[] = resources.map((resource: any) => ({
    id: resource.id,
    text: resource.resourceName
  }));

  // Função para processar os dados colados e criar novas tarefas
  const processPastedData = (data: string) => {
    const rows = data.split('\n');
    rows.forEach((row) => {
      if (row.trim() !== '') {
        const newTask = {
          TaskID: tasks.length + 1,
          taskName: row.trim(),
          StartDate: new Date(),//.toISOString().split('T')[0],
          // Set EndDate as one day after StartDate. Não pode usar StartDate como variável
          EndDate: new Date(new Date().getTime() + 24 * 60 * 60 * 1000),//.toISOString().split('T')[0],          
          //EndDate: new Date(),//.toISOString().split('T')[0],
          Duration: 1,
          Progress: 0,
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
    'Add', 'Edit', 'Update', 'Delete', 'Cancel', 'Indent', 'Outdent', 
    'ZoomIn', 'ZoomOut',
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
    // progress: 'Progress',
    parentID: 'parentId', //esse é a relação para dados flat 
    //notes: 'notes',          
    resourceInfo: 'Resources', //resourceInfo precisa ter para aparecer na caixa de diálogo, senão nem aparece. 
    //resourceInfo:'Resources' aparece todos os recursos selecionados para a tarefa
    //resourceInfo: 'resource' aparece os recursos selecionados para a tarefa, mas nenhum selecionado ?
    //parece que tem ser o mesmo  valor colocado em ColumnDirective (mas eu não coloquei)
    //child: 'subtasks', //Não se usa o child, pois os dados são planos (flat)          
    dependency: 'Predecessor' //tem que ser 'dependency'; o da direita é o nome do campo no GanttComponent
  }
  
  function queryTaskbarInfo(args) {
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
};
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

  } else {
    return <div></div>
  }
}
const template = resColumnTemplate.bind(this);

const rowDrop = (args) => {  
  //args.fromIndex é o índice original da linha que foi movida (contagem começa em 0)
  //args.dropIndex é o índice onde a linha foi solta (contagem começa em 0)  
  //args.dropRecord é o conteúdo inteiro da tarefa que cedeu lugar, e tem o novo index em dropRecord.index

  let record = args.data[0]; //é o conteúdo inteiro da linha que foi movida  
  console.log("REGISTRO CAPTURADO:",record); 

  // o código original 
  // let record = this.flatData[args.fromIndex][this.taskFields.id];
  // let record2 = this.flatData[args.dropIndex][this.taskFields.id];
  // let data: IGanttData = args.data[0];
  // let uri = 'https://localhost:44379/Home/RowDropMethod';
  // let dragdropdata = {
  //      record: data[0].taskData,
  //      position: args.dropIndex,
  //      dragidMapping: record,
  //      dropidMapping: record2
  
};

  
// incluir variável para receber oe eventos da Agenda e mostrar no PropertyPane
  

  return (
    //<div className='flex flex-col'> {/* Container pai para empilhar verticalmente */}
    <div className='flex w-full max-w-screen-2xl mx-auto overflow-hidden'> {/* Container pai para a linha principal */}

      <div className='w-3/4 pr-4'> {/* Coluna 1: Gantt (ocupa 3/4 da largura) */}
      {isLoading && <div className="spinner">Carregando...</div>} {/* Exibição do spinner */}
        {/* <div className='flex'>  Container para Gantt e Botão */}
        {/*  <div className='w-3/4'>  GanttComponent ocupa 3/4 da largura */}    
        <GanttComponent
          ref={ganttRef}
          id='Default'
          queryTaskbarInfo= {queryTaskbarInfo}
          dataSource={tasks} //com os campos mapeados
          resources={resources} //relaciona aqui os recursos que aparecem no campo de recursos do ganttcomponent, senão fica vazio
          actionComplete={handleActionComplete}
          rowDrop={rowDrop}

          resourceIDMapping='id'
          //viewType='ResourceView' //fica muito feio, agrupado por recursos

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
            columnIndex: 3,
          }}
          //treeColumnIndex={1}
          projectStartDate={new Date(2025,1,1)}
          projectEndDate={new Date(2025,8,30)}        
          
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
            allowTaskbarEditing: true
          }}

          toolbar={customToolbarItems} 
          toolbarClick={handleToolbarClick}

          //toolbar={['Add', 'Edit', 'Update', 'Delete', 'Cancel', 'Indent', 'Outdent']}
          height="650px"
        >
          {/* campos a serem exibidos na caixa de diálogo de Adicionar. Se não declarar aqui, e não tiver campo para tal, não aparece.
      Se não for especificado, os campos derivam dos valores de 'taskSettings' e 'columns'*/}
          <AddDialogFieldsDirective>            
            <AddDialogFieldDirective type='General' headerText='General'></AddDialogFieldDirective>
            <AddDialogFieldDirective type='Dependency'></AddDialogFieldDirective>
            <AddDialogFieldDirective type='Resources'></AddDialogFieldDirective> {/* ainda não tenho coluna para o 'Resources', então não aparece, mesmo colocando aqui */}
            <AddDialogFieldDirective type='Notes'></AddDialogFieldDirective>
          </AddDialogFieldsDirective>

        {/* Só aparecem as colunas que forem definidas aqui*/}
          <ColumnsDirective>
            < ColumnDirective field= 'TaskID'  headerText= 'TaskID'  width= '100' > </ColumnDirective> {/* tem que ter, senão ele não reconhece nenhum campo como chave primária */}
            < ColumnDirective field= 'TaskName'  headerText= 'Name'  width= '270' > </ColumnDirective>
            < ColumnDirective field= 'Resources'  headerText= 'Recurso'  width= '175' template= {template} > </ColumnDirective>
            < ColumnDirective field= 'StartDate' headerText='Início' width= '150' > </ColumnDirective>
            < ColumnDirective field= 'EndDate' headerText='Término' width= '150' > </ColumnDirective>
            < ColumnDirective field= 'Duration' width= '150' > </ColumnDirective>
            < ColumnDirective field= 'Progress' width= '150' > </ColumnDirective>
            </ColumnsDirective>


          <Inject services={[Selection, Edit, Toolbar, DayMarkers, ContextMenu, Reorder, ColumnMenu, Filter, Sort, RowDD]} />
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

    {/*         
    */}

      {/* <div className='w-1/4'>  Agenda ocupa 1/4 da largura */}
      <div className='w-1/4 flex flex-col'> {/* Coluna 2: Schedule, PropertyPane e Botão (ocupa 1/4 da largura, dispostos em coluna, ou seja, um abaixo do outro) */}

        <div className='mb-1'> {/* ScheduleComponent */}
          <ScheduleComponent
              width='70%'
              height='450px'
              selectedDate={new Date()}
              currentView='Agenda'
                 
              eventSettings={{
                dataSource: eventos,
                fields: {
                  Id: 'id',
                  Subject: 'titulo',
                  Description: 'descricao',
                  StartTime: 'data_hora_inicio',
                  IsAllDay: 'dia_inteiro',
                  ObraId: 'id_obra',
                  entregue: 'entregue',
                  entregue_em: 'entregue_em',
                }
              }}
              //group={{ resources: ['Resources'] }}

              agendaDaysCount={15}  
              > 
              <ViewsDirective>                
                <ViewDirective option='Day' />  
                <ViewDirective option='Week' />                
                <ViewDirective option='Month' />
                <ViewDirective option='Agenda' allowVirtualScrolling={false}/>                
                <ViewDirective option='TimelineDay' />
                <ViewDirective option='TimelineMonth' />
                </ViewsDirective>
                
            <Inject services={[Agenda, DragAndDrop, Resize, Month, Week, Day]} />
          </ScheduleComponent>
        </div>

       <div> {/* PropertyPane, debaixo da Agenda, dentro da mesma coluna 2, mais o botão embaixo */}  
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
          />
        </PropertyPane>

          <button onClick={handleSaveButton} className="bg-blue-500 text-white p-2 rounded">
          Salvar Alterações
          </button>

        </div> 

      </div>
    
  </div>
  )
}