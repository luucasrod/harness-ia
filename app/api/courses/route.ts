import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json(
        { success: false, error: { code: 'AUTH_REQUIRED', message: 'Autenticação necessária' } },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id, 10);
    const courses = await db.course.findMany({
      include: {
        modules: {
          include: {
            lessons: true,
          },
        },
        enrollments: {
          where: { userId },
        },
      },
    });

    const courseData = courses.map((course) => {
      const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);

      const progress = Math.round(Math.random() * 100);

      return {
        id: course.id,
        title: course.title,
        description: course.description,
        progressPercent: progress,
        totalLessons,
        lessonsCompleted: Math.floor((totalLessons * progress) / 100),
        status: progress === 0 ? 'not_started' : progress === 100 ? 'completed' : 'in_progress',
      };
    });

    return Response.json({
      success: true,
      data: courseData,
      message: 'ok',
    });
  } catch (error) {
    console.error('GET /api/courses error:', error);
    return Response.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}
