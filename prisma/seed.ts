import { prisma } from "~/db.server";
import bcrypt from "bcryptjs";

async function main() {
    const name = "Leonardo";
    const hashedPassword = await bcrypt.hash("123", 10);
    const role = "admin";

    const user = await prisma.user.create({
    data: {
        name,
        password: hashedPassword, 
        role: role         
        },      
  });
  console.log(`Database has been seeded. 🌱`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
