import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/prisma';

interface Module {
  id: number;
  title: string;
  imageUrl?: string;
  lessonsCount: number;
}

export const dynamicParams = true;
export const revalidate = 60;

interface Props {
  params: Promise<{ courseId: string }>;
}

export default async function CourseModulesPage({ params }: Props) {
  const { courseId } = await params;
  const courseIdNum = Number(courseId);

  if (!Number.isFinite(courseIdNum)) {
    notFound();
  }

  try {
    const course = await db.course.findUnique({
      where: { id: courseIdNum },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            imageUrl: true,
            _count: { select: { lessons: true } },
          },
        },
      },
    });

    if (!course) {
      notFound();
    }

    const modules: Module[] = course.modules.map((m) => ({
      id: m.id,
      title: m.title,
      imageUrl: m.imageUrl || undefined,
      lessonsCount: m._count.lessons,
    }));

    return (
      <div className="space-y-6">
        <Link href="/dashboard/courses" className="text-sm text-brand hover:underline">
          ← Voltar aos cursos
        </Link>

        <h1 className="text-2xl font-bold text-white">{course.title}</h1>

        {modules.length === 0 ? (
          <p className="text-muted">Nenhum módulo disponível.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((module) => (
              <Link
                key={module.id}
                href={`/dashboard/courses/${courseIdNum}/modules/${module.id}`}
                className="group overflow-hidden rounded-lg border border-line bg-ink-raised p-4 transition-all hover:border-brand hover:bg-surface"
              >
                {module.imageUrl && (
                  <img
                    src={module.imageUrl}
                    alt={module.title}
                    className="mb-4 h-40 w-full rounded object-cover"
                  />
                )}
                <h3 className="font-semibold text-white group-hover:text-brand">
                  {module.title}
                </h3>
                <p className="mt-1 text-xs text-muted">
                  {module.lessonsCount} aulas
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('Error loading course:', error);
    notFound();
  }
}
