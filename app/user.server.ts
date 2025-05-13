import type { User } from "@prisma/client";
import bcrypt from "bcryptjs";

import { prisma } from "~/db.server";

export type { User } from "@prisma/client";

export async function getUserById(id: User["id"]) {
  return prisma.user.findUnique({ where: { id } });
}


export async function verifyLogin(
  name: User["name"],
  password: string,
) {
  const userWithPassword = await prisma.user.findUnique({
    where: { name }
  });

  if (!userWithPassword || !userWithPassword.password) {
    return null;
  }

  const isValid = await bcrypt.compare(
    password,
    userWithPassword.password,
  );

  if (!isValid) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _password, ...userWithoutPassword } = userWithPassword;

  return userWithoutPassword;
}

export async function changeUserPassword(
  userId: number, 
  currentPassword: string, 
  newPassword: string
) {
  // Busca o usuário pelo ID
  const user = await prisma.user.findUnique({ 
    where: { id: userId } 
  });

  if (!user) {
    throw new Error("Usuário não encontrado");
  }

  // Verifica a senha atual
  const isCurrentPasswordValid = await bcrypt.compare(
    currentPassword, 
    user.password
  );

  if (!isCurrentPasswordValid) {
    throw new Error("Senha atual incorreta");
  }

  // Gera novo hash para a nova senha
  const hashedNewPassword = await bcrypt.hash(newPassword, 10);

  // Atualiza a senha no banco de dados
  await prisma.user.update({
    where: { id: userId },
    data: { 
      password: hashedNewPassword      
    }
  });

  return { message: "Senha alterada com sucesso" };
}