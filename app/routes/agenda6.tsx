// a ação no checkbox atualiza o componente todo, e deixa ruim a experiência do usuário
//Além disso, mesmo atualizando o componente e atualizando corretamente no banco de dados, na tela o componente não é atualizado.
// (a caixa de seleção permanece no mesmo estado)


import "../schedule-custom.css"
import { useEffect, useRef, useState } from 'react';
import { extend } from '@syncfusion/ej2-base';
import { Query, Predicate } from '@syncfusion/ej2-data';
import { CheckBoxComponent  } from '@syncfusion/ej2-react-buttons';
import { json } from "@remix-run/node";
import { prisma } from "~/db.server";
import { useLoaderData } from "@remix-run/react";
import React from 'react';
import { 
  ScheduleComponent, 
  Day,  
  Month,
  Week,
  Agenda, 
  Inject,
  DragAndDrop,
  Resize,
  ViewsDirective,
  ViewDirective,  
  TimelineViews, TimelineMonth,
  ResourcesDirective, ResourceDirective, EventRenderedArgs, renderCell, CellTemplateArgs  
} from '@syncfusion/ej2-react-schedule';
import { Prisma } from '@prisma/client';
import { useFetcher } from "@remix-run/react";

import { LiaBirthdayCakeSolid } from "react-icons/lia";
import { Cell } from '@syncfusion/ej2-react-grids';



export const loader = async () => {  
    try {
        const db_eventos = await prisma.$queryRaw`       
        SELECT 
        id, 
        titulo,
        descricao,
        strftime('%m-%d-%Y', data_hora_inicio) AS data_hora_inicial,
        strftime('%m-%d-%Y', data_hora_termino) AS data_hora_final,
        dia_inteiro,
        id_obra,
        entregue,
        entregue em        
        FROM Agenda         
        `

      //console.log("Eventos na query do banco de dados:", db_eventos);

      // Formatando os dados dos eventos para corresponder à estrutura esperada
      // Os campos do Scheduler Syncfusion são em Letra maiuscula inicial
      const eventos = db_eventos.map(evento => ({
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

      //console.log("Eventos no banco de dados:", eventos);

      const db_obras = await prisma.$queryRaw`       
        SELECT 
        id_obra, 
        cod_obra,
        nome_obra        
        FROM Obra
        `

      return eventos                //, db_obras
    } catch (error) {
      console.error("Erro ao carregar recursos:", error);
      return ({        
        eventos: [],
        obras: [],
        error: "Falha ao carregar recursos"
      });
    }
  };


  export const action = async ({ request }) => {
    const formData = await request.formData();
    
    // Log para verificar os dados recebidos
    //console.log("Dados recebidos:", Object.fromEntries(formData.entries()));
  
    const subject = formData.get("Subject");
    const startTime = formData.get("startTime");
    const endTime = formData.get("endTime");
    const actionType = formData.get("actionType");
    const id = formData.get("Id");
    const description = formData.get("Description");
    const isAllDay = formData.get("IsAllDay")  === 'true';
    const entregue = formData.get("entregue")  === 'false';
    const entregue_em = new Date(); //data e hora atual
    // Validação dos dados
    if (!subject || !startTime || !endTime) {
      return json({ error: "Dados inválidos" }, { status: 400 });
    }

    /// Converte as datas para o formato ISO
    function formatInputDate(inputDate: string): string {
      const [year, month, day] = inputDate.split("-");
      const formattedDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
      return formattedDate.toISOString().split("T")[0];
  }



    //funcao para pegar data e hora no formato ISO, e criar um objeto Date
    function myfunc(dateString) {
      const x = new Date (dateString);
      return x;
    }
  
    try {
      switch (actionType) {
        case 'create':                             
          const data_hora_inicio_convert = myfunc(startTime).toISOString().replace("T", " ").replace(".000Z", "");
          const data_hora_termino_convert = myfunc(endTime).toISOString().replace("T", " ").replace(".000Z", "");
          const atualizadoEm_convert = myfunc(startTime).toISOString().replace("T", " ").replace(".000Z", "");
        // NÃO PRECISO INCLUIR OS CAMPOS 'ENTREGUE' E 'ENTREGUE_EM' PORQUE, QUANDO CRIAR UM EVENTO, ELE NÃO VAI TER SIDO ENTREGUE AINDA
          const newEvent = await prisma.$executeRaw(
            Prisma.sql`INSERT INTO agenda (titulo, descricao, data_hora_inicio, data_hora_termino, dia_inteiro, id_obra, atualizadoEm)
                       VALUES (${subject.toString()}, ${description?.toString() || ''}, ${data_hora_inicio_convert}, ${data_hora_termino_convert}, ${isAllDay}, ${15}, ${atualizadoEm_convert})`
          );
  
          return json(newEvent);
          
        case 'update':        
        const updatedEvent = await prisma.$executeRaw(
          Prisma.sql`UPDATE agenda
                     SET titulo = ${subject.toString()},
                      descricao = ${description?.toString() || ''},
                      data_hora_inicio = ${myfunc(startTime).toISOString().replace("T", " ").replace(".000Z", "")}, 
                      data_hora_termino = ${myfunc(endTime).toISOString().replace("T", " ").replace(".000Z", "")}, 
                      dia_inteiro = ${isAllDay},
                      entregue = ${entregue},
                      entregue_em = ${myfunc(entregue_em).toISOString().replace("T", " ").replace(".000Z", "")}
                     WHERE id = ${parseInt(id, 10)}`
        );      
        return json(updatedEvent);

        case 'delete':
        const deletedEvent = await prisma.agenda.delete({
          where: { id: parseInt(id, 10) }
        });
        return json(deletedEvent);
        // Outros casos (update, delete) podem ser tratados similarmente
        default:
          return json({ error: "Ação não reconhecida" }, { status: 400 });
        }            
    } catch (error) {
      console.error("Erro ao processar evento:", error);
      return json({ error: "Erro ao processar evento" }, { status: 500 });
    } finally {
      await prisma.$disconnect();
    }
  };  
  
export default function SchedulePage() {            
    //const { eventos, db_obras } = useLoaderData<typeof loader>();
	const loaderData = useLoaderData<typeof loader>();
	  //console.log("Eventos no loaderData:", loaderData);
    //const [eventos2, setEventos] = useState([]); // Estado local para gerenciar os eventos
    const [eventos, setEventos] = useState(loaderData); // inicialize o estado com os dados do loader
    //const resourceData = db_obras;

    

  
	
   const eventTemplate = (props: EventRenderedArgs) => {
     const [isChecked, setIsChecked] = useState(props.entregue || false);
     const fetcher = useFetcher();
     //console.log("propsss", props);
  
//     const handleCheckboxChange = () => {
//       // Atualiza apenas o estado local para controle visual imediato
//       setIsChecked(!isChecked);
//     };

    const handleCheckboxChange = () => {
      
      const id_evento = props.Id;
      console.log("Id do evento", id_evento);

      const newCheckedState = !isChecked; // Inverte o estado da caixa de seleção
      const entregueEm = newCheckedState ? new Date().toISOString() : null; // Define a data atual ou null

      // Atualiza o estado local para feedback visual imediato
      //setIsChecked(newCheckedState);      
      console.log("Novo estado da caixa de seleção:", newCheckedState);
      
      fetcher.submit(
        { 
          id: id_evento, 
          entregue: newCheckedState, 
          entregue_em: entregueEm 
        },        
        { method: "post", action: "/api/updateEvent" }
      );
      //console.log("fetcher.submit:", fetcher.submit)
    };
  
    return (
      <div className={`e-template-wrap  ${isChecked ? 'e-custom-delivered' : ''}`}>
        {/* <div className="flex items-center gap-1"> */}
          <CheckBoxComponent 
            checked={isChecked} 
            change={handleCheckboxChange}
            //cssClass="e-custom-checkbox"
          />
          {props.Subject}
        {/* </div> */}
      </div>
    );
   };
  

    const onActionComplete = async (args) => {
      if (args.requestType === 'eventCreated' || 
          args.requestType === 'eventChanged' || 
          args.requestType === 'eventRemoved') {    
          // Identificação dinâmica do registro do evento
          const targetEvent = 
          args.requestType === 'eventCreated' ? args.addedRecords[0] :
          args.requestType === 'eventChanged' ? args.changedRecords[0] :
          args.requestType === 'eventRemoved' ? args.deletedRecords[0] :
          null;
  
          console.log("Tipo de Ação:", args.requestType);
          console.log("Evento Processado:", targetEvent);
  
          // Verifica se o evento existe
          if (targetEvent) {
          const formData = new FormData();
          
          // Map Syncfusion event data to form data
          formData.append('actionType', 
          args.requestType === 'eventCreated' ? 'create' :
          args.requestType === 'eventChanged' ? 'update' :
          'delete'
          );
          formData.append("Subject", targetEvent.Subject);
          formData.append("startTime", targetEvent.StartTime);
          formData.append("endTime", targetEvent.EndTime);
          formData.append("Id", targetEvent.Id);      
          formData.append("Description", targetEvent.Description);
          formData.append("IsAllDay", targetEvent.IsAllDay);
          formData.append("id_obra", targetEvent.id_obra); // incluindo o id da obra          
          //formData.append("ObraId", targetEvent.ObraId); // incluindo o id da obra
          formData.append("entregue", targetEvent.entregue);
          formData.append("entregue_em", targetEvent.entregue_em);
          // Envia para a rota de ação
          try {
          const response = await fetch('/agenda', {
              method: 'POST',
              body: formData
          });
  
          if (!response.ok) {
              throw new Error('Falha ao sincronizar evento');
          }
          } catch (error) {
          console.error("Erro ao sincronizar evento:", error);
          // Opcional: Adicionar tratamento de erro para o usuário
          }
      }
      }
  };  
      
    return (   
      <div>
            <header>
                <h1>Agenda de Entregas</h1>
                <p>
                    Esta agenda é destinada ao registro de datas de entregas previstas 
                    para projetos e suas etapas. Ela será visualizada por todos os usuários.
                </p>
            </header>

        <div style={{ display: "flex", gap: "5px" }}>
        <div style={{ flex: 3 }}>          
        <ScheduleComponent 
                width='100%' 
                height='650px' 
                selectedDate={new Date()} 
                cssClass='e-schedule'                
                rowAutoHeight= {true}
                currentView='Month'                
                eventSettings={{ 
                  dataSource: eventos,
                  template: eventTemplate,
                  fields: {
                    id: 'Id',
                    isDelivered: 'entregue' // Mapeamento do campo
                },
                  enableMaxHeight: true
                        }}
              actionComplete={onActionComplete} 
              agendaDaysCount={30}              
                >
                
                <ViewsDirective>                
                <ViewDirective option='Day' />  
                <ViewDirective option='Week' />                
                <ViewDirective option='Month' />
                <ViewDirective option='Agenda' allowVirtualScrolling={true}/>                
                <ViewDirective option='TimelineDay' />
                <ViewDirective option='TimelineMonth' />
                </ViewsDirective>
                
                <Inject services={[Day, Month, Week, Agenda, TimelineMonth, TimelineViews, DragAndDrop, Resize]} />
        </ScheduleComponent>  
        </div>        
         
    </div>
    </div>
    
    );
};