import { registerLicense } from '@syncfusion/ej2-base';

//import pkg from '@syncfusion/ej2-base';
//const {registerLicense} = pkg;

//registerLicense('Ngo9BigBOggjHTQxAR8/V1NMaF5cXmBCf1FpRmJGdld5fUVHYVZUTXxaS00DNHVRdkdmWX5fdXVWR2RYVUVwXEA=');
//registerLicense('Ngo9BigBOggjHTQxAR8/V1NDaF5cWWtCf1FpRmJGdld5fUVHYVZUTXxaS00DNHVRdkdnWH5ceXRcRmNfUUJ0VkE=');
//registerLicense('Ngo9BigBOggjHTQxAR8/V1NMaF1cW2hIfEx1RHxQdld5ZFRHallYTnNWUj0eQnxTdEBjW35XcXBXQmNbUEJ1Wg==');
//registerLicense("Ngo9BigBOggjHTQxAR8/V1NMaF5cXmBCf1FpRmJGdld5fUVHYVZUTXxaS00DNHVRdkdmWX1feXVdQ2BYU0xwWEc=");
//registerLicense("Ngo9BigBOggjHTQxAR8/V1NMaF5cXmBCf1FpRmJGdld5fUVHYVZUTXxaS00DNHVRdkdmWX1ccHRcRmhZV0B0XEA=");

//import { cssBundleHref } from "@remix-run/css-bundle";


import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import type { LinksFunction } from "@remix-run/node";
import Sidebar from "~/components/sidebar";

import "./tailwind.css";
//import "./cell-template.css";
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

import { loadCldr, L10n} from '@syncfusion/ej2-base';
import ptNumberData from '@syncfusion/ej2-cldr-data/main/pt/numbers.json';
import pttimeZoneData from '@syncfusion/ej2-cldr-data/main/pt/timeZoneNames.json';
import ptGregorian from '@syncfusion/ej2-cldr-data/main/pt/ca-gregorian.json';
import ptNumberingSystem from '@syncfusion/ej2-cldr-data/supplemental/numberingSystems.json';

import {setCulture} from '@syncfusion/ej2-base';

// loadCldr(ptNumberData, pttimeZoneData, ptGregorian, ptNumberingSystem);
// setCulture('pt');

// L10n.load({
//   'pt': {
//   gantt: {
//         emptyRecord: "Não há registros a serem exibidos",
//         id: "ID",
//         name: "Nome",
//         startDate: "Data de início",
//         endDate: "Data final",
//         duration: "Duração",
//         progress: "Progresso",
//         dependency: "Dependência",
//         notes: "Notas",
//         baselineStartDate: "Data de início da linha de base",
//         baselineEndDate: "Data de término da linha de base",
//         taskMode: "Modo Tarefa",
//         changeScheduleMode: "Alterar modo de programação",
//         subTasksStartDate: "Data de início das subtarefas",
//         subTasksEndDate: "Data de término das subtarefas",
//         scheduleStartDate: "Data de início da programação",
//         scheduleEndDate: "Data de término da programação",
//         auto: "Automárico",
//         manual: "Manual",
//         type: "Tipo",
//         offset: "Deslocamento",
//         resourceName: "Recursos",
//         resourceID: "ID do Recurso",
//         day: "dia",
//         hour: "hora",
//         minute: "minuto",
//         days: "dias",
//         hours: "horas",
//         minutes: "minutos",
//         generalTab: "Geral",
//         customTab: "Colunas personalizadas",
//         writeNotes: "Escrever notas",
//         addDialogTitle: "Nova tarefa",
//         editDialogTitle: "Informações da tarefa",
//         saveButton: "Salvar",
//         add: "Adicionar",
//         edit: "Editar",
//         update: "Atualizar",
//         delete: "Excluir",
//         cancel: "Cancelar",
//         search: "Procurar",
//         task: " tarefa",
//         tasks: " tarefas",
//         zoomIn: "Ampliar",
//         zoomOut: "Reduzir",
//         zoomToFit: "Zoom para ajustar",
//         excelExport: "Exportar Excel",
//         csvExport: "Exportar CSV",
//         expandAll: "Expandir todos",
//         collapseAll: "Recolher todos",
//         nextTimeSpan: "Próximo período",
//         prevTimeSpan: "Período anterior",
//         okText: "OK",
//         confirmDelete: "Tem certeza de que deseja excluir o registro?",
//         from: "A partir de",
//         to: "Para",
//         taskLink: "Link de Tarefa",
//         lag: "atraso",
//         start: "Começar",
//         finish: "Terminar",
//         enterValue: "Digite o valor",
//   }
//   }
// })

// import "../node_modules/@syncfusion/ej2-base/styles/material.css";
// import "../node_modules/@syncfusion/ej2-buttons/styles/material.css";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="bg-gray-100">
        <div className="flex">
          <Sidebar />
          <main className="ml-64 flex-1 p-8">
            {children}
          </main>
        </div>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <div className="flex">
      <Sidebar />
      {/* <main className="ml-64 flex-1 p-8"> */}
        <Outlet />
      {/* </main> */}
    </div>
  );
}
