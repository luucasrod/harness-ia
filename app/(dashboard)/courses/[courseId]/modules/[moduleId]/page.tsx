'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Lesson {
  id: number;
  title: string;
  duration?: number;
  isCompleted?: boolean;
}

export const dynamicParams = true;

export default function ModuleLessonsPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const moduleId = params.moduleId as string;
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [moduleTitle, setModuleTitle] = useState('');

  useEffect(() => {
    async function fetchLessons() {
      try {
        const res = await fetch(`/api/courses/${courseId}/modules/${moduleId}`);
        if (!res.ok) throw new Error('Failed to load lessons');
        const data = await res.json();
        setLessons(data.lessons || []);
        setModuleTitle(data.moduleTitle || 'Módulo');
      } catch (err) {
        console.error(err);
        setLessons([]);
      } finally {
        setLoading(false);
      }
    }

    if (courseId && moduleId) fetchLessons();
  }, [courseId, moduleId]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-800" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href={`/courses/${courseId}`}
        className="text-sm text-brand hover:underline"
      >
        ← Voltar aos módulos
      </Link>

      <h1 className="text-2xl font-bold text-white">{moduleTitle}</h1>

      {lessons.length === 0 ? (
        <p className="text-muted">Nenhuma aula disponível.</p>
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson, index) => (
            <Link
              key={lesson.id}
              href={`/courses/${courseId}/modules/${moduleId}/lessons/${lesson.id}`}
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
              {lesson.isCompleted && (
                <span className="text-xs font-semibold text-green-400">
                  ✓ Concluída
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
