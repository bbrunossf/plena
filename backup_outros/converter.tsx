// app/routes/date-conversion.tsx
// import { json } from "@remix-run/node";
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
  // Get dates from database for demonstration
  const dates = await prisma.obra.findFirst({        
    select: {
      id_obra: true,
      data_inicio: true,      
    },
  });
  return ({ dates });
}

export async function action({ request }) {
  const formData = await request.formData();
  const date = new Date(formData.get("date"));
  
  
  // Convert to different formats
  const isoDate = toISODate(date);
  const julianDay = toJulianDay(date);
  const isoDateFromJulian = toISODate(fromJulianDay(julianDay));

  // return the values
  console.log(isoDate);
  return ({ isoDate, julianDay, isoDateFromJulian });
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
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="block mt-1 p-2 border rounded"              
            />
          </label>
        </div>

        <div className="mb-4">
          <h2 className="text-xl mb-2">Preview Conversions:</h2>
          <ul className="space-y-2">
            <li>selected raw Date: {(selectedDate).toLocaleDateString()}</li>
            <li>selected formatted Date: {selectedDate.toLocaleDateString('en-US', {year: 'numeric', month: '2-digit', day: '2-digit'}).replace(/\//g, '-')}</li>
            <li>ISO Date: {toISODate(selectedDate)}</li>
            <li>Julian Day: {toJulianDay(selectedDate)}</li>
            <li>
              JavaScript Date object:{" "}
              {selectedDate.toLocaleString()}
            </li>
          </ul>
        </div>
        
      </Form>

      <div>
        <h2 className="text-xl mb-2">Stored Dates from Database:</h2>
        <table className="min-w-full border">
          <thead>
            <tr>
              <th className="border p-2">ID</th>
              <th className="border p-2">ISO Date</th>
              <th className="border p-2">Julian Day</th>
              <th className="border p-2">Julian to ISO</th>
            </tr>
          </thead>
          <tbody>
          
          

          </tbody>
        </table>

        
      </div>
    </div>
  );
}