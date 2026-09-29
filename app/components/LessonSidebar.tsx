'use client';

import Link from 'next/link';
import { useId, useState } from 'react';

import '../../styles/course.css';

export type LessonSidebarItem = {
  id: string;
  title: string;
  order: number;
  href: string;
  isCurrent: boolean;
  isCompleted: boolean;
};

type LessonSidebarProps = {
  moduleTitle: string;
  lessons: LessonSidebarItem[];
  /** Fraction between 0 and 1. */
  progress: number;
};

function CheckmarkIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0 text-brand"
    >
      <path d="M4.5 10.5 8 14l7.5-8" />
    </svg>
  );
}

function PendingDot({ isCurrent }: { isCurrent: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`h-4 w-4 shrink-0 rounded-full border transition-colors duration-200 ${
        isCurrent ? 'border-brand bg-brand' : 'border-line-strong bg-transparent'
      }`}
    />
  );
}

export default function LessonSidebar({
  moduleTitle,
  lessons,
  progress,
}: LessonSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();

  const completedCount = lessons.filter((lesson) => lesson.isCompleted).length;
  const percent = Math.round(Math.min(Math.max(progress, 0), 1) * 100);

  return (
    <nav
      aria-label="Índice do módulo"
      className="lesson-sidebar w-full lg:sticky lg:top-24 lg:self-start"
    >
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="flex w-full items-center justify-between gap-3 rounded-lg border border-line bg-ink-raised px-4 py-3 text-left transition-colors duration-200 hover:bg-surface lg:hidden"
      >
        <span className="min-w-0">
          <span className="block text-[11px] font-semibold uppercase tracking-widest text-muted">
            Módulo
          </span>
          <span className="mt-0.5 block truncate text-sm font-semibold text-white">
            {moduleTitle}
          </span>
        </span>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className={`h-5 w-5 shrink-0 text-muted transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        >
          <path d="M5 7.5 10 12.5 15 7.5" />
        </svg>
      </button>

      <div
        id={panelId}
        className={`lesson-sidebar__panel mt-3 lg:mt-0 lg:block ${
          isOpen ? 'lesson-sidebar__panel--open' : ''
        }`}
      >
        <div className="rounded-xl border border-line bg-ink-raised p-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">
            Módulo
          </p>
          <h2 className="mt-1 text-sm font-bold leading-5 text-white">
            {moduleTitle}
          </h2>

          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-muted">
              <span>
                {completedCount} de {lessons.length} concluídas
              </span>
              <span className="font-semibold text-white">{percent}%</span>
            </div>
            <div
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progresso do módulo"
              className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface"
            >
              <div
                className="h-full rounded-full bg-brand transition-[width] duration-500 ease-out-soft"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>

          <ol className="mt-4 space-y-1">
            {lessons.map((lesson) => (
              <li key={lesson.id}>
                <Link
                  href={lesson.href}
                  onClick={() => setIsOpen(false)}
                  aria-current={lesson.isCurrent ? 'page' : undefined}
                  className={`lesson-sidebar__item group flex items-start gap-3 rounded-lg border-l-2 py-2.5 pl-3 pr-2 text-sm transition-[background-color,color,border-color] duration-200 ease-out-soft ${
                    lesson.isCurrent
                      ? 'border-brand bg-brand/15 font-bold text-brand-text'
                      : 'border-transparent text-muted hover:bg-surface hover:text-white'
                  }`}
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                    {lesson.isCompleted ? (
                      <CheckmarkIcon />
                    ) : (
                      <PendingDot isCurrent={lesson.isCurrent} />
                    )}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span
                      className={`block text-[11px] font-semibold uppercase tracking-widest ${
                        lesson.isCurrent ? 'text-brand-text' : 'text-muted/80'
                      }`}
                    >
                      Aula {lesson.order}
                    </span>
                    <span className="mt-0.5 block text-sm leading-5">
                      {lesson.title}
                    </span>
                  </span>

                  {lesson.isCompleted ? (
                    <span className="sr-only">Concluída</span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </nav>
  );
}
