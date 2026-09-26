import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');
  if (process.env.NODE_ENV !== 'production') {
    await db.$executeRaw`DELETE FROM "User"`;
    await db.$executeRaw`DELETE FROM "Course"`;
    await db.$executeRaw`DELETE FROM "Module"`;
    await db.$executeRaw`DELETE FROM "Lesson"`;
    await db.$executeRaw`DELETE FROM "Enrollment"`;
  }
  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
