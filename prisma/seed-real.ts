import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

async function main() {
  console.log('🌱 Seeding real Module 1 data...');

  await db.$executeRaw`DELETE FROM "UserProgress"`;
  await db.$executeRaw`DELETE FROM "ExerciseSubmission"`;
  await db.$executeRaw`DELETE FROM "Exercise"`;
  await db.$executeRaw`DELETE FROM "UserSkill"`;
  await db.$executeRaw`DELETE FROM "Enrollment"`;
  await db.$executeRaw`DELETE FROM "Lesson"`;
  await db.$executeRaw`DELETE FROM "Module"`;
  await db.$executeRaw`DELETE FROM "Course"`;
  await db.$executeRaw`DELETE FROM "User"`;

  console.log('✅ Database cleared');

  const passwordHash = await bcrypt.hash('password123', 10);

  const testUser = await db.user.create({
    data: {
      email: 'student@example.com',
      name: 'Test Student',
      password_hash: passwordHash,
      role: 'STUDENT',
    },
  });

  console.log(`✅ Test user created: ${testUser.email}`);

  const course = await db.course.create({
    data: {
      title: 'Fundação de Engenharia',
      description: 'Módulo introdutório com arquitetura, padrões, boas práticas e debugging',
      order: 1,
    },
  });

  console.log(`✅ Course created: ${course.title}`);

  const module1 = await db.module.create({
    data: {
      title: 'Fundação de Engenharia',
      courseId: course.id,
      order: 1,
    },
  });

  console.log(`✅ Module created`);

  const lessons = [
    {
      title: 'Arquitetura de Sistemas',
      content: '# Arquitetura de Sistemas\n\nEntenda os blocos fundamentais de arquitetura de software.',
      order: 1,
    },
    {
      title: 'Padrões de Design',
      content: '# Padrões de Design\n\nAprenda padrões conhecidos para problemas comuns.',
      order: 2,
    },
    {
      title: 'Boas Práticas',
      content: '# Boas Práticas\n\nConvenções e padrões que melhoram a qualidade do código.',
      order: 3,
    },
    {
      title: 'Debugging e Testing',
      content: '# Debugging e Testing\n\nTécnicas para encontrar e corrigir bugs.',
      order: 4,
    },
  ];

  const createdLessons = await Promise.all(
    lessons.map((lesson) =>
      db.lesson.create({
        data: {
          ...lesson,
          moduleId: module1.id,
          type: 'CONTENT',
          duration: 30,
        },
      })
    )
  );

  console.log(`✅ ${createdLessons.length} lessons created`);

  for (const lesson of createdLessons) {
    await db.exercise.create({
      data: {
        title: `Quiz: ${lesson.title}`,
        description: 'Teste seu conhecimento',
        lessonId: lesson.id,
      },
    });
  }

  console.log('✅ Exercises created');

  await db.enrollment.create({
    data: {
      userId: testUser.id,
      courseId: course.id,
    },
  });

  console.log('✅ User enrolled in course');

  for (const lesson of createdLessons) {
    await db.userProgress.create({
      data: {
        userId: testUser.id,
        lessonId: lesson.id,
        moduleId: module1.id,
        completed: false,
      },
    });
  }

  console.log('✅ Progress records created');

  console.log('');
  console.log('=== SEED COMPLETE ===');
  console.log(`Test Account:`);
  console.log(`  Email: ${testUser.email}`);
  console.log(`  Password: password123`);
  console.log(`  Course: ${course.title}`);
  console.log(`  Lessons: ${createdLessons.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
