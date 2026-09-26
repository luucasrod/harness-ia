import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean up (only in dev)
  if (process.env.NODE_ENV !== 'production') {
    await db.exerciseSubmission.deleteMany({});
    await db.userSkill.deleteMany({});
    await db.userProgress.deleteMany({});
    await db.exercise.deleteMany({});
    await db.lesson.deleteMany({});
    await db.module.deleteMany({});
    await db.enrollment.deleteMany({});
    await db.course.deleteMany({});
    await db.user.deleteMany({});
  }

  // Create test user
  const testUser = await db.user.create({
    data: {
      email: 'student@example.com',
      name: 'Lucas Developer',
      password_hash: bcrypt.hashSync('password123', 10),
      role: 'STUDENT',
    },
  });
  console.log('✓ Created test user:', testUser.email);

  // Create Module 1: Fundação de Engenharia
  const module1 = await db.module.create({
    data: {
      title: 'Fundação de Engenharia',
      order: 1,
      lessons: {
        create: [
          {
            title: 'Arquitetura de Sistemas',
            type: 'CONTENT',
            order: 1,
            content: '# Arquitetura de Sistemas\n\nIntrodução aos blocos fundamentais...',
            duration: 45,
          },
          {
            title: 'Padrões de Design',
            type: 'CONTENT',
            order: 2,
            content: '# Padrões de Design\n\nDesign patterns mais comuns...',
            duration: 50,
          },
          {
            title: 'Boas Práticas de Código',
            type: 'CONTENT',
            order: 3,
            content: '# Boas Práticas\n\nSOLID, DRY, KISS...',
            duration: 40,
          },
          {
            title: 'Debugging & Troubleshooting',
            type: 'CONTENT',
            order: 4,
            content: '# Debugging\n\nTécnicas e ferramentas...',
            duration: 60,
          },
        ],
      },
    },
    include: { lessons: true },
  });
  console.log('✓ Created Module 1 with', module1.lessons.length, 'lessons');

  // Create a course to hold the module
  const course = await db.course.create({
    data: {
      title: 'Programação & Engenharia de Software',
      description: 'Aprenda a construir, entender, revisar e debugar software usando IA',
      imageUrl: '/course-cover.png',
      order: 1,
      modules: {
        connect: [{ id: module1.id }],
      },
    },
  });
  console.log('✓ Created course:', course.title);

  // Enroll test user in course
  const enrollment = await db.enrollment.create({
    data: {
      userId: testUser.id,
      courseId: course.id,
    },
  });
  console.log('✓ Enrolled test user in course');

  // Create initial skill records
  const skills = [
    'Architecture',
    'Design Patterns',
    'Code Quality',
    'Debugging',
    'Git',
    'HTTP & APIs',
    'Databases',
  ];

  for (const skill of skills) {
    await db.userSkill.create({
      data: {
        userId: testUser.id,
        skillName: skill,
        proficiency: 0,
        level: 'BEGINNER',
      },
    });
  }
  console.log('✓ Created', skills.length, 'skill records');

  console.log('✅ Database seeded successfully!');
  console.log('\nTest credentials:');
  console.log('Email: student@example.com');
  console.log('Password: password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
