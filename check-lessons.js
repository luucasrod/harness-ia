const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function check() {
  const modules = await prisma.module.findMany({
    where: { courseId: 1 },
    include: { lessons: true },
    orderBy: { id: 'asc' }
  });

  console.log('\nModules and Lesson Counts:');
  console.log('='.repeat(60));

  modules.forEach(m => {
    console.log(`Module ${m.id}: "${m.title}" - ${m.lessons.length} lessons`);
    if (m.lessons.length > 0) {
      m.lessons.forEach(l => {
        console.log(`  └─ Lesson ${l.id}: "${l.title}"`);
      });
    }
  });

  await prisma.$disconnect();
}

check().catch(e => {
  console.error(e);
  process.exit(1);
});
