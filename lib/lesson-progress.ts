import { PrismaClient } from '@prisma/client';

import { normalizeTitle } from '@/lib/module-content';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Content lessons are keyed by slug while persisted progress is keyed by the
 * numeric primary key of a `Lesson` row, so the two are joined on title. Titles
 * that have no matching database row simply resolve as "not completed".
 */
export async function loadModuleCompletion(
  moduleTitle: string,
  lessonTitles: string[]
): Promise<Map<string, boolean>> {
  const empty = new Map(lessonTitles.map((title) => [normalizeTitle(title), false]));

  try {
    const rows = await prisma.userProgress.findMany({
      where: {
        completed: true,
        lesson: { module: { title: moduleTitle } },
      },
      select: { completed: true, lesson: { select: { title: true } } },
    });

    const completion = new Map(empty);

    for (const row of rows) {
      const key = normalizeTitle(row.lesson?.title ?? '');

      if (completion.has(key)) {
        completion.set(key, row.completed);
      }
    }

    return completion;
  } catch {
    return empty;
  }
}

export async function markLessonComplete(params: {
  userId: number;
  moduleTitle: string;
  lessonTitle: string;
}): Promise<boolean> {
  const { userId, moduleTitle, lessonTitle } = params;

  const module = await prisma.module.findFirst({
    where: { title: moduleTitle },
    select: { id: true },
  });

  if (!module) {
    return false;
  }

  const lesson = await prisma.lesson.findFirst({
    where: { moduleId: module.id, title: lessonTitle },
    select: { id: true },
  });

  if (!lesson) {
    return false;
  }

  const existing = await prisma.userProgress.findFirst({
    where: { userId, lessonId: lesson.id },
    select: { id: true },
  });

  if (existing) {
    await prisma.userProgress.update({
      where: { id: existing.id },
      data: { completed: true, moduleId: module.id },
    });
  } else {
    await prisma.userProgress.create({
      data: { userId, lessonId: lesson.id, moduleId: module.id, completed: true },
    });
  }

  return true;
}
