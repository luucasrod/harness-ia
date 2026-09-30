'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Module {
  id: number;
  title: string;
  imageUrl?: string;
  lessonsCount: number;
}

export const dynamicParams = true;

export default function CourseModulesPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchModules() {
      try {
        const res = await fetch(`/api/courses/${courseId}`);
        if (!res.ok) throw new Error('Failed to load modules');
        const data = await res.json();
        setModules(data.modules || []);
      } catch (err) {
        console.error(err);
        setModules([]);
      } finally {
        setLoading(false);
      }
    }

    if (courseId) fetchModules();
  }, [courseId]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg bg-slate-800" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/courses" className="text-sm text-brand hover:underline">
        ← Voltar aos cursos
      </Link>

      <h1 className="text-2xl font-bold text-white">Módulos</h1>

      {modules.length === 0 ? (
        <p className="text-muted">Nenhum módulo disponível.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => (
            <Link
              key={module.id}
              href={`/courses/${courseId}/modules/${module.id}`}
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
}
