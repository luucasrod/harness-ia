const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function check() {
  // Get ALL modules first
  const allModules = await prisma.module.findMany({
    orderBy: { id: 'asc' }
  });

  console.log('\n=== ALL MODULES ===');
  allModules.forEach(m => {
    console.log(`Module ${m.id}: courseId=${m.courseId}, "${m.title}"`);
  });

  // Now get course 1 modules with lessons
  const course = await prisma.course.findUnique({
    where: { id: 1 },
    include: { modules: { include: { lessons: true }, orderBy: { order: 'asc' } } }
  });

  console.log('\n=== COURSE 1 STRUCTURE ===');
  if (course) {
    console.log(`Course: "${course.title}"`);
    console.log(`Modules count: ${course.modules.length}`);
    console.log('\nModules:');
    course.modules.forEach(m => {
      console.log(`  ${m.id}. "${m.title}" (order: ${m.order}, lessons: ${m.lessons.length})`);
    });
  }

  await prisma.$disconnect();
}

check().catch(e => {
  console.error(e);
  process.exit(1);
});
