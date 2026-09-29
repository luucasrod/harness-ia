import Link from 'next/link';
import { Suspense } from 'react';
import ModuleCard, { type ModuleCardData } from '@/app/components/ModuleCard';
import ProgressBar from '@/app/components/ProgressBar';
import '@/app/styles/dashboard.css';

const modules: ModuleCardData[] = [
  {
    id: 1,
    title: 'Fundamentos de Engenharia',
    description:
      'Base técnica para pensar como engenheiro, estruturar contexto e tomar decisões com critério.',
    lessons: 6,
    hours: 12,
    completedLessons: 6,
    progress: 100,
    href: '/dashboard/courses/1',
    accent: '#0066FF',
  },
  {
    id: 2,
    title: 'React & Frontend',
    description:
      'Componentes, estado, roteamento e interfaces modernas com foco em experiência de produto.',
    lessons: 6,
    hours: 14,
    completedLessons: 5,
    progress: 83,
    href: '/dashboard/courses/2',
    accent: '#00A3FF',
  },
  {
    id: 3,
    title: 'Node.js & Express',
    description:
      'APIs robustas, middlewares, autenticação e padrões de backend prontos para produção.',
    lessons: 6,
    hours: 13,
    completedLessons: 4,
    progress: 67,
    href: '/dashboard/courses/3',
    accent: '#0066FF',
  },
  {
    id: 4,
    title: 'Bancos de Dados',
    description:
      'Modelagem relacional, SQL, ORMs, migrações e operação confiável de dados.',
    lessons: 6,
    hours: 15,
    completedLessons: 6,
    progress: 100,
    href: '/dashboard/courses/4',
    accent: '#2F80ED',
  },
  {
    id: 5,
    title: 'Cache & Tempo Real',
    description:
      'Redis, filas, WebSockets e estratégias para reduzir latência sem perder consistência.',
    lessons: 5,
    hours: 11,
    completedLessons: 5,
    progress: 100,
    href: '/dashboard/courses/5',
    accent: '#0066FF',
  },
  {
    id: 6,
    title: 'Testing & QA',
    description:
      'Pirâmide de testes, Jest, integração, E2E e pipelines para manter qualidade no fluxo.',
    lessons: 6,
    hours: 12,
    completedLessons: 6,
    progress: 100,
    href: '/dashboard/courses/6',
    accent: '#1D72FF',
  },
  {
    id: 7,
    title: 'SOLID & Patterns',
    description:
      'Princípios, design patterns e arquitetura evolutiva para código mais fácil de manter.',
    lessons: 6,
    hours: 13,
    completedLessons: 3,
    progress: 50,
    href: '/dashboard/courses/7',
    accent: '#0066FF',
  },
  {
    id: 8,
    title: 'Design de Sistemas',
    description:
      'Estimativas, escalabilidade, disponibilidade e trade-offs de sistemas distribuídos.',
    lessons: 6,
    hours: 16,
    completedLessons: 4,
    progress: 67,
    href: '/dashboard/courses/8',
    accent: '#3385FF',
  },
  {
    id: 9,
    title: 'DevOps & Contêineres',
    description:
      'Docker, Kubernetes, CI/CD e infraestrutura para entregar software com repetibilidade.',
    lessons: 5,
    hours: 12,
    completedLessons: 4,
    progress: 80,
    href: '/dashboard/courses/9',
    accent: '#0066FF',
  },
  {
    id: 10,
    title: 'Integração com Claude e IA',
    description:
      'APIs de IA, prompts de sistema, memória conversacional e resiliência em produção.',
    lessons: 6,
    hours: 14,
    completedLessons: 5,
    progress: 83,
    href: '/dashboard/courses/10',
    accent: '#0B6BFF',
  },
  {
    id: 11,
    title: 'Projeto Final',
    description:
      'Projeto final integrando dashboard, CLI, deploy e critérios de entrega profissional.',
    lessons: 5,
    hours: 18,
    completedLessons: 0,
    progress: 0,
    href: '/dashboard/courses/11',
    accent: '#0066FF',
  },
];

const completedModules = modules.filter(
  (module) => module.progress === 100
).length;
const overallProgress = Math.round(
  modules.reduce((total, module) => total + module.progress, 0) / modules.length
);

async function DashboardContent() {
  await Promise.resolve();

  return (
    <>
      <section className="rounded-lg border border-[#2D2D2D] bg-[#0F1117] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.28)] sm:p-8 lg:p-10">
        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="max-w-3xl min-w-0">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#0066FF]">
              Dashboard
            </p>
            <h1 className="mt-3 text-2xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
              Bem-vindo, Lucas
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#A0A0A0] sm:text-base">
              Você tem {completedModules}/{modules.length} módulos completos.
              Continue sua trilha de engenharia com IA em módulos objetivos,
              progresso visível e prática guiada.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <Link
              href="/dashboard/courses/10"
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
