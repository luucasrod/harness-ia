import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

export async function GET(request: Request, { params }: { params: { courseId: string } }) {
  try {
    const userId = 1;
    const courseId = parseInt(params.courseId, 10);

    const course = await db.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          include: {
            lessons: true,
          },
        },
      },
    });

    if (!course) {
      return Response.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Course not found' } },
        { status: 404 }
      );
    }

    const progress = await db.userProgress.findMany({
      where: {
        userId,
      },
      include: {
        lesson: true,
        module: true,
      },
    });

    const moduleProgress = course.modules.map((module) => {
      const moduleLessons = module.lessons;
      const completedLessons = progress.filter(
        (p) => p.moduleId === module.id && p.completed
      ).length;

      return {
        moduleId: module.id,
        title: module.title,
        completed: completedLessons,
        total: moduleLessons.length,
        percent: moduleLessons.length > 0 ? Math.round((completedLessons / moduleLessons.length) * 100) : 0,
      };
    });

    const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
    const completedLessons = progress.filter((p) => p.completed).length;
    const overallPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    return Response.json({
      success: true,
      data: {
        moduleProgress,
        overallPercent,
        completedLessons,
        totalLessons,
      },
      message: 'ok',
    });
  } catch (error) {
    console.error('GET /api/courses/[id]/progress error:', error);
    return Response.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}
