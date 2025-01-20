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
        const registros = await prisma.$queryRaw`
        SELECT 
      o.nome_obra,
      o.cod_obra,
      t.nome_tipo,
      p.hourlyRate,
      p.nome,
      r.duracao_minutos AS horas_trabalhadas,
      r.timestamp AS data_hora 
      FROM Registro r
      INNER JOIN Obra o ON r.id_obra = o.id_obra
      INNER JOIN TipoTarefa t ON r.id_tipo_tarefa = t.id_tipo_tarefa
      INNER JOIN Pessoa p ON r.id_nome = p.id_nome   
      ORDER BY o.nome_obra, t.nome_tipo
      
      `;

      // Formatando os dados dos eventos para corresponder à estrutura esperada
      // Os campos do Scheduler Syncfusion são em Letra maiuscula inicial
      const eventos = registros.map(evento => ({
        Id: evento.cod_obra,
        Subject: evento.nome_obra,
        StartTime: new Date(evento.data_hora.toString()),
        EndTime: new Date(evento.data_hora.toString()),            
      }));

      console.log(eventos);
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
        <div style={{ display: "flex", gap: "5px" }}>
        <div style={{ flex: 3 }}>          
        <ScheduleComponent 
                width='100%' 
                height='650px' 
                selectedDate={new Date(2025, 1, 6)} 

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
    
    );
};