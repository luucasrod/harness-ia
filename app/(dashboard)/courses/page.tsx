'use client';

import { useState, useEffect } from 'react';
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
        if (!res.ok) throw new Error('Failed to load courses');
        const data = await res.json();
        setCourses(data.data || []);
      } catch (err) {
        setError('Unable to load courses. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchCourses();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-white">Cursos</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-slate-800 rounded-lg h-48 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-white">Cursos Disponíveis</h1>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => window.location.reload()} className="text-sm hover:underline">
            Tentar novamente
          </button>
        </div>
      )}

      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-6xl mb-4">📚</div>
          <p className="text-gray-400 text-lg">Nenhum curso disponível ainda.</p>
          <p className="text-gray-500 text-sm mt-2">Verifique novamente mais tarde!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
