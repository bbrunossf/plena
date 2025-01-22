import type { MetaFunction } from "@remix-run/node";
import { useState } from "react";

export const meta: MetaFunction = () => {
  return [{ title: "Date Conversion Tutorial" }];
};

export default function DateConversionTutorial() {
  const [currentDate] = useState(new Date());
  
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Date Conversion Tutorial</h1>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">1. Date Object</h2>
        <p className="mb-4">The native JavaScript Date object is the foundation for date handling:</p>
        <pre className="bg-gray-100 p-4 rounded-md">
          {`const now = new Date();  // Current date and time
const specific = new Date('2024-01-15T12:00:00');
const timestamp = new Date(1705312800000);

// Current example:
${currentDate.toString()}`}
        </pre>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">2. Common Date Formats</h2>
        <div className="grid grid-cols-1 gap-4">
          <DateExample 
            title="ISO String" 
            value={currentDate.toISOString()} 
            code={`date.toISOString()`}
          />
          <DateExample 
            title="Locale String" 
            value={currentDate.toLocaleString()} 
            code={`date.toLocaleString()`}
          />
          <DateExample 
            title="Unix Timestamp (ms)" 
            value={currentDate.getTime().toString()} 
            code={`date.getTime()`}
          />
          <DateExample 
            title="Unix Timestamp (s)" 
            value={Math.floor(currentDate.getTime() / 1000).toString()} 
            code={`Math.floor(date.getTime() / 1000)`}
          />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">3. Conversion Functions</h2>
        <div className="space-y-4">
          <CodeExample
            title="ISO to Date Object"
            code={`
function isoToDate(isoString: string): Date {
  return new Date(isoString);
}

// Example:
const date = isoToDate('2024-01-15T12:00:00.000Z');`}
          />

          <CodeExample
            title="Timestamp to Date Object"
            code={`
function timestampToDate(timestamp: number): Date {
  return new Date(timestamp);
}

// For Unix timestamp in seconds:
function unixTimestampToDate(timestamp: number): Date {
  return new Date(timestamp * 1000);
}`}
          />

          <CodeExample
            title="Date to Formatted String"
            code={`
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

// Example:
const formatted = formatDate(new Date()); // ${new Intl.DateTimeFormat('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }).format(currentDate)}`}
          />
        </div>
      </section>
    </div>
  );
}

function DateExample({ title, value, code }: { title: string; value: string; code: string }) {
  return (
    <div className="border rounded-md p-4">
      <h3 className="font-semibold mb-2">{title}</h3>
      <code className="block bg-gray-100 p-2 rounded-md mb-2">{code}</code>
      <p className="text-gray-600">Result: {value}</p>
    </div>
  );
}

function CodeExample({ title, code }: { title: string; code: string }) {
  return (
    <div className="border rounded-md p-4">
      <h3 className="font-semibold mb-2">{title}</h3>
      <pre className="bg-gray-100 p-2 rounded-md overflow-x-auto">
        <code>{code}</code>
      </pre>
    </div>
  );
}
