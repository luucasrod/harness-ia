import { getServerSession } from 'next-auth';

import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  context: RouteContext<'/api/courses/[courseId]/modules/[moduleId]/lessons/[lessonId]'>
) {
  const { courseId, moduleId, lessonId } = await context.params;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json(
        { success: false, error: { code: 'AUTH_REQUIRED', message: 'Autenticação necessária' } },
        { status: 401 }
      );
    }

    const userId = Number(session.user.id);
    const courseIdNumber = Number(courseId);
    const moduleIdNumber = Number(moduleId);
    const lessonIdNumber = Number(lessonId);

    if (
      !Number.isFinite(courseIdNumber) ||
      !Number.isFinite(moduleIdNumber) ||
      !Number.isFinite(lessonIdNumber)
    ) {
      return Response.json({ message: 'Invalid route ids' }, { status: 400 });
    }

    const lesson = await db.lesson.findUnique({
      where: { id: lessonIdNumber },
      include: {
        exercises: {
          orderBy: { id: 'asc' },
        },
        module: {
          include: {
            course: true,
            lessons: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    if (
      !lesson ||
      lesson.moduleId !== moduleIdNumber ||
      lesson.module.courseId !== courseIdNumber
    ) {
      return Response.json({ message: 'Lesson not found' }, { status: 404 });
    }

    const enrollment = await db.enrollment.findFirst({
      where: {
        userId,
        courseId: courseIdNumber,
      },
      select: { id: true },
    });

    if (!enrollment) {
      return Response.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    const allLessons = lesson.module.lessons;
    const completedLessons = await db.userProgress.findMany({
      where: {
        userId,
        lessonId: { in: allLessons.map((item) => item.id) },
        completed: true,
      },
      select: { lessonId: true },
    });

    const completedLessonIds = new Set(
      completedLessons.flatMap((progress) =>
        progress.lessonId === null ? [] : [progress.lessonId]
      )
    );

    const lessonIndex = allLessons.findIndex((l) => l.id === lesson.id);
    const previousLesson = lessonIndex > 0 ? allLessons[lessonIndex - 1] : null;
    const nextLesson =
      lessonIndex < allLessons.length - 1 ? allLessons[lessonIndex + 1] : null;

    return Response.json({
      course: {
        id: lesson.module.course?.id.toString() ?? courseId,
        title: lesson.module.course?.title || 'Engenharia de Software',
      },
      module: {
        id: lesson.module.id.toString(),
        sourceId: lesson.module.id.toString(),
        title: lesson.module.title,
        description: lesson.module.title,
      },
      lesson: {
        lesson_id: lesson.id.toString(),
        title: lesson.title,
        content: lesson.content || '',
        description: lesson.title,
        duration: lesson.duration || 0,
        learning_objectives: [],
        examples: [],
        exercises: lesson.exercises.map((ex) => ({
          id: ex.id.toString(),
          type: 'code_review',
          question: ex.title,
          correct_answer: ex.description || '',
          explanation: '',
        })),
        isCompleted: completedLessonIds.has(lesson.id),
      },
      outline: allLessons.map((l, index) => ({
        id: l.id.toString(),
        title: l.title,
        description: l.title,
        order: index + 1,
        isCurrent: l.id === lesson.id,
        isCompleted: completedLessonIds.has(l.id),
        href: `/dashboard/courses/${courseId}/modules/${moduleId}/lessons/${l.id}`,
      })),
      navigation: {
        previous: previousLesson
          ? {
              id: previousLesson.id.toString(),
              title: previousLesson.title,
              href: `/dashboard/courses/${courseId}/modules/${moduleId}/lessons/${previousLesson.id}`,
            }
          : null,
        next: nextLesson
          ? {
              id: nextLesson.id.toString(),
              title: nextLesson.title,
              href: `/dashboard/courses/${courseId}/modules/${moduleId}/lessons/${nextLesson.id}`,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Error fetching lesson:', error);
    return Response.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
