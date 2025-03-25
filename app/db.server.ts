// import { enhance } from '@zenstackhq/runtime';

// export function getEnhancedPrisma(userId: string) {
//     return enhance(prisma, { user: { id: userId } });
// }

import { PrismaClient } from '@prisma/client'
// const prisma = new PrismaClient()

// export default prisma

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

export { prisma }