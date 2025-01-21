// Uma agenda para colocar as datas de início e fim dos projetos
// e datas de entrega das coisas? (aí precisa de outra tabela no banco de dados)

import { useEffect, useRef } from 'react';
import { extend } from '@syncfusion/ej2-base';
import { Query, Predicate } from '@syncfusion/ej2-data';
import { CheckBox } from '@syncfusion/ej2-react-buttons';

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
  ResourcesDirective, ResourceDirective  
} from '@syncfusion/ej2-react-schedule';



export const loader = async () => {  
    try {
        const db_eventos = await prisma.$queryRaw`       
        SELECT 
        id, 
        titulo,
        descricao,
        DATETIME (dataPrevista) AS data_hora        
        FROM Agenda         
        `

      // Formatando os dados dos eventos para corresponder à estrutura esperada
      // Os campos do Scheduler Syncfusion são em Letra maiuscula inicial
      const eventos = db_eventos.map(evento => ({
        Id: evento.id,
        Subject: evento.titulo,
        StartTime: new Date(evento.data_hora.toString()),
        EndTime: new Date(evento.data_hora.toString()),            
      }));

      console.log("Eventos no banco de dados:", eventos);
      return {eventos}               
    } catch (error) {
      console.error("Erro ao carregar recursos:", error);
      return ({        
        eventos: [],
        error: "Falha ao carregar recursos"
      });
    }
  };


export default function SchedulePage() {            
    const { eventos } = useLoaderData<typeof loader>();
      
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
                height='550px' 
                selectedDate={new Date()} 
                currentView='Month'                
                eventSettings={{ 
                  dataSource: eventos                                   
                }}
                >
                
                <ViewsDirective>                
                <ViewDirective option='Day' />  
                <ViewDirective option='Week' />                
                <ViewDirective option='Month' />
                <ViewDirective option='Agenda' />
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