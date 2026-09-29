import { db } from '@/lib/prisma';

type RouteParams = {
  params: Promise<{
    courseId: string;
    moduleId: string;
  }>;
};

export async function GET(
  _request: Request,
  context: RouteParams
) {
  const { courseId, moduleId } = await context.params;

  try {
    const moduleRecord = await db.module.findUnique({
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

    if (!moduleRecord || moduleRecord.course?.id !== Number(courseId)) {
      return Response.json({ message: 'Module not found' }, { status: 404 });
    }

    return Response.json({
      moduleId: moduleRecord.id,
      moduleTitle: moduleRecord.title,
      courseId,
      lessons: moduleRecord.lessons,
    });
  } catch (error) {
    console.error('Error fetching module:', error);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
