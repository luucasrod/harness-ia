import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';

import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  context: RouteContext<'/api/courses/[courseId]/modules/[moduleId]/lessons/[lessonId]'>
) {
  const { courseId, moduleId, lessonId } = await context.params;

  try {
    const lesson = await prisma.lesson.findFirst({
      where: {
        id: Number(lessonId),
        moduleId: Number(moduleId),
        module: { courseId: Number(courseId) },
      },
      include: { exercises: true },
    });

    if (!lesson) {
      return Response.json({ message: 'Lesson not found' }, { status: 404 });
    }

    const module = await prisma.module.findUnique({
      where: { id: Number(moduleId) },
      include: { course: true },
    });

    if (!module) {
      return Response.json({ message: 'Module not found' }, { status: 404 });
    }

    const allLessons = await prisma.lesson.findMany({
      where: { moduleId: Number(moduleId) },
      orderBy: { order: 'asc' },
    });

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ? Number(session.user.id) : null;

    const completedLessons = userId
      ? await prisma.userProgress.findMany({
          where: { userId, moduleId: Number(moduleId), completed: true },
        })
      : [];

    const completedLessonIds = new Set(
      completedLessons.map((p) => p.lessonId)
    );

    const lessonIndex = allLessons.findIndex((l) => l.id === lesson.id);
    const previousLesson = lessonIndex > 0 ? allLessons[lessonIndex - 1] : null;
    const nextLesson =
      lessonIndex < allLessons.length - 1 ? allLessons[lessonIndex + 1] : null;

    return Response.json({
      course: {
        id: courseId,
        title: module.course?.title || 'Engenharia de Software',
      },
      module: {
        id: moduleId,
        sourceId: module.id.toString(),
        title: module.title,
        description: module.title,
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
        href: `/courses/${courseId}/modules/${moduleId}/lessons/${l.id}`,
      })),
      navigation: {
        previous: previousLesson
          ? {
              id: previousLesson.id.toString(),
              title: previousLesson.title,
              href: `/courses/${courseId}/modules/${moduleId}/lessons/${previousLesson.id}`,
            }
          : null,
        next: nextLesson
          ? {
              id: nextLesson.id.toString(),
              title: nextLesson.title,
              href: `/courses/${courseId}/modules/${moduleId}/lessons/${nextLesson.id}`,
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
  } finally {
    await prisma.$disconnect();
  }
}
