// routes/hours.tsx
import { json, LoaderFunction } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { useState, useMemo } from 'react';
import { prisma } from '~/db.server';

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

// Loader: busca dados do banco
export const loader: LoaderFunction = async () => {
  const registros = await prisma.registro.findMany({
    select: {
      id_registro: true,
      timestamp: true,
      duracao_minutos: true,
      hora_extra: true,
      obra: { select: { nome_obra: true, cod_obra: true } },
      tipoTarefa: { select: { nome_tipo: true } },
      categoria: { select: { nome_categoria: true } },
      pessoa: { select: { nome: true } }
    }
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

  const nomesUnicos = Array.from(new Set(registros.map(r => r.pessoa.nome)));

  return json({ registros : registrosMapeados, nomesUnicos });
};

// Componente React
export default function HoursPage() {
  const { registros, nomesUnicos } = useLoaderData<typeof loader>();
  const [selectedEmployee, setSelectedEmployee] = useState('');

  const registrosFiltrados = useMemo(() => {
    return selectedEmployee      
      ? registros.filter(r => r.nome === selectedEmployee)  // Correto!
      : registros;
  }, [selectedEmployee, registros]);

  return (
    <div>
      <h1>Registros de Horas</h1>

      <div>
        <label htmlFor="funcionario">Selecionar Funcionário:</label>
        <select
          id="funcionario"
          value={selectedEmployee}
          onChange={e => setSelectedEmployee(e.target.value)}
        >
          <option value="">Todos</option>
          {nomesUnicos.map(nome => (
            <option key={nome} value={nome}>
              {nome}
            </option>
          ))}
        </select>
      </div>

      <table border="1" cellPadding="5" style={{ marginTop: '20px', width: '100%' }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nome</th>
            <th>Obra</th>
            <th>Código</th>
            <th>Tipo</th>
            <th>Categoria</th>
            <th>Data/Hora</th>
            <th>Duração (min)</th>
            <th>Dia da Semana</th>
            <th>Hora Extra</th>
          </tr>
        </thead>
        <tbody>
          {registrosFiltrados.map(r => (
            <tr key={r.id_registro}>
              <td>{r.id_registro}</td>
              <td>{r.nome}</td>
              <td>{r.nome_obra}</td>
              <td>{r.cod_obra}</td>
              <td>{r.nome_tipo}</td>
              <td>{r.nome_categoria}</td>
              <td>{r.timestamp}</td>
              <td>{r.horas_trabalhadas}</td>
              <td>{r.dia_semana}</td>
              <td>{r.hora_extra ? 'Sim' : 'Não'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
