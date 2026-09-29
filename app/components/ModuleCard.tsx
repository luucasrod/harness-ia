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
      className="module-card group flex min-h-[31rem] flex-col overflow-hidden rounded-lg border border-[#2D2D2D] bg-[#12151D]"
      onPointerMove={handlePointerMove}
      style={style}
    >
      <div className="module-card-image relative h-[180px] overflow-hidden border-b border-[#2D2D2D] bg-[#151923]">
        <div className="absolute inset-0 opacity-90" aria-hidden="true">
          <div className="module-image-grid absolute inset-0" />
          <div className="absolute left-6 top-6 h-16 w-16 rounded-lg border border-[#0066FF]/50 bg-[#0066FF]/10" />
          <div className="absolute bottom-6 right-6 h-20 w-28 rounded-lg border border-white/10 bg-white/[0.04]" />
          <div className="absolute left-24 top-16 h-2 w-32 rounded-full bg-[#0066FF]" />
          <div className="absolute left-24 top-24 h-2 w-24 rounded-full bg-white/20" />
          <div className="absolute bottom-10 left-8 h-12 w-12 rounded-full border border-[#0066FF]/60" />
        </div>
        <div className="absolute left-5 top-5 flex h-10 w-10 items-center justify-center rounded-lg bg-[#0066FF] text-sm font-bold text-white">
          {module.id}
        </div>
      </div>

      <div className="relative z-[1] flex flex-1 flex-col p-6">
        <div className="flex-1">
          <h2 className="text-xl font-bold leading-tight text-white">
            {module.title}
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#A0A0A0]">
            {module.description}
          </p>

          <div
            className="mt-5 flex flex-wrap gap-2"
            aria-label="Detalhes do modulo"
          >
            <span className="rounded-full border border-[#2D2D2D] bg-[#0F1117] px-3 py-1 text-xs font-bold text-white">
              {module.lessons} licoes
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
            className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-[#0066FF] px-4 text-sm font-bold text-white transition duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-[#0052CC] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:ring-offset-2 focus:ring-offset-[#12151D]"
            aria-label={`Continuar ${module.title}`}
          >
            Continuar
          </Link>
        </div>
      </div>
    </article>
  );
}
