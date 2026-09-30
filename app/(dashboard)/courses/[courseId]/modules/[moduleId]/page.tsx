import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/prisma';

interface Lesson {
  id: number;
  title: string;
  duration?: number;
  isCompleted?: boolean;
}

export const dynamicParams = true;
export const revalidate = 60;

interface Props {
  params: Promise<{ courseId: string; moduleId: string }>;
}

export default async function ModuleLessonsPage({ params }: Props) {
  const { courseId, moduleId } = await params;
  const courseIdNum = Number(courseId);
  const moduleIdNum = Number(moduleId);

  if (!Number.isFinite(courseIdNum) || !Number.isFinite(moduleIdNum)) {
    notFound();
  }

  try {
    const module = await db.module.findUnique({
      where: { id: moduleIdNum },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            duration: true,
          },
        },
        course: { select: { id: true } },
      },
    });

    if (!module || module.course.id !== courseIdNum) {
      notFound();
    }

    const lessons: Lesson[] = module.lessons.map((l) => ({
      id: l.id,
      title: l.title,
      duration: l.duration || undefined,
    }));

    return (
      <div className="space-y-6">
        <Link
          href={`/dashboard/courses/${courseIdNum}`}
          className="text-sm text-brand hover:underline"
        >
          ← Voltar aos módulos
        </Link>

        <h1 className="text-2xl font-bold text-white">{module.title}</h1>

        {lessons.length === 0 ? (
          <p className="text-muted">Nenhuma aula disponível.</p>
        ) : (
          <div className="space-y-3">
            {lessons.map((lesson, index) => (
              <Link
                key={lesson.id}
                href={`/dashboard/courses/${courseIdNum}/modules/${moduleIdNum}/lessons/${lesson.id}`}
                className="group flex items-center justify-between rounded-lg border border-line bg-ink-raised p-4 transition-all hover:border-brand hover:bg-surface"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-brand/20 text-sm font-semibold text-brand group-hover:bg-brand group-hover:text-white">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white group-hover:text-brand">
                      {lesson.title}
                    </h3>
                    {lesson.duration && (
                      <p className="text-xs text-muted">
                        {lesson.duration} minutos
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('Error loading module:', error);
    notFound();
  }
}
