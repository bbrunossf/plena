// app/routes/date-conversion.tsx
import { json } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { useState } from "react";
import { prisma } from "~/db.server";

// Helper functions for date conversions
function toISODate(date: Date) {
  return date.toISOString().split('T')[0];
}

function toJulianDay(date: Date) {
  const time = date.getTime();
  const julianDay = Math.floor((time / 86400000) + 2440587.5);
  return julianDay;
}

function fromJulianDay(julianDay: number) {
  const milliseconds = (julianDay - 2440587.5) * 86400000;
  return new Date(milliseconds);
}

export async function loader() {
  // Get dates from database - now getting all records instead of just one
  const dates = await prisma.obra.findMany({
    select: {
      id_obra: true,
      data_inicio: true,
    },
  });
  //const dates = await prisma.$queryRaw`SELECT strftime('%Y-%m-%d', data_inicio) AS data_inicio FROM Obra LIMIT 5`;
  console.log(dates);

  console.log('antes de formatar:', dates.map(date => date.data_inicio));
  
  // Convert dates to the correct format and add calculated fields
  const formattedDates = dates.map(date => ({
    ...date,
    data_inicio: date.data_inicio ? new Date(date.data_inicio) : null,
  }));

  return json({ dates: formattedDates });
}

export async function action({ request }) {
  const formData = await request.formData();
  const date = new Date(formData.get("date"));
  
  const isoDate = toISODate(date);
  const julianDay = toJulianDay(date);
  const isoDateFromJulian = toISODate(fromJulianDay(julianDay));

  return json({ isoDate, julianDay, isoDateFromJulian });
}

export default function DateConversion() {
  const { dates } = useLoaderData<typeof loader>();
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Date Format Conversion Demo</h1>

      <Form method="post" className="mb-8">
        <div className="mb-4">
          <label className="block mb-2">
            Select a date:
            <input
              type="date"
              name="date"
              value={toISODate(selectedDate)}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="block mt-1 p-2 border rounded"
            />
          </label>
        </div>

        <div className="mb-4">
          <h2 className="text-xl mb-2">Preview Conversions:</h2>
          <ul className="space-y-2">
            <li>Dado esperado pelo objeto seletor de data : {selectedDate.toJSON()}</li>
            <li>Real raw Date(Json format): {selectedDate.toJSON()}</li>
            <li>Selected raw Date (toLocaleDateString): {selectedDate.toLocaleDateString()}</li>
            <li>Selected formatted Date(toLocaleDateString, en-US): {selectedDate.toLocaleDateString('en-US', {year: 'numeric', month: '2-digit', day: '2-digit'}).replace(/\//g, '-')}</li>
            <li>JavaScript Date object (toLocaleString): {selectedDate.toLocaleString()}</li>
            <li>ISO Date (toISODate): {toISODate(selectedDate)}</li>
            <li>Julian Day (toJulianDay): {toJulianDay(selectedDate)}</li>
            <li>getDate (retorna o dia do mês, local time): {selectedDate.getDate()}</li>
            <li>getDay (retorna o dia da semana, local time): {selectedDate.getDay()}</li>
            <li>getFullYear (retorna o ano, local time): {selectedDate.getFullYear()}</li>
            <li>getHours (retorna as horas em uma data, local time): {selectedDate.getHours()}</li>
            <li>getMonth (retorna o mês em uma data, local time): {selectedDate.getMonth()}</li>
            <li>getTime (retorna o tempo em milissegundos, desde 01-01-1970, local time): {selectedDate.getTime()}</li>
            <li>getTimezoneOffset (retorna a diferença em minutos, entre a  hora UTC e a hora local): {selectedDate.getTimezoneOffset()}</li>
            <li>toDateString (retorna a data como uma string): {selectedDate.toDateString()}</li>
            <li>toISOString (retorna a data como uma string, formato ISO): {selectedDate.toISOString()}</li>
            <li>toJSON (retorna a data como uma string): {selectedDate.toJSON()}</li>
            <li>toLocaleDateString (retorna a data como um JSON): {selectedDate.toLocaleDateString()}</li>
            <li>toLocaleString (retorna a data e hora como uma string, formato local): {selectedDate.toLocaleString()}</li>
            <li>toLocaleTimeString (converte uma hora para uma string usando formato local): {selectedDate.toLocaleTimeString()}</li>
            <li>toString (retorna uma string representando uma data, formato local): {selectedDate.toString()}</li>
            <li>toTimeString (retorna uma hora como uma string): {selectedDate.toTimeString()}</li>
            <li>toUTCString (retorna a data como uma string usando UTC): {selectedDate.toUTCString()}</li>            
          </ul>
        </div>
      </Form>

      <div>
        <h2 className="text-xl mb-2">De String para Date:</h2>
        <p>
          
        </p>
      </div>
    </div>
  );
}