import { registerLicense } from '@syncfusion/ej2-base';

//import pkg from '@syncfusion/ej2-base';
//const {registerLicense} = pkg;

registerLicense('Ngo9BigBOggjHTQxAR8/V1NMaF5cXmBCf1FpRmJGdld5fUVHYVZUTXxaS00DNHVRdkdmWX5fdXVWR2RYVUVwXEA=');

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

import { loadCldr, L10n} from '@syncfusion/ej2-base';
// import ptNumberData from '@syncfusion/ej2-cldr-data/main/pt/numbers.json';
// import pttimeZoneData from '@syncfusion/ej2-cldr-data/main/pt/timeZoneNames.json';
// import ptGregorian from '@syncfusion/ej2-cldr-data/main/pt/ca-gregorian.json';
// import ptNumberingSystem from '@syncfusion/ej2-cldr-data/supplemental/numberingSystems.json';

import "../node_modules/@syncfusion/ej2-base/styles/material.css";
import "../node_modules/@syncfusion/ej2-buttons/styles/material.css";

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
    <html lang="pt-BR">
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
