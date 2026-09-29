import { getServerSession } from 'next-auth';

import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  context: RouteContext<
    '/api/courses/[courseId]/modules/[moduleId]/lessons/[lessonId]/complete'
  >
) {
  const { courseId, moduleId, lessonId } = await context.params;
  const fallbackUrl = new URL('/', request.url);
  const redirectUrl = request.headers.get('referer') ?? fallbackUrl.toString();

  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ? Number(session.user.id) : null;
    const courseIdNumber = Number(courseId);
    const moduleIdNumber = Number(moduleId);
    const lessonIdNumber = Number(lessonId);

    if (
      userId !== null &&
      Number.isFinite(userId) &&
      Number.isFinite(courseIdNumber) &&
      Number.isFinite(moduleIdNumber) &&
      Number.isFinite(lessonIdNumber)
    ) {
      const lesson = await db.lesson.findUnique({
        where: { id: lessonIdNumber },
        select: {
          id: true,
          moduleId: true,
          module: {
            select: {
              courseId: true,
            },
          },
        },
      });

      if (
        lesson &&
        lesson.moduleId === moduleIdNumber &&
        lesson.module.courseId === courseIdNumber
      ) {
        const existing = await db.userProgress.findFirst({
          where: { userId, lessonId: lesson.id },
          select: { id: true },
        });

        if (existing) {
          await db.userProgress.update({
            where: { id: existing.id },
            data: { completed: true, moduleId: moduleIdNumber },
          });
        } else {
          await db.userProgress.create({
            data: {
              completed: true,
              lessonId: lesson.id,
              moduleId: moduleIdNumber,
              userId,
            },
          });
        }
      }
    }
  } catch {
    // Completion is best-effort: never block navigation on a write failure.
  }

  return Response.redirect(redirectUrl, 303);
}
