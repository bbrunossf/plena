import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Consulta os dados da tabela
  const db_eventos = await prisma.$queryRaw
		`SELECT 
        id, 
        titulo,
        descricao,
        strftime('%Y-%m-%d', data_hora_inicio) AS data_hora_inicial,
        strftime('%Y-%m-%d', data_hora_termino) AS data_hora_final,
        dia_inteiro,
        id_obra        
        FROM Agenda`
  console.log(db_eventos);
  
console.log(typeof db_eventos[0].id); // number
console.log(typeof db_eventos[0].titulo); // string
console.log(typeof db_eventos[0].data_hora_inicial); // string

let x = new Date  (db_eventos[0].data_hora_inicial); //'2025-01-21',
console.log(x); //2025-01-21T00:00:00.000Z; o output é sempre nesse formato
console.log(typeof(x)); //object

console.log("convertendo do Date object para um string no formato ISO8061")

let xx1 = x.toISOString(); //2025-01-21T00:00:00.000Z, só que agora é uma string, e não um object
console.log(xx1);

//let xx2 = x.toISOString().replace("T", " ").replace("Z", ""); //"2025-01-21 00:00:00.000"
//let xx2 = x.toISOString().replace("T", " "); //2025-01-21 00:00:00.000Z
//let xx2 = x.toISOString().replace("T", " ").replace(".000Z", ""); //"2025-01-21 00:00:00"
//let xx2 = x.toISOString().replace(".000Z", ""); //"2025-01-21T00:00:00"
let xx2 = x.toISOString().replace("T", " ").replace(".000Z", ""); //"2025-01-21 00:00:00.000"
console.log("Agora retirando o T:", xx2);

// await prisma.$executeRaw`
  // UPDATE Agenda
  // SET data_hora_inicio = ${xx2}
  // WHERE id = ${db_eventos[0].id}
// `;
// console.log("Registro atualizado com sucesso!");	

// atualizar o registro, inserindo essa data x
await prisma.agenda.update({
  where: {
    id: db_eventos[0].id, // Usando o ID do evento como referência
  },
  data: {
    data_hora_inicio: new Date('1998-12-24T06:22:33.444Z') , // Salvando a nova data no campo correspondente
  },
});
console.log("Registro atualizado com sucesso!");



}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
