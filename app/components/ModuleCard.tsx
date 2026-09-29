'use client';

import Link from 'next/link';
import type { CSSProperties, PointerEvent } from 'react';
import ProgressBar from '@/app/components/ProgressBar';

export type ModuleCardData = {
  id: number;
  title: string;
  description: string;
  lessons: number;
  hours: number;
  completedLessons: number;
  progress: number;
  href: string;
  accent: string;
};

type ModuleCardProps = {
  module: ModuleCardData;
};

type DepthStyle = CSSProperties & {
  '--mouse-x'?: string;
  '--mouse-y'?: string;
  '--accent'?: string;
};

export default function ModuleCard({ module }: ModuleCardProps) {
  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    event.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    event.currentTarget.style.setProperty('--mouse-y', `${y}px`);
  }

  const style: DepthStyle = {
    '--mouse-x': '50%',
    '--mouse-y': '50%',
    '--accent': module.accent,
  };

  return (
    <article
      className="module-card group flex min-h-[28rem] min-w-0 flex-col overflow-hidden rounded-lg border border-[#2D2D2D] bg-[#12151D] sm:min-h-[31rem]"
      onPointerMove={handlePointerMove}
      style={style}
    >
      <div className="module-card-image relative h-[150px] overflow-hidden border-b border-[#2D2D2D] bg-[#151923] sm:h-[180px]">
        <div className="absolute inset-0 opacity-90" aria-hidden="true">
          <div className="module-image-grid absolute inset-0" />
          <div className="absolute left-5 top-5 h-14 w-14 rounded-lg border border-[#0066FF]/50 bg-[#0066FF]/10 sm:left-6 sm:top-6 sm:h-16 sm:w-16" />
          <div className="absolute bottom-5 right-5 h-16 w-24 rounded-lg border border-white/10 bg-white/[0.04] sm:bottom-6 sm:right-6 sm:h-20 sm:w-28" />
          <div className="absolute left-20 top-14 h-2 w-28 rounded-full bg-[#0066FF] sm:left-24 sm:top-16 sm:w-32" />
          <div className="absolute left-20 top-[5.5rem] h-2 w-20 rounded-full bg-white/20 sm:left-24 sm:top-24 sm:w-24" />
          <div className="absolute bottom-8 left-7 h-11 w-11 rounded-full border border-[#0066FF]/60 sm:bottom-10 sm:left-8 sm:h-12 sm:w-12" />
        </div>
        <div className="absolute left-5 top-5 flex h-10 w-10 items-center justify-center rounded-lg bg-[#0066FF] text-sm font-bold text-white">
          {module.id}
        </div>
      </div>

      <div className="relative z-[1] flex min-w-0 flex-1 flex-col p-5 sm:p-6">
        <div className="flex-1">
          <h2 className="text-lg font-bold leading-tight text-white sm:text-xl">
            {module.title}
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#A0A0A0]">
            {module.description}
          </p>

          <div
            className="mt-5 flex flex-wrap gap-2"
            aria-label="Detalhes do módulo"
          >
            <span className="rounded-full border border-[#2D2D2D] bg-[#0F1117] px-3 py-1 text-xs font-bold text-white">
              {module.lessons} lições
            </span>
            <span className="rounded-full border border-[#2D2D2D] bg-[#0F1117] px-3 py-1 text-xs font-bold text-white">
              {module.hours} horas
            </span>
            <span className="rounded-full border border-[#0066FF]/40 bg-[#0066FF]/10 px-3 py-1 text-xs font-bold text-[#E6F0FF]">
              {module.progress}% progresso
            </span>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <ProgressBar
            value={module.progress}
            size="sm"
            label={`Progresso: ${module.completedLessons}/${module.lessons}`}
          />
          <Link
            href={module.href}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#0066FF] px-4 text-sm font-bold text-white transition duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-[#0052CC] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:ring-offset-2 focus:ring-offset-[#12151D]"
            aria-label={`Continuar ${module.title}`}
          >
            Continuar
          </Link>
        </div>
      </div>
    </article>
  );
}
