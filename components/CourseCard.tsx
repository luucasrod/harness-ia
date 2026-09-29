'use client';

import Link from 'next/link';

interface CourseCardProps {
  id: number;
  title: string;
  description?: string;
  progressPercent: number;
  totalLessons: number;
  lessonsCompleted: number;
  status: 'not_started' | 'in_progress' | 'completed';
}

export default function CourseCard({
  id,
  title,
  description,
  progressPercent,
  totalLessons,
  lessonsCompleted,
  status,
}: CourseCardProps) {
  const statusStyles = {
    not_started: 'bg-gray-700 text-gray-200',
    in_progress: 'bg-blue-600 text-white',
    completed: 'bg-green-600 text-white',
  };

  const statusLabel = {
    not_started: 'Não iniciado',
    in_progress: 'Em andamento',
    completed: 'Concluído',
  };

  return (
    <Link
      href={`/dashboard/courses/${id}`}
      className="block h-full rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-ink"
    >
      <article className="flex h-full min-h-[15rem] min-w-0 flex-col rounded-lg border border-line bg-ink-raised p-5 transition hover:border-brand/70 hover:shadow-lg hover:shadow-blue-500/20">
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-lg font-bold leading-tight text-white">
            {title}
          </h3>
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">
            {description || 'Sem descrição'}
          </p>
        </div>

        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between gap-3 text-xs text-muted">
            <span>Progresso</span>
            <span className="font-semibold text-white">{progressPercent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-700">
            <div
              className="h-full rounded-full bg-brand transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}
            >
              {statusLabel[status]}
            </span>
            <span className="text-xs text-muted">
              {lessonsCompleted} de {totalLessons} lições
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
