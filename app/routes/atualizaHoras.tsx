//resolvido o errdo com gricomponent (não vou usar mais a syncfusion nessa rota)
//agora tem que rever a lógica dos estados das checkboxes e a função action para atualizar os registros no banco de dados

import { json, LoaderFunction, ActionFunction } from '@remix-run/node';
import { useMemo } from 'react';
import { useEffect } from 'react';
import _ from "lodash";
import { Form } from "@remix-run/react";
import { useLoaderData } from 'react-router-dom';
import { useState } from 'react';

import DataGrid from 'react-data-grid';
import 'react-data-grid/lib/styles.css';

import { prisma } from "~/db.server";

// Lista de feriados
const feriados = [
  { data: '2025-01-01', nome: 'Confraternização Universal' },
  { data: '2025-03-03', nome: 'Carnaval' },
  { data: '2025-03-04', nome: 'Carnaval' },
  { data: '2025-03-05', nome: 'Quarta-feira de Cinzas' },
  { data: '2025-04-18', nome: 'Sexta-feira Santa' },
  { data: '2025-04-21', nome: 'Tiradentes' },
  //28-04 foi dia normal de trabalho; dia 29-04 foi feriado (trocamos)
  { data: '2025-04-29', nome: 'N. S. da Penha' },  
  { data: '2025-05-01', nome: 'Dia do Trabalhador' },
  { data: '2025-06-19', nome: 'Corpus Christi' },
  { data: '2025-09-07', nome: 'Independência do Brasil' },
  { data: '2025-10-12', nome: 'Nossa Senhora Aparecida' },
  { data: '2025-11-02', nome: 'Finados' },
  { data: '2025-11-15', nome: 'Proclamação da República' },
  { data: '2025-11-20', nome: 'Consciencia Negra' },
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
    { hora_extra: 'desc' },
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


export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const selectedIds = formData.getAll('selectedIds');

  console.log("selectedIds:", selectedIds);
  
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
// parece que é executado a cada interação do usuário com as checkboxes;é o comportamento normal do React.
export default function HoursPage() {
   const data = useLoaderData();
   //const registros = data.registros;   
   const { registros, nomesUnicos } = data; // Desestruturando os dados 
   //const registros: any = useLoaderData();
  
   //console.log('Registros:', registros[0]);
  //console.log('Nomes Únicos:', nomesUnicos);

  //const [selectedHours, setSelectedHours] = useState({}); // Mapeia os registros selecionados
  const [selectedEmployee, setSelectedEmployee] = useState(''); // Estado para o funcionário selecionado  
    
  // const handleCheckboxChange = (id) => {
  //   setRegistrosLocais((prev) =>
  //     prev.map((registro) =>
  //       registro.id_registro === id
  //         ? { ...registro, hora_extra: !registro.hora_extra }
  //         : registro
  //     )
  //   );
  // };

  const handleCheckboxChange = (id) => {
    setChangedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id); // Remove se já estava marcado como alterado
      } else {
        newSet.add(id); // Adiciona se não estava
      }
      return newSet;
    });
  };
  

// Filtra os registros pelo nome do funcionário selecionado
// Se não houver funcionário selecionado, retorna todos os registros
const registrosFiltrados = useMemo(() => {
  return selectedEmployee      
    ? registros.filter(r => r.nome === selectedEmployee)  // Correto!
    : registros;
}, [selectedEmployee, registros]);

//const [registrosLocais, setRegistrosLocais] = useState(registrosFiltrados);

// useEffect(() => {
//   setRegistrosLocais(registrosFiltrados);
// }, [registrosFiltrados]);

// Substitua por apenas um estado para mudanças:
const [changedIds, setChangedIds] = useState(new Set());


// Define columns for React Data Grid
const columns = [
  { key: 'nome_obra', name: 'Obra', width: 250 },
  { key: 'cod_obra', name: 'Código da Obra', width: 120 },
  { key: 'nome_tipo', name: 'Tipo de Tarefa', width: 250 },
  { key: 'nome_categoria', name: 'Categoria', width: 120 },
  { key: 'timestamp', name: 'Data e Hora', width: 200 },
  { key: 'nome', name: 'Nome', width: 150 },
  { key: 'horas_trabalhadas', name: 'Minutos', width: 80 },
  { 
    key: 'dia_semana', 
    name: 'Dia da Semana', 
    width: 250,
    renderCell: ({ row }) => (
      <span title={row.ehFeriado ? `Feriado: ${row.nomeFeriado}` : ''}>
        {row.dia_semana}
      </span>
    )
  }, 

  //formatter é o padrão correto para customizar exibição de células no react-data-grid, pelo menos nessa versão (7.0.0-beta.27)
  {
    key: 'hora_extra',
    name: 'Hora Extra',
    width: 100,
    formatter: ({ row }) => (    
      <input
        type="checkbox"
        // checked={row.hora_extra}
        // onChange={() => handleCheckboxChange(row.id_registro)}
        checked={changedIds.has(row.id_registro) ? !row.hora_extra : row.hora_extra}
        onChange={() => handleCheckboxChange(row.id_registro)}
        className="mx-auto"
      />
    )
  }
];

// {Object.keys(selectedHours).filter(id => selectedHours[id]).map(id => (
//   <input key={id} type="hidden" name="selectedIds" value={id} />
// ))}

return (
  <div>
    <h1>Registro de Horas</h1>
    <Form method="post">
      {Array.from(changedIds).map(id => (
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

      {/* React Data Grid - Much simpler! */}
      <div className="mb-4" style={{ height: '900px' }}>
          <DataGrid            
            columns={columns}
            rows={registrosFiltrados}
            //rows={registrosLocais}
            rowKeyGetter={(row) => row.id_registro}
            className="rdg-light" // or "rdg-dark" for dark theme
            defaultColumnOptions={{
              sortable: true,
              resizable: true
            }}
          />
        </div>
      
      <button type="submit" className="btn btn-primary mt-3 bg-red-400">
        Marcar como Hora Extra
      </button>
    </Form>
  </div>
);
};
