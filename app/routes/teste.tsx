import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

    const data = await prisma.pessoa.findMany();
    console.log(data);

export default function teste(){
    return (
        <div>
        conectado
        </div>
    );
}



