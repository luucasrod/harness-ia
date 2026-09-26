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
    in_progress: 'Em progresso',
    completed: 'Concluído',
  };

  return (
    <Link href={`/dashboard/courses/${id}`}>
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/30 transition-all cursor-pointer h-full flex flex-col">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">{title}</h3>
          <p className="text-sm text-gray-400 mb-4 line-clamp-2">{description || 'Sem descrição'}</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Progresso</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[status]}`}>
              {statusLabel[status]}
            </span>
            <span className="text-xs text-gray-400">
              {lessonsCompleted} de {totalLessons}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
