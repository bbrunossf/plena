
import bcrypt from "bcryptjs";

import { PrismaClient } from '@prisma/client'


let prisma: PrismaClient
declare global {
  var __db: PrismaClient | undefined
}

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient()
  prisma.$connect()
} else {
  if (!global.__db) {
    global.__db = new PrismaClient({
      //log: ['query', 'info', 'warn', 'error'],
  });
    global.__db.$connect()
  }
  prisma = global.__db
}



async function main() {
  const userName = "Leonardo";
  const newPassword = "123";

  const user = await prisma.user.findUnique({
    where: { name: userName },
  });

  if (!user) {
    console.error(`Usuário '${userName}' não encontrado.`);
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { name: userName },
    data: { password: hashedPassword },
  });

  console.log(`Senha do usuário '${userName}' foi redefinida com sucesso.`);
}

main()
  .catch((e) => {
    console.error("Erro ao redefinir a senha:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
