import { registerLicense } from '@syncfusion/ej2-base';
registerLicense('Ngo9BigBOggjHTQxAR8/V1NMaF1cXGJCf1FpRmJGdld5fUVHYVZUTXxaS00DNHVRdkdmWXxfdHVQQmZfV0J+X0U=');

//import { json, type ActionArgs } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { prisma } from "~/db.server";
import {type ClientActionFunctionArgs } from "@remix-run/react";
import { useState } from "react";
import { GridComponent, ColumnsDirective, ColumnDirective, Page, Edit, 
  Toolbar, ToolbarItems, Inject, CommandColumn } from '@syncfusion/ej2-react-grids';
import { Query } from '@syncfusion/ej2-data';
import {IEditCell} from '@syncfusion/ej2-react-grids';



export const loader = async () => {

  const obras = await prisma.$queryRaw`SELECT
      id_obra,
      cod_obra,
      nome_obra,
      id_cliente,
      strftime('%m-%d-%Y', data_inicio) AS data_inicio,
      total_horas_planejadas,
      observacoes_planejamento           
      FROM Obra`

//   const obras = await prisma.obra.findMany({
//     select: {
//       id_obra: true,
//       cod_obra: true,
//       nome_obra: true,
//       id_cliente: true,
//       data_inicio: true,
//       total_horas_planejadas: true,
//       //data_inicio_planejamento: true,
//       //data_fim_planejamento: true,
//       observacoes_planejamento: true,
//     },
//     // orderBy: {
//     //   data_inicio: 'desc',
//     // },
// });
  
  const clientes = await prisma.cliente.findMany();
  //console.log("---------------OBRAS------------",obras);
  return ({ obras, clientes });
};



export const action = async ({ request }: ClientActionFunctionArgs) => {
  const formData = await request.formData();
  const action = formData.get("_action");

  if (action === "create") {
    const inputDate = formData.get("data_inicio") as string;
    

    // Garantir que o formato seja yyyy-mm-dd sem alteração de hora
    const [year, month, day] = inputDate.split("-");    
    // Criar um novo objeto Date com ano, mês e dia corretos
    const formattedDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));

    const formattedDate1 = formattedDate.toISOString().split("T")[0];

    


    const nova_obra = await prisma.$executeRaw`
      INSERT INTO obra (
        cod_obra,
        nome_obra,
        id_cliente,
        data_inicio,    
        total_horas_planejadas,
        observacoes_planejamento
        ) VALUES (
         ${formData.get("cod_obra")},
         ${formData.get("nome_obra")},
         ${parseInt(formData.get("id_cliente") as string)},
         ${formattedDate1},    
         ${parseFloat(formData.get("total_horas_planejadas") as string)},
         ${formData.get("observacoes_planejamento")}
        )      
    `;

    return nova_obra;
    

    // return await prisma.obra.create({
    //   data: {
    //     cod_obra: formData.get("cod_obra") as string,
    //     nome_obra: formData.get("nome_obra") as string,
    //     id_cliente: parseInt(formData.get("id_cliente") as string),        
    //     //data_inicio: formData.get("data_inicio") || null,
    //     //data_inicio: formData.get("data_inicio") ? new Date(`${formData.get("data_inicio") as string}T00:00:00.000Z`) : null,
    //     data_inicio: formattedDate1, 
    //     total_horas_planejadas: parseFloat(formData.get("total_horas_planejadas") as string),
    //     observacoes_planejamento: formData.get("observacoes_planejamento") as string,
    //   },
    // });
  }

  if (action === "update") {
    // const formatDateForDatabase = (isoDate) => {
    //     const date = new Date(isoDate); // Converte o ISO para um objeto Date
    //     return date
    //   }; 

    //agora, data_inicio vem como yyyy-mm-dd
    const inputDate = formData.get("data_inicio") as string;
    console.log("data_inicio é", inputDate);
    
    //const formattedDate = inputDate ? new Date(inputDate) : null;
    //const formattedDate = formatDateForDatabase(inputDate) ;
    //const formattedDate = inputDate ; // fica faltando a parte das horas

    //const formattedDate = inputDate ? new Date(inputDate).toISOString().replace("T", " ").split('.')[0] : null;
    //const formattedDate = new Date("2025-01-01");
    //const formattedDate = inputDate ? inputDate && "T00:00:00.000Z": null;

    // formattedDate must be in the ISO 8601 format: yyyy-mm-ddThh:mm:ss.sssZ, using inputDate
    //const formattedDate = new Date(inputDate).toISOString();

    //const formattedDate = inputDate ? new Date(inputDate).toISOString().split("T")[0] : null;

    // Garantir que o formato seja yyyy-mm-dd sem alteração de hora
    const [year, month, day] = inputDate.split("-");
    
    // Criar um novo objeto Date com ano, mês e dia corretos
    const formattedDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));

    const formattedDate2 = formattedDate.toISOString().split("T")[0];
    

    
    
    
    console.log("data formatada AGORA é", formattedDate2);

    const result = await prisma.$executeRaw`
      UPDATE obra
      SET
        cod_obra = ${formData.get("cod_obra")},
        nome_obra = ${formData.get("nome_obra")},
        id_cliente = ${parseInt(formData.get("id_cliente") as string)},
        data_inicio = ${formattedDate2},    
        total_horas_planejadas = ${parseFloat(formData.get("total_horas_planejadas") as string)},
        observacoes_planejamento = ${formData.get("observacoes_planejamento")}
      WHERE id_obra = ${parseInt(formData.get("id_obra") as string)}
    `;


    // return await prisma.obra.update({
    //   where: { id_obra: parseInt(formData.get("id_obra") as string) },
    //   data: {
    //     cod_obra: formData.get("cod_obra") as string,
    //     nome_obra: formData.get("nome_obra") as string,
    //     id_cliente: parseInt(formData.get("id_cliente") as string),    
    //     //data_inicio: formattedDate,    
    //     data_inicio: "20250116T144818Z",
    //     total_horas_planejadas: parseFloat(formData.get("total_horas_planejadas") as string),
    //     observacoes_planejamento: formData.get("observacoes_planejamento") as string,
    //   },
    // });
    return result;
  }

  if (action === "delete") {
    return await prisma.obra.delete({
      where: { id_obra: parseInt(formData.get("id_obra") as string) },
    });
  }

  return null;
};

// export default function Obras() {
//   const { obras, clientes } = useLoaderData<typeof loader>();
//   const [editingObra, setEditingObra] = useState<typeof obras[0] | null>(null);



//   // Paginação
//   const [currentPage, setCurrentPage] = useState(1);
//   const itemsPerPage = 50; // Items por página
  
//   // Calcule o número total de páginas
//   const totalPages = Math.ceil(obras.length / itemsPerPage);

//   // Calcule os índices dos itens a serem exibidos
//   const indexOfLastItem = currentPage * itemsPerPage;
//   const indexOfFirstItem = indexOfLastItem - itemsPerPage;
//   const currentItems = obras.slice(indexOfFirstItem, indexOfLastItem);

//   // Funções para manipular a navegação entre páginas
//   const nextPage = () => {
//     if (currentPage < totalPages) setCurrentPage(currentPage + 1);
//   };

//   const prevPage = () => {
//     if (currentPage > 1) setCurrentPage(currentPage - 1);
//   };


//   return (
//     <div className="p-6">
//       <h1 className="text-2xl font-bold mb-6">Gestão de Obras</h1>

//       {/* Create Form */}
//       <div className="mb-8 p-4 bg-gray-50 rounded-lg">
//         <h2 className="text-xl font-semibold mb-4">Nova Obra</h2>
//         <Form method="post" className="grid grid-cols-2 gap-4">
//           <input type="hidden" name="_action" value={editingObra ? "update" : "create"}  />

//           {editingObra && (<input type="hidden" name="id_obra" value={editingObra.id_obra} />)}
          
//           <div>
//             <label className="block text-sm font-medium mb-1">Código da Obra</label>
//             <input
//               type="text"
//               name="cod_obra"
//               className="w-full p-2 border rounded"
//               defaultValue={editingObra?.cod_obra || ""}
//               required
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium mb-1">Nome da Obra</label>
//             <input
//               type="text"
//               name="nome_obra"
//               className="w-full p-2 border rounded"
//               defaultValue={editingObra?.nome_obra || ""}
//               required
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium mb-1">Cliente</label>
//             <select 
//                 name="id_cliente" 
//                 className="w-full p-2 border rounded" 
//                 defaultValue={editingObra?.id_cliente || ""}
//                 required>

//               {clientes.map((cliente) => (
//                 <option key={cliente.id_cliente} value={cliente.id_cliente}>
//                   {cliente.nome_cliente}
//                 </option>
//               ))}
//             </select>
//           </div>

//           <div>
//             <label className="block text-sm font-medium mb-1">Data de Início</label>
//             <input
//               type="date"
//               name="data_inicio"
//               className="w-full p-2 border rounded"
//               // get value from editingObra?.data_inicio and use it as default value
//               defaultValue={editingObra?.data_inicio ? new Date(editingObra?.data_inicio).toISOString().split('T')[0] : ''}

//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium mb-1">Total Horas Planejadas</label>
//             <input
//               type="number"
//               name="total_horas_planejadas"
//               className="w-full p-2 border rounded"
//               step="1.00"
//               defaultValue={editingObra?.total_horas_planejadas || ""}
//               required
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium mb-1">Observações</label>
//             <textarea
//               name="observacoes_planejamento"
//               className="w-full p-2 border rounded"
//               rows={3}
//               defaultValue={editingObra?.observacoes_planejamento || ""}
//             />
//           </div>

//           <div className="col-span-2 flex gap-2">
//             <button
//                 type="submit"
//                 className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 flex-1"
//             >
//                 {editingObra ? "Salvar Alterações" : "Criar Obra"}
//             </button>
//             {editingObra && (
//                 <button
//                 type="button"
//                 onClick={() => setEditingObra(null)}
//                 className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
//                 >
//                 Cancelar
//                 </button>
//             )}
//             </div>
//         </Form>
//       </div>

//       {/* List of Obras */}
//       <div className="overflow-x-auto">
//         <table className="min-w-full bg-white">
//           <thead>
//             <tr className="bg-gray-100">
//               <th className="px-4 py-2">Código</th>
//               <th className="px-4 py-2">Nome</th>
//               <th className="px-4 py-2">Cliente</th>
//               <th className="px-4 py-2">Data Início</th>
//               <th className="px-4 py-2">Horas Planejadas</th>
//               <th className="px-4 py-2">Ações</th>
//             </tr>
//           </thead>
//           <tbody>
//             {currentItems.map((obra) => (
//               <tr key={obra.id_obra} className="border-t">
//                 <td className="px-4 py-2">{obra.cod_obra}</td>
//                 <td className="px-4 py-2">{obra.nome_obra}</td>

//                 <td className="px-4 py-2">{obra.cliente?.nome_cliente}</td>

//                 {/* <td className="px-4 py-2">{obra.data_inicio ? obra.data_inicio.toLocaleDateString('pt-BR') : '-'}</td> */}
//                 {/* <td className="px-4 py-2">{obra.data_inicio ? new Date(obra.data_inicio) : }</td> */}
                
//                 <td className="px-4 py-2">{obra.data_inicio ? new Date(obra.data_inicio).toLocaleDateString() : '-'}</td>


//                 {/* <td className="px-4 py-2">{obra.data_inicio_planejamento ? obra.data_inicio_planejamento.toLocaleDateString('pt-BR') : '-'}</td>
//                 <td className="px-4 py-2">{obra.data_fim_planejamento ? obra.data_fim_planejamento.toLocaleDateString('pt-BR') : '-'}</td> */}

//                 <td className="px-4 py-2">{obra.total_horas_planejadas}</td>
//                 <td className="px-4 py-2">
//                 <button
//                     onClick={() => setEditingObra(obra)}
//                     className="bg-yellow-500 text-white py-1 px-3 rounded text-sm hover:bg-yellow-600 mr-2"
//                 >
//                     Editar
//                 </button>
//                 <Form method="post" className="inline">
//                     <input type="hidden" name="_action" value="delete" />
//                     <input type="hidden" name="id_obra" value={obra.id_obra} />
//                     <button
//                     type="submit"
//                     className="bg-red-500 text-white py-1 px-3 rounded text-sm hover:bg-red-600"
//                     onClick={(e) => {
//                         if (!confirm("Confirma exclusão desta obra?")) {
//                         e.preventDefault();
//                         }
//                     }}
//                     >
//                     Excluir
//                     </button>
//                 </Form>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//       <div className="flex justify-between mt-4">
//         <button onClick={prevPage} disabled={currentPage === 1} className="bg-gray-500 text-white py-1 px-3 rounded">
//           Anterior
//         </button>
//         <span>Página {currentPage} de {totalPages}</span>
//         <button onClick={nextPage} disabled={currentPage === totalPages} className="bg-gray-500 text-white py-1 px-3 rounded">
//           Próximo
//         </button>
//       </div>
//     </div>
//   );
// }






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
    mode: 'Dialog'
  };

  const toolbarOptions: ToolbarItems[] = ['Add', 'Edit', 'Delete', 'Update', 'Cancel'];


  const actionComplete = (args) => {
    if (args.requestType === 'delete') {
      // Implemente a lógica de exclusão aqui
      console.log("Deletar obra com ID:", args.data[0].id_obra);
    }
    if (args.requestType === 'save') {
      // Implemente a lógica de edição aqui
      console.log("Editar obra:", args.data);
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
        pageSettings={{ pageSize: 50 }}
        editSettings={editSettings}
        toolbar={toolbarOptions}
        actionComplete={actionComplete}>
        <ColumnsDirective>
          <ColumnDirective field="cod_obra" headerText="Código" textAlign="Center" />
          <ColumnDirective field="nome_obra" width="350" headerText="Nome" textAlign="Left" />
          
          <ColumnDirective field="id_cliente" 
              editType='dropdownedit' headerText="Cliente" textAlign="Center"
              edit={dropDownEditParams} />
          
          <ColumnDirective field="data_inicio" editType='datepickeredit' headerText="Data Início" textAlign="Center" format="dd/MM/yyyy" />
          <ColumnDirective field="total_horas_planejadas" editType='numericedit' headerText="Horas Planejadas" textAlign="Center" />
          <ColumnDirective headerText="Ações" width="150" commands={commands} />
        </ColumnsDirective>
        <Inject services={[Page, Edit, Toolbar, CommandColumn]} />
      </GridComponent>
    </div>
  );
}