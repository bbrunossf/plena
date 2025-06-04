import { registerLicense } from '@syncfusion/ej2-base';
registerLicense('Ngo9BigBOggjHTQxAR8/V1NMaF1cXGJCf1FpRmJGdld5fUVHYVZUTXxaS00DNHVRdkdmWXxfdHVQQmZfV0J+X0U=');

//import { json, type ActionArgs } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
//import { prisma } from "~/db.server";
import {type ClientActionFunctionArgs } from "@remix-run/react";
import { useState } from "react";
import { GridComponent, ColumnsDirective, ColumnDirective, Page, Edit, Sort, Filter,
  Toolbar, ToolbarItems, Inject, CommandColumn } from '@syncfusion/ej2-react-grids';
import { Query } from '@syncfusion/ej2-data';
import {IEditCell} from '@syncfusion/ej2-react-grids';

// import { 
//   getObras, 
//   getClientes, 
//   createObra, 
//   updateObra, 
//   deleteObra 
// } from "~/services/dbObras.server";
import { getObras, getClientes } from "~/services/dbObras.server";


export const loader = async () => {  
  const obras = await getObras();
  const clientes = await getClientes();
  return { obras, clientes };
};




export default function Obras() {  
  const { obras, clientes } = useLoaderData<typeof loader>();
  
  const commands = [
    { 
      type: 'Edit', 
      buttonOption: { cssClass: 'e-flat', iconCss: 'e-edit e-icons' } 
    },
    { 
      type: 'Delete', 
      buttonOption: { cssClass: 'e-flat', iconCss: 'e-delete e-icons' } 
    },
  ];

  const editSettings = { 
    allowEditing: true,
    allowAdding: true, 
    allowDeleting: true,
    showDeleteConfirmDialog: true,
    mode: 'Dialog'    
  };
  

  const toolbarOptions: ToolbarItems[] = ['Add', 'Edit', 'Delete', 'Update', 'Cancel'];


  //  const actionComplete = (args) => {
  //    console.log(args);
  // //   if (args.requestType === 'delete') {
  // //     // receber os dados do 'args.data' e deletar no banco de dados usando a função deleteObra
  // //     deleteObra(args.data[0].id_obra);      
  // //   }
  // //   if (args.requestType === 'save') {
  // //     // receber os dados do 'args.data' e salvar no banco de dados usando a função 'createObra'
  // //     createObra(
  // //       args.data[0].cod_obra,
  // //       args.data[0].nome_obra,
  // //       args.data[0].id_cliente,
  // //       args.data[0].data_inicio,
  // //       args.data[0].total_horas_planejadas,
  // //       args.data[0].observacoes_planejamento
  // //     );      
  // //   }
  //  };

//   const response = await fetch("/api/save-tasks", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ updatedData, deletedTasks }), // Send both updated and deleted tasks
//   });
// }, 2000);

  const actionComplete = async (args) => {
    if (args.requestType === 'delete') {
      try {
        const response = await fetch('/api/save-obras', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id_obra: args.data[0].id_obra })
        });
        
        if (!response.ok) throw new Error('Erro ao deletar obra');
      } catch (error) {
        console.error('Erro:', error);
        // Aqui você pode adicionar lógica para mostrar erros ao usuário
      }
    }
    
    if (args.requestType === 'save') {
      try {
        // Determina se é create ou update baseado na presença de id_obra
        const isUpdate = !!args.data.id_obra;
        const response = await fetch('/api/save-obras', {
          method: isUpdate ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(args.data)
        });
        
        if (!response.ok) throw new Error(`Erro ao ${isUpdate ? 'atualizar' : 'criar'} obra`);
      } catch (error) {
        console.error('Erro:', error);
      }
    }
  };



  const editparams = {
    dataSource: clientes,
    fields: { text: 'nome_cliente', value: 'id_cliente' },
    query: new Query().select(['id_cliente', 'nome_cliente']).take(3),
  }
  
  // Defina os parâmetros do dropdown edit
const dropDownEditParams: IEditCell = {
  params: {
    dataSource: clientes,
    fields: { text: 'nome_cliente', value: 'id_cliente' },
    query: new Query().select(['id_cliente', 'nome_cliente'])
  }
};


  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Gestão de Obras</h1>
      <GridComponent
        dataSource={obras}
        allowPaging={true}
        allowSorting={true}
        pageSettings={{ pageSize: 16 }}
        editSettings={editSettings}
        toolbar={toolbarOptions}
        actionComplete={actionComplete}>
        <ColumnsDirective>        
          {/* <ColumnDirective field="id_obra" headerText="id" textAlign="Center" /> */}
          <ColumnDirective field="cod_obra" headerText="Código" textAlign="Center" isPrimaryKey={true}/>
          <ColumnDirective field="nome_obra" width="350" headerText="Nome" textAlign="Left" />
          
          <ColumnDirective field="id_cliente" 
              editType='dropdownedit' headerText="Cliente" textAlign="Center"
              edit={dropDownEditParams} />
          
          <ColumnDirective field="data_inicio" editType='datepickeredit' headerText="Data Início" textAlign="Center" format="dd/MM/yyyy" />
          <ColumnDirective field="total_horas_planejadas" editType='numericedit' headerText="Horas Planejadas" textAlign="Center" />
          <ColumnDirective headerText="Ações" width="150" commands={commands} />
        </ColumnsDirective>
        <Inject services={[Page, Edit, Sort, Filter, Toolbar, CommandColumn]} />
      </GridComponent>
    </div>
  );
}