import { getServerSession } from 'next-auth';

import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { markLessonComplete } from '@/lib/lesson-progress';
import { readModuleContent } from '@/lib/module-content';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  context: RouteContext<
    '/api/courses/[courseId]/modules/[moduleId]/lessons/[lessonId]/complete'
  >
) {
  const { lessonId } = await context.params;
  const fallbackUrl = new URL('/', request.url);
  const redirectUrl = request.headers.get('referer') ?? fallbackUrl.toString();

  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ? Number(session.user.id) : null;

    if (userId !== null && Number.isFinite(userId)) {
      const moduleContent = await readModuleContent();
      const lesson = moduleContent.lessons.find(
        (candidate) => candidate.lesson_id === lessonId
      );

      if (lesson) {
        await markLessonComplete({
          userId,
          moduleTitle: moduleContent.title,
          lessonTitle: lesson.title,
        });
      }
    }
  } catch {
    // Completion is best-effort: never block navigation on a write failure.
  }

  return Response.redirect(redirectUrl, 303);
}
