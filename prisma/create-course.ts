import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function createCourse() {
  console.log('🌱 Creating main course...');
  
  const course = await db.course.create({
    data: {
      title: 'Engenharia de Software - Fundação Completa',
      description: 'Curso profundo sobre Engenharia de Software com foco em arquitetura escalável, padrões de design, boas práticas e projeto realista.',
      order: 1,
    },
  });
  
  console.log(`✅ Course created: ${course.title} (ID: ${course.id})`);
}

createCourse()
  .catch((e) => {
    console.error('❌ Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
