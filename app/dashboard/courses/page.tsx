'use client';

import { useEffect, useState } from 'react';
import CourseCard from '@/components/CourseCard';

interface Course {
  id: number;
  title: string;
  description?: string;
  progressPercent: number;
  totalLessons: number;
  lessonsCompleted: number;
  status: 'not_started' | 'in_progress' | 'completed';
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await fetch('/api/courses');
        if (!res.ok) throw new Error('Falha ao carregar cursos');
        const data = await res.json();
        setCourses(data.data || []);
      } catch (err) {
        setError(
          'Não foi possível carregar os cursos. Tente novamente mais tarde.'
        );
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchCourses();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Cursos</h1>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-56 animate-pulse rounded-lg bg-slate-800"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-brand">
          Biblioteca
        </p>
        <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
          Cursos disponíveis
        </h1>
      </div>

      {error ? (
        <div className="flex flex-col gap-3 rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-red-300 sm:flex-row sm:items-center sm:justify-between">
          <span>{error}</span>
          <button
            onClick={() => window.location.reload()}
            className="text-left text-sm font-semibold hover:underline sm:text-right"
          >
            Tentar novamente
          </button>
        </div>
      ) : null}

      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg border border-line bg-ink-raised text-sm font-bold text-brand-text">
            IA
          </div>
          <p className="text-lg text-gray-300">
            Nenhum curso disponível ainda.
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Verifique novamente mais tarde.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              id={course.id}
              title={course.title}
              description={course.description}
              progressPercent={course.progressPercent}
              totalLessons={course.totalLessons}
              lessonsCompleted={course.lessonsCompleted}
              status={course.status}
            />
          ))}
        </div>
      )}
    </div>
  );
}
