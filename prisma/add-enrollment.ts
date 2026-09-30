import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addEnrollment() {
  console.log('📝 Adding enrollment for demo@example.com to Course 1...\n');

  try {
    const user = await prisma.user.findUnique({ where: { email: 'demo@example.com' } });
    if (!user) {
      console.error('❌ Demo user not found');
      process.exit(1);
    }

    const course = await prisma.course.findUnique({ where: { id: 1 } });
    if (!course) {
      console.error('❌ Course 1 not found');
      process.exit(1);
    }

    const existingEnrollment = await prisma.enrollment.findFirst({
      where: { userId: user.id, courseId: 1 },
    });

    if (existingEnrollment) {
      console.log(`✅ Enrollment already exists for ${user.email} in Course 1`);
    } else {
      await prisma.enrollment.create({
        data: {
          userId: user.id,
          courseId: 1,
          enrolledAt: new Date(),
        },
      });
      console.log(`✅ Enrollment created for ${user.email} in Course 1`);
    }

    console.log('\n✨ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addEnrollment();
