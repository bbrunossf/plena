//teste2, ultima versao

import { DataManager, WebApiAdaptor } from "@syncfusion/ej2-data";
import { DatePickerComponent } from '@syncfusion/ej2-react-calendars';

import { useRef, useState } from 'react';
import { data, json } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";

import taskService from "~/services/taskService";
import { PrismaClient } from "@prisma/client";



import { GanttComponent, ColumnsDirective, ColumnDirective, Inject, Selection, EditSettingsModel, 
  Edit, Toolbar,  DayMarkers, ContextMenu, RowDD
} from '@syncfusion/ej2-react-gantt';

// export async function loader() {
//   const tasks = await taskService.listTasks();
//   console.log("tarefas encontradas", tasks);
//   return ({ tasks });
// }

// Cria uma instância do Prisma Client
const prisma = new PrismaClient();

 export async function loader() {
  const tasks = await prisma.task.findMany();
  //console.log("tarefas encontradasz", tasks);

  // const dataSource: DataManager = new DataManager({
  //   url: 'https://services.syncfusion.com/react/production/api/GanttData',
  //   adaptor: new WebApiAdaptor,
  //   crossDomain: true
  // });

 //mapear cada campo da tarefa para um objeto
 const tasksWithId = tasks.map((task: any, index: number) => ({
  TaskID: task.id,
    taskName: task.taskName,
    StartDate: new Date(task.startDate).toISOString().split('T')[0],
    EndDate: new Date(task.endDate).toISOString().split('T')[0],
    Duration: task.duration,
    Progress: task.progress,
    parentId: task.parentId,
    isRecurring: task.isRecurring,
    recurrenceId: task.recurrenceId,
    predecessorId: task.predecessorId,
    dependencyType: task.dependencyType,
    notes: task.notes,
  }));
  //console.log("tarefas FORMATADAS", tasksWithId);
return ({ tasks: tasksWithId });
 // console.log("tarefas encontradas", json(dataSource));
 //return  tasks ;
 }


export default function GanttPage() {  
  const ganttRef = useRef<GanttComponent>(null);
  const fetcher = useFetcher();
  const [showPasteModal, setShowPasteModal] = useState(false); // Estado para controlar o modal
  const [pasteData, setPasteData] = useState(''); // Estado para armazenar os dados colados

  const dataManager : DataManager = new DataManager({    
    url: '/api/save-gantt',
    adaptor: new WebApiAdaptor,
    crossDomain: true
  });

  const { tasks } = useLoaderData<typeof loader>();
  //console.log("tarefas encontradas no default", {dataSource});

  //nomes que aparecem no modal de edição da tarefa
  //PRECISA CONSTAR
  const taskFields = {
    id: "TaskID",
    name: "taskName",
    startDate: "StartDate",
    endDate: "EndDate",
    duration: "Duration",
    progress: "Progress",
    dependency: "Predecessor",
  } as const;

  //mapa usado no exemplo com o WebApiAdaptor
  // const taskFields: any = {
  //   id: 'TaskId',
  //   name: 'TaskName',
  //   startDate: 'StartDate',
  //   duration: 'Duration',
  //   dependency: 'Predecessor',
  //   child: 'SubTasks'
  // };

  const handleSave = async () => {
    const updatedData = ganttRef.current?.treeGrid.grid.dataSource;
    console.log('Dados para salvar - fonte handleSave:', updatedData);
    if (updatedData) {
      fetcher.submit(
        { data: JSON.stringify(updatedData) },
        { method: "post", action: "/api/save-gantt" }
      );
    }
  };

 
  // Função para processar os dados colados e criar novas tarefas
  const processPastedData = (data: string) => {
    const rows = data.split('\n');
    rows.forEach((row) => {
      if (row.trim() !== '') {
        const newTask = {
          TaskID: tasks.length + 1,
          taskName: row.trim(),
          StartDate: new Date().toISOString().split('T')[0],
          EndDate: new Date().toISOString().split('T')[0],
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
   //toolbar={['Add', 'Edit', 'Update', 'Delete', 'Cancel', 'Indent', 'Outdent', 
    //         'ZoomIn', 'ZoomOut', 'ExpandAll', 'CollapseAll']}
   const customToolbarItems: any[] = [
    'Update', 'Delete', 'Cancel', 'Indent', 'Outdent', 
    'ZoomIn', 'ZoomOut', 'Add', 'ExpandAll', 'CollapseAll',
    { text: 'Colar Tarefas', tooltipText: 'Colar Tarefas', id: 'pasteTasks' }, 'Edit', 
  ];

  // Função para lidar com cliques na toolbar
  const handleToolbarClick = (args: any) => {
    if (args.item.id === 'pasteTasks') {
      handleOpenPasteModal();
    }
  }
  

  //para exibir a resposta do componente após uma ação
  // const handleActionComplete = async (args: any) => {
  //   if (args.data) {
  //     console.log("Ação completada:", args.requestType, args.data);
  //     //estranho, quando uso o 'Update' da barra de tarefa, a ação no 'args.data' é undefined
  //   }
  // }
  const handleActionComplete = async (args: any) => {
    console.log("Acionada função ActionComplete!!", args)
	if (args.requestType === 'delete') {
      const deletedTaskIds = args.data.map((task: any) => task.TaskID);	  
      fetcher.submit(
        { 
          deletedTasks: JSON.stringify(deletedTaskIds),
          action: 'delete'
        },
        { method: "post", action: "/api/save-gantt" }
      );
    }
  }

	// 1. Obter dados atualizados do Gantt ao clicar no botao
  const handleSaveData = async () => {       
    // const updatedData = ganttRef.current?.updatedRecords; //só retorna os registros atualizados?
    const updatedData = ganttRef.current?.treeGrid.grid.dataSource; //retorna todos os registros ?    
    console.log('Dados para salvar - fonte handleSaveData:', updatedData);
    if (updatedData) {
      fetcher.submit(
        { data: JSON.stringify(updatedData) },
        { method: "post", action: "/api/save-gantt" }
      );
    }
  }

  const  splitterSettings = {
    columnIndex : 4
};
	
  // Custom date editor component
const DateEditor = (props: any) => {
  const datePickerRef = useRef<DatePickerComponent>(null);
  
  // Sync with Gantt's edit lifecycle
  props.createElement = (args: any) => {
    return <DatePickerComponent 
      ref={datePickerRef}
      value={props.value} 
      change={(e) => props.onChange(e.value)}
    />;
  };

  return null;
};
  

  const formatOption = { type: 'date', format: 'dd/MM/yyyy' };

  const editOptions: EditSettingsModel = {
    allowAdding: true, //precisa para habilitar o botão de Add
    allowEditing: true, //precisa para habilitar o botão de Edit
    allowDeleting: true, //precisa para habilitar o botão de Delete
    allowTaskbarEditing: true,
    mode: 'Auto',        
  };

  return (
    <div>
      <div className="text-3xl font-bold underline">
        <h1>Gantt Chart</h1>
      </div>
      <div className="w-full h-full">
        <GanttComponent 
            id='Default'  
            treeColumnIndex={1}
            height='460px'
            ref={ganttRef}
            dataSource={tasks}
            taskFields={taskFields}            
            
            editSettings={editOptions}
            
            enableContextMenu={true}   
            splitterSettings={splitterSettings}         

            actionComplete={handleActionComplete}

            allowSelection={true} allowKeyboard={true} allowRowDragAndDrop={true} allowTaskbarDragAndDrop={true}

            locale="pt"           
            

            //toolbar={['Add', 'Edit', 'Update', 'Delete', 'Cancel', 'ZoomIn', 'ZoomOut']}
            toolbar={customToolbarItems} //ver como incluir o botão customizado e os botões padrão
            //https://ej2.syncfusion.com/react/documentation/gantt/tool-bar?cs-save-lang=1&cs-lang=ts
            toolbarClick={handleToolbarClick}
            >

            <ColumnsDirective>
              <ColumnDirective field='TaskID' width='80' ></ColumnDirective>
              <ColumnDirective field='taskName' headerText='Job Name' width='250' clipMode='EllipsisWithTooltip'></ColumnDirective>
              
              <ColumnDirective 
                field='startDate' 
                format={formatOption}                
                editType='datepickeredit'>                  
              </ColumnDirective>

              <ColumnDirective field='duration'></ColumnDirective>
              {/* <ColumnDirective field='progress'></ColumnDirective> */}
              <ColumnDirective field='Predecessor'></ColumnDirective>
            </ColumnsDirective>

            <Inject services={[Selection, DayMarkers, Edit, Toolbar, ContextMenu, RowDD]} />
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
          
	  
	  <div>
      <button onClick={handleSaveData} className="bg-blue-500 text-white p-2 rounded">
        Salvar Alterações
      </button>
    </div>
	  
    </div>
  );
}