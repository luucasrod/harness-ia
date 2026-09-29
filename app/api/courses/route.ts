import { getServerSession } from 'next-auth';

import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/prisma';

export async function GET() {
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
            lessons: {
              include: {
                progress: {
                  where: {
                    userId,
                    completed: true,
                  },
                },
              },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
        enrollments: {
          where: { userId },
        },
      },
      orderBy: { order: 'asc' },
    });

    const courseData = courses.map((course) => {
      const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
      const completedLessonIds = new Set(
        course.modules.flatMap((module) =>
          module.lessons
            .filter((lesson) => lesson.progress.length > 0)
            .map((lesson) => lesson.id)
        )
      );
      const lessonsCompleted = completedLessonIds.size;
      const progress =
        totalLessons > 0 ? Math.round((lessonsCompleted / totalLessons) * 100) : 0;

      return {
        id: course.id,
        title: course.title,
        description: course.description,
        progressPercent: progress,
        totalLessons,
        lessonsCompleted,
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
  }
}
