import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@doctor-science.com';
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existing) {
    const hash = await bcrypt.hash('Admin@123', 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: hash,
        fullName: 'مدير النظام',
        role: Role.ADMIN,
      },
    });
    console.log('Admin seeded');
  } else {
    console.log('Admin already exists');
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
