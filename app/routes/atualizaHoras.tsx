import { json, LoaderFunction, ActionFunction } from '@remix-run/node';
import { useMemo } from 'react';
import { useEffect } from 'react';
import _ from "lodash";
import { Form } from "@remix-run/react";
import { useLoaderData } from 'react-router-dom';
import { useState } from 'react';
import { GridComponent, 
  ColumnDirective,
  ColumnsDirective,   
  Inject,
  Page,
  Toolbar,  
  SelectionSettingsModel,
  Selection,
  SelectionMode,
  Sort  
   } from '@syncfusion/ej2-react-grids';
import { CheckBoxComponent } from '@syncfusion/ej2-react-buttons';
import { prisma } from "~/db.server";

// Lista de feriados (adicione/remova conforme necessário)
const feriados = [
  { data: '2025-01-01', nome: 'Confraternização Universal' },
  { data: '2025-02-17', nome: 'Carnaval' },
  { data: '2025-02-18', nome: 'Carnaval' },
  { data: '2025-04-18', nome: 'Sexta-feira Santa' },
  { data: '2025-04-21', nome: 'Tiradentes' },
  { data: '2025-05-01', nome: 'Dia do Trabalhador' },
  { data: '2025-09-07', nome: 'Independência do Brasil' },
  { data: '2025-10-12', nome: 'Nossa Senhora Aparecida' },
  { data: '2025-11-02', nome: 'Finados' },
  { data: '2025-11-15', nome: 'Proclamação da República' },
  { data: '2025-12-25', nome: 'Natal' }
];

// Função para verificar se uma data é feriado
const isFeriado = (timestamp: string | Date): { isFeriado: boolean; nomeFeriado?: string } => {
  const dateString = new Date(timestamp).toISOString().split('T')[0];    
  const feriado = feriados.find(f => f.data === dateString);
  return {
    isFeriado: !!feriado,
    nomeFeriado: feriado?.nome
  };
};

// Loader para buscar os registros
export const loader = async () => {  
  const registros = await prisma.registro.findMany({
  select: {
    id_registro: true,
    timestamp: true,
    duracao_minutos: true,
    hora_extra: true,
    obra: {
      select: {
        nome_obra: true,
        cod_obra: true
      }
    },
    tipoTarefa: {
      select: {
        nome_tipo: true
      }
    },
    categoria: {
      select: {
        nome_categoria: true
      }
    },
    pessoa: {
      select: {
        nome: true
      }
    }
  },
  where: {
    OR: [
      { timestamp: { gte: new Date('2025-01-01') } }, // Filtro adicional, se quiser
      {
        AND: [
          { timestamp: { gte: new Date('2025-01-01') } },
          // lógica para hora >= 19h ou sábado/domingo
        ]
      }
    ]
  },
  orderBy: [
    { timestamp: 'asc' },
    { tipoTarefa: { nome_tipo: 'asc' } }
  ]
});

const registrosMapeados = registros
  .filter((r) => {
    const date = new Date(r.timestamp);
    const day = date.getDay(); // 0 = domingo, 6 = sábado
    const hour = date.getHours();
    const { isFeriado: ehFeriado } = isFeriado(r.timestamp);

    //return ehFeriado; //só para testar
    return day === 0 || day === 6 || hour >= 19 || ehFeriado; // Filtro equivalente ao strftime
  })
  .map((r) => {
    const date = new Date(r.timestamp);
    const day = date.getDay();    

    const diasSemana  = [
      'Domingo', 'Segunda-feira', 'Terça-feira',
      'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'
    ];

    const { isFeriado: ehFeriado, nomeFeriado } = isFeriado(r.timestamp);

     // Se for feriado, adiciona informação ao dia da semana
     const dia_semana = ehFeriado 
     ? `${diasSemana[day]} (${nomeFeriado})`
     : diasSemana[day];

    return {
      id_registro: r.id_registro,
      nome_obra: r.obra.nome_obra,
      cod_obra: r.obra.cod_obra,
      nome_tipo: r.tipoTarefa.nome_tipo,
      nome_categoria: r.categoria.nome_categoria,
      nome: r.pessoa.nome,      
      horas_trabalhadas: r.duracao_minutos,
      timestamp: new Date(r.timestamp).toLocaleString().replace(',', ''), // Formatação da data, de ISO para pt-BR
      hora_extra: r.hora_extra,
      dia_semana: dia_semana,
      // Adiciona campos para controle do hover/tooltip
      ehFeriado: ehFeriado,
      nomeFeriado: nomeFeriado
    };
  });
  
  // Nova linha para criar a lista de nomes únicos
  const nomesUnicos = _.uniqBy(registros, "pessoa.nome").map((r) => r.pessoa.nome);
  
  
  //return json( {registros : registrosMapeados});
  return json({ registros : registrosMapeados, nomesUnicos});
};

// Ação para atualizar os registros
// export const action: ActionFunction = async ({ request }) => {
//   const formData = await request.formData();
//   const selectedIds = formData.getAll('selectedIds');
  
//   // Atualizar os registros selecionados no banco de dados
//   for (const id of selectedIds) {
//     await prisma.registro.update({
//       where: { id_registro: parseInt(id.toString()) },
//       data: { hora_extra: true }
//     });
//   }

//   return json({ success: true });
// };
export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const selectedIds = formData.getAll('selectedIds');
  
  // Consultar os registros atuais para verificar o estado de hora_extra
  const registrosAtuais = await prisma.registro.findMany({
    where: { id_registro: { in: selectedIds.map(id => parseInt(id.toString())) } }
  });

  for (const registro of registrosAtuais) {
    const novoEstado = selectedIds.includes(registro.id_registro.toString()) ? !registro.hora_extra : registro.hora_extra;

    // Atualiza o registro no banco de dados
    await prisma.registro.update({
      where: { id_registro: registro.id_registro },
      data: { hora_extra: novoEstado }
    });
  }

  return json({ success: true });
};

// Componente principal
export default function HoursPage() {
   const data = useLoaderData();
   //const registros = data.registros;   
   const { registros, nomesUnicos } = data; // Desestruturando os dados 
   //const registros: any = useLoaderData();
  console.log('Registros:', registros[0]);
  console.log('Nomes Únicos:', nomesUnicos);

  const [selectedHours, setSelectedHours] = useState({}); // Mapeia os registros selecionados
  const [selectedEmployee, setSelectedEmployee] = useState(''); // Estado para o funcionário selecionado  

  

  // const handleCheckboxChange = (id) => {
  //   setSelectedHours((prev) => ({
  //     ...prev,
  //     [id]: !prev[id], // Alterna o estado do checkbox
  //   }));
  // };
  const handleCheckboxChange = (id) => {
    setSelectedHours((prev) => {
      const novoEstado = !prev[id]; // Inverte o estado atual
      //console.log(`Registro ID: ${id}, Hora Extra: ${novoEstado ? 'marcado' : 'desmarcado'}`); // Adiciona o console.log, no cliente
      return {
        ...prev,
        [id]: novoEstado, // Alterna o estado do checkbox
      };
    });
  };

  const handleUpdate = async () => {
    const updates = Object.keys(selectedHours).filter(key => selectedHours[key]);
    
    // Crie a lógica para enviar os dados selecionados para a ação de atualização
    // Exemplo: fetch('/hours', { method: 'POST', body: JSON.stringify(updates) });

    console.log('Atualizando registros:', updates);
  };

  const checkboxTemplate = (props) => {
    const registroId = props.id_registro;
    return (
      // <CheckBoxComponent 
      //   checked={selectedHours[registroId] || props.hora_extra || false}
      //   onChange={() => handleCheckboxChange(registroId)}
      // />
      <input
      type="checkbox"
      checked={selectedHours[registroId] || props.hora_extra || false}
      onChange={() => handleCheckboxChange(registroId)}
    />
    );
  };

  // Template personalizado para a coluna dia_semana com hover
const diaSemanaTemplate = (props) => {
  if (props.ehFeriado) {
    return (
      <span title={`Feriado: ${props.nomeFeriado}`}>
        {props.dia_semana}
      </span>
    );
  }
  return <span>{props.dia_semana}</span>;
};

//   <ColumnDirective field='timestamp' headerText='Data e Hora' width='200' textAlign='Center' />
//           <ColumnDirective 
//             field='id' 
//             headerText='Hora Extra' 
//             width='100' 
//             template={checkboxTemplate} 
//             textAlign='Center' 
//           />

// Format for the GridComponent
//HH = 24 hours, hh = 12 hours
const shipFormat: object = { type: 'dateTime', format: 'dd/MM/yy HH:mm:ss' }; //não precisa mais porque arrumei na query


// Filtra os registros pelo nome do funcionário selecionado
// Se não houver funcionário selecionado, retorna todos os registros
const registrosFiltrados = useMemo(() => {
  return selectedEmployee      
    ? registros.filter(r => r.nome === selectedEmployee)  // Correto!
    : registros;
}, [selectedEmployee, registros]);

useEffect(() => {
  const estadoInicial = {};
  registrosFiltrados.forEach(r => {
    estadoInicial[r.id_registro] = r.hora_extra;
  });
  setSelectedHours(estadoInicial);
}, [selectedEmployee, registrosFiltrados]);



return (
  <div>
    <h1>Registro de Horas</h1>
    <Form method="post">
      {Object.keys(selectedHours).filter(id => selectedHours[id]).map(id => (
        <input key={id} type="hidden" name="selectedIds" value={id} />
      ))}
      
      {/* Menu Dropdown para seleção de funcionário */}
      <div className="mb-4">
        <label htmlFor="funcionario" className="block text-lg font-semibold mb-2">
          Selecionar Funcionário
        </label>
        <select
          id="funcionario"
          value={selectedEmployee}
          onChange={(e) => setSelectedEmployee(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="">Todos</option>
          {nomesUnicos.map((nome) => (
            <option key={nome} value={nome}>
              {nome}
            </option>
          ))}
        </select>
      </div>
      
      <GridComponent       
        dataSource={registrosFiltrados} 
        allowPaging={true} 
        allowSorting={true}
        enableVirtualization={true} // ✅ Ativa virtualização
      >
        <ColumnsDirective>        
          <ColumnDirective field='nome_obra' headerText='Obra' width='200' textAlign='Center' />
          <ColumnDirective field='cod_obra' headerText='Código da Obra' width='100' textAlign='Center' />
          <ColumnDirective field='nome_tipo' headerText='Tipo de Tarefa' width='200' textAlign='Left' />
          <ColumnDirective field='nome_categoria' headerText='Categoria' width='100' textAlign='Left' />
          <ColumnDirective field='timestamp' headerText='Data e Hora' width='200' textAlign='Center' />
          <ColumnDirective field='nome' headerText='Nome' width='150' textAlign='Center' />
          <ColumnDirective field='horas_trabalhadas' headerText='Minutos' width='100' textAlign='Center' />
          <ColumnDirective field='dia_semana' headerText='Dia da Semana' width='200' textAlign='Left' />
          <ColumnDirective 
            field='id_registro' 
            headerText='Hora Extra' 
            width='100' 
            template={checkboxTemplate} 
            textAlign='Center' 
          />
        </ColumnsDirective>
        <Inject services={[Page, Toolbar, Selection, Sort]} />
      </GridComponent>
      
      <button type="submit" className="btn btn-primary mt-3 bg-red-400">
        Marcar como Hora Extra
      </button>
    </Form>
  </div>
);
};
