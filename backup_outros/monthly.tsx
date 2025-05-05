import { json } from "@remix-run/node"
import { useLoaderData } from "@remix-run/react"
import { useState } from "react"
import { ChartComponent, SeriesCollectionDirective, SeriesDirective, Inject, ColumnSeries, Legend, Category, DataLabel } from '@syncfusion/ej2-react-charts'
import _ from 'lodash'
import { prisma } from "~/db.server";

//ih, tem que corrigir a query conforme o banco de dados

export async function loader() {
  const employees = await prisma.employee.findMany({
    include: {
      timeEntries: true
    }
  })
  return json({ employees })
}

export default function MonthlyHours() {
  const { employees } = useLoaderData()
  const [selectedEmployee, setSelectedEmployee] = useState(employees[0]?.id)

  const monthlyData = React.useMemo(() => {
    if (!selectedEmployee) return []
    
    const employeeEntries = employees.find(emp => emp.id === selectedEmployee)?.timeEntries || []
    
    return _.chain(employeeEntries)
      .groupBy(entry => new Date(entry.date).getMonth())
      .map((entries, month) => ({
        month: new Date(2024, month, 1).toLocaleString('default', { month: 'long' }),
        hours: _.sumBy(entries, 'hours')
      }))
      .value()
  }, [selectedEmployee, employees])

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Monthly Hours by Employee</h1>
      
      <div className="mb-6">
        {employees.map(employee => (
          <label key={employee.id} className="mr-4">
            <input
              type="radio"
              name="employee"
              value={employee.id}
              checked={selectedEmployee === employee.id}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="mr-2"
            />
            {employee.name}
          </label>
        ))}
      </div>

      <div className="w-full h-[500px]">
        <ChartComponent
          primaryXAxis={{
            valueType: 'Category',
            title: 'Month'
          }}
          primaryYAxis={{
            title: 'Hours',
            minimum: 0
          }}
          title="Monthly Hours Distribution"
        >
          <Inject services={[ColumnSeries, Legend, Category, DataLabel]} />
          <SeriesCollectionDirective>
            <SeriesDirective
              dataSource={monthlyData}
              xName="month"
              yName="hours"
              type="Column"
              name="Hours"
              marker={{ dataLabel: { visible: true } }}
            />
          </SeriesCollectionDirective>
        </ChartComponent>
      </div>
    </div>
  )
}
