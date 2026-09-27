import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

export async function GET(request: Request, { params }: { params: { courseId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json(
        { success: false, error: { code: 'AUTH_REQUIRED', message: 'Autenticação necessária' } },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id, 10);
    const courseId = parseInt(params.courseId, 10);

    const enrollment = await db.enrollment.findFirst({
      where: {
        userId,
        courseId,
      },
    });

    if (!enrollment) {
      return Response.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    const course = await db.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          include: {
            lessons: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!course) {
      return Response.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Course not found' } },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      data: {
        course: {
          id: course.id,
          title: course.title,
          description: course.description,
        },
        modules: course.modules,
      },
      message: 'ok',
    });
  } catch (error) {
    console.error('GET /api/courses/[id] error:', error);
    return Response.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}
