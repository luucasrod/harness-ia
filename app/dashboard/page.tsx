import Link from 'next/link';
import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import ModuleCard, { type ModuleCardData } from '@/app/components/ModuleCard';
import ProgressBar from '@/app/components/ProgressBar';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/prisma';
import '@/app/styles/dashboard.css';

async function DashboardContent() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return null;
  }

  const userId = parseInt(session.user.id, 10);

  const course = await db.course.findUnique({
    where: { id: 1 },
    include: {
      modules: {
        orderBy: { order: 'asc' },
        include: { lessons: true },
      },
    },
  });

  if (!course) {
    return null;
  }

  const userProgress = await db.userProgress.findMany({
    where: { userId },
  });

  const progressMap = new Map<number, number>();
  userProgress.forEach(p => {
    if (p.moduleId) {
      const current = progressMap.get(p.moduleId) || 0;
      progressMap.set(p.moduleId, current + (p.completed ? 1 : 0));
    }
  });

  const modules: ModuleCardData[] = course.modules.map(m => {
    const completedCount = progressMap.get(m.id) || 0;
    const totalCount = m.lessons.length;
    const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return {
      id: m.id,
      title: m.title,
      description: '',
      lessons: totalCount,
      hours: 0,
      completedLessons: completedCount,
      progress,
      href: `/dashboard/courses/1/modules/${m.id}`,
      accent: '#0066FF',
    };
  });

  const completedModules = modules.filter(m => m.progress === 100).length;
  const overallProgress = Math.round(
    modules.reduce((total, m) => total + m.progress, 0) / modules.length || 0
  );

  const firstIncompleteModule = modules.find(m => m.progress < 100) || modules[0];

  return (
    <>
      <section className="rounded-lg border border-[#2D2D2D] bg-[#0F1117] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.28)] sm:p-8 lg:p-10">
        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="max-w-3xl min-w-0">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#0066FF]">
              Dashboard
            </p>
            <h1 className="mt-3 text-2xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
              Bem-vindo, {session.user.name || 'Estudante'}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#A0A0A0] sm:text-base">
              Você tem {completedModules}/{modules.length} módulos completos.
              Continue sua trilha de engenharia com IA em módulos objetivos,
              progresso visível e prática guiada.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <Link
              href={firstIncompleteModule.href}
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#0066FF] px-5 text-center text-sm font-bold text-white transition duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-[#0052CC] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:ring-offset-2 focus:ring-offset-[#0F1117]"
            >
              Continuar último módulo
            </Link>
            <Link
              href="/dashboard/courses"
              className="inline-flex min-h-11 items-center justify-center rounded-lg px-5 text-sm font-bold text-white transition hover:text-[#0066FF] focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:ring-offset-2 focus:ring-offset-[#0F1117]"
            >
              Ver tudo
            </Link>
          </div>
        </div>

        <div className="mt-8 max-w-3xl">
          <ProgressBar
            value={overallProgress}
            label={`${overallProgress}% de progresso`}
          />
        </div>
      </section>

      <section aria-labelledby="modules-title">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#0066FF]">
              Módulos
            </p>
            <h2
              id="modules-title"
              className="mt-2 text-2xl font-bold text-white"
            >
              Trilha Harness IA
            </h2>
          </div>
          <p className="text-sm text-[#A0A0A0]">
            {modules.length} módulos com progresso individual
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {modules.map((module) => (
            <ModuleCard key={module.id} module={module} />
          ))}
        </div>
      </section>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading dashboard">
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-6 shadow-lg">
        <div className="h-4 w-24 animate-pulse rounded bg-slate-700" />
        <div className="mt-4 h-9 w-2/3 animate-pulse rounded bg-slate-700" />
        <div className="mt-4 h-4 w-full max-w-2xl animate-pulse rounded bg-slate-800" />
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <div
            key={item}
            className="h-[31rem] rounded-lg border border-slate-800 bg-slate-900 p-5 shadow-md"
          >
            <div className="h-[180px] animate-pulse rounded bg-slate-800" />
            <div className="mt-6 h-5 w-36 animate-pulse rounded bg-slate-700" />
            <div className="mt-4 h-4 w-full animate-pulse rounded bg-slate-800" />
            <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-slate-800" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-8 bg-[#0F1117] sm:space-y-10">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
