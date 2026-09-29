import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  _request: Request,
  context: RouteContext<'/api/courses/[courseId]/modules/[moduleId]'>
) {
  const { courseId, moduleId } = await context.params;

  try {
    const module = await prisma.module.findUnique({
      where: { id: Number(moduleId) },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            duration: true,
            content: false,
          },
        },
        course: { select: { id: true } },
      },
    });

    if (!module || module.course?.id !== Number(courseId)) {
      return Response.json({ message: 'Module not found' }, { status: 404 });
    }

    return Response.json({
      moduleId: module.id,
      moduleTitle: module.title,
      courseId,
      lessons: module.lessons,
    });
  } catch (error) {
    console.error('Error fetching module:', error);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
