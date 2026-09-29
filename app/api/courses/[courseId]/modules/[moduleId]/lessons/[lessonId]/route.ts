import { getServerSession } from 'next-auth';

import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { loadModuleCompletion } from '@/lib/lesson-progress';
import { normalizeTitle, readModuleContent } from '@/lib/module-content';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  context: RouteContext<'/api/courses/[courseId]/modules/[moduleId]/lessons/[lessonId]'>
) {
  const { courseId, moduleId, lessonId } = await context.params;
  const moduleContent = await readModuleContent();
  const lessonIndex = moduleContent.lessons.findIndex(
    (lesson) => lesson.lesson_id === lessonId
  );

  if (lessonIndex === -1) {
    return Response.json({ message: 'Lesson not found' }, { status: 404 });
  }

  const session = await getServerSession(authOptions);
  const sessionUserId = session?.user?.id ? Number(session.user.id) : null;

  const completion =
    sessionUserId === null
      ? new Map<string, boolean>()
      : await loadModuleCompletion(
          moduleContent.title,
          moduleContent.lessons.map((lesson) => lesson.title)
        );

  const lesson = moduleContent.lessons[lessonIndex];
  const previousLesson = moduleContent.lessons[lessonIndex - 1];
  const nextLesson = moduleContent.lessons[lessonIndex + 1];

  return Response.json({
    course: {
      id: courseId,
      title: 'AI Engineering Foundations',
    },
    module: {
      id: moduleId,
      sourceId: moduleContent.module_id,
      title: moduleContent.title,
      description: moduleContent.description,
    },
    lesson: {
      ...lesson,
      isCompleted: completion.get(normalizeTitle(lesson.title)) ?? false,
    },
    outline: moduleContent.lessons.map((moduleLesson, index) => ({
      id: moduleLesson.lesson_id,
      title: moduleLesson.title,
      description: moduleLesson.description,
      order: index + 1,
      isCurrent: moduleLesson.lesson_id === lessonId,
      isCompleted: completion.get(normalizeTitle(moduleLesson.title)) ?? false,
      href: `/courses/${courseId}/modules/${moduleId}/lessons/${moduleLesson.lesson_id}`,
    })),
    navigation: {
      previous: previousLesson
        ? {
            id: previousLesson.lesson_id,
            title: previousLesson.title,
            href: `/courses/${courseId}/modules/${moduleId}/lessons/${previousLesson.lesson_id}`,
          }
        : null,
      next: nextLesson
        ? {
            id: nextLesson.lesson_id,
            title: nextLesson.title,
            href: `/courses/${courseId}/modules/${moduleId}/lessons/${nextLesson.lesson_id}`,
          }
        : null,
    },
  });
}
