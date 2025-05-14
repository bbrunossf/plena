import { json, LoaderFunction, ActionFunction } from '@remix-run/node';
import { useLoaderData } from 'react-router-dom';
import { useState } from 'react';
import { GridComponent, ColumnDirective, ColumnsDirective } from '@syncfusion/ej2-react-grids';
import { CheckBoxComponent } from '@syncfusion/ej2-react-buttons';
import { prisma } from "~/db.server";

// Loader para buscar os registros
export const loader = async () => {
  const registros = await prisma.$queryRaw`
    SELECT 
      o.nome_obra,
      o.cod_obra,
      t.nome_tipo,
      cat.nome_categoria,
      --p.hourlyRate,
      p.nome,
      
      strftime('%d/%m/%Y %H:%M:%S', timestamp) AS data_hora,
      r.duracao_minutos AS horas_trabalhadas,
      r.timestamp,
      
      CASE strftime('%w', r.timestamp)
        WHEN '0' THEN 'Domingo'
        WHEN '1' THEN 'Segunda-feira'
        WHEN '2' THEN 'Terça-feira'
        WHEN '3' THEN 'Quarta-feira'
        WHEN '4' THEN 'Quinta-feira'
        WHEN '5' THEN 'Sexta-feira'
        WHEN '6' THEN 'Sábado'
      END AS dia_semana 
      
    FROM Registro r
    INNER JOIN Obra o ON r.id_obra = o.id_obra
    INNER JOIN TipoTarefa t ON r.id_tipo_tarefa = t.id_tipo_tarefa
    INNER JOIN Categoria cat ON r.id_categoria = cat.id_categoria
    INNER JOIN Pessoa p ON r.id_nome = p.id_nome
    WHERE 
      (strftime('%w', r.timestamp) IN ('0', '6')) -- Sábado ('6') ou Domingo ('0')
      OR (strftime('%H', r.timestamp) >= '19') -- Registros após as 19h
    ORDER BY r.timestamp DESC, t.nome_tipo
  `;

    
  return json( registros);
};

// Ação para atualizar os registros
export const action: ActionFunction = async ({ request }) => {
  const formData = new URLSearchParams(await request.text());
  const updates = formData.getAll('hora_extra'); // Obtém os registros que devem ser atualizados

  // Insira aqui a lógica para atualizar os registros no banco de dados
  // Atualize os registros marcados como 'hora_extra'

  return null; // Ou retorne um redirecionamento
};

// Componente principal
const HoursPage = () => {
const registros: any = useLoaderData();
  //console.log('Registros:', registros);
  const [selectedHours, setSelectedHours] = useState({}); // Mapeia os registros selecionados

  const handleCheckboxChange = (id) => {
    setSelectedHours((prev) => ({
      ...prev,
      [id]: !prev[id], // Alterna o estado do checkbox
    }));
  };

  const handleUpdate = async () => {
    const updates = Object.keys(selectedHours).filter(key => selectedHours[key]);
    
    // Crie a lógica para enviar os dados selecionados para a ação de atualização
    // Exemplo: fetch('/hours', { method: 'POST', body: JSON.stringify(updates) });

    console.log('Atualizando registros:', updates);
  };

  const checkboxTemplate = (props) => {
    return (
      <CheckBoxComponent 
        checked={selectedHours[props.id] || false}
        onChange={() => handleCheckboxChange(props.id)}
      />
    );
  };

//   <ColumnDirective field='timestamp' headerText='Data e Hora' width='200' textAlign='Center' />
//           <ColumnDirective 
//             field='id' 
//             headerText='Hora Extra' 
//             width='100' 
//             template={checkboxTemplate} 
//             textAlign='Center' 
//           />

  return (
    <div>
      <h1>Registro de Horas</h1>
      <GridComponent       
      dataSource={registros} allowPaging={true} allowSorting={true}>
        <ColumnsDirective>        
            <ColumnDirective field='nome_obra' headerText='Obra' width='150' textAlign='Center' />
            <ColumnDirective field='cod_obra' headerText='Código da Obra' width='150' textAlign='Center' />
            <ColumnDirective field='nome_tipo' headerText='Tipo de Tarefa' width='150' textAlign='Center' />
            <ColumnDirective field='nome_categoria' headerText='Categoria' width='150' textAlign='Center' />
            <ColumnDirective field='nome' headerText='Nome' width='150' textAlign='Center' />
            <ColumnDirective field='horas_trabalhadas' headerText='Horas Trabalhadas' width='150' textAlign='Center' />
            <ColumnDirective field='dia_semana' headerText='Dia da Semana' width='150' textAlign='Center' />          
        </ColumnsDirective>
      </GridComponent>
      <button onClick={handleUpdate}>Atualizar</button>
    </div>
  );
};

export default HoursPage;