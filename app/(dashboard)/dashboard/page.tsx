import Link from "next/link";
import { Suspense } from "react";

const stats = [
  { label: "Modules completed", value: "4", detail: "of 22 core modules" },
  { label: "Current streak", value: "6 days", detail: "best streak this month" },
  { label: "Skills", value: "7", detail: "mapped to your profile" },
];

const lessons = [
  "Harnessing context for reliable answers",
  "Prompt patterns for engineering tasks",
  "Evaluating model outputs with rubrics",
];

async function DashboardContent() {
  await Promise.resolve();

  return (
    <>
      <section className="rounded-lg border border-slate-800 bg-slate-900/90 p-5 shadow-lg sm:p-6 lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-cyan-400">Dashboard</p>
            <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
              Welcome back, Lucas
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Continue your AI engineering path with focused modules,
              measurable progress, and skill checkpoints that compound over
              time.
            </p>
          </div>

          <Link
            href="/dashboard/courses"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-blue-950/40 transition hover:bg-blue-500 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            Start Learning
          </Link>
        </div>
      </section>

      <section aria-labelledby="quick-stats-title">
        <h2 id="quick-stats-title" className="sr-only">
          Quick stats
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {stats.map((stat) => (
            <article
              key={stat.label}
              className="rounded-lg border border-slate-800 bg-slate-900 p-5 shadow-md transition hover:border-slate-700 hover:bg-slate-800/80"
            >
              <p className="text-sm font-semibold text-slate-300">
                {stat.label}
              </p>
              <p className="mt-3 text-3xl font-bold text-white">
                {stat.value}
              </p>
              <p className="mt-2 text-sm text-slate-400">{stat.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]"
        aria-labelledby="continue-learning-title"
      >
        <article className="rounded-lg border border-slate-800 bg-slate-900 p-5 shadow-lg sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2
                id="continue-learning-title"
                className="text-xl font-bold text-white"
              >
                Continue Learning
              </h2>
              <h3 className="mt-2 text-base font-semibold text-slate-200">
                Module 1: Foundations of AI Engineering
              </h3>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
                Your next session focuses on shaping context, testing model
                behavior, and turning repeatable prompts into reliable
                workflows.
              </p>
            </div>
            <span className="inline-flex w-fit rounded-lg bg-slate-800 px-3 py-1 text-sm font-bold text-cyan-400">
              18%
            </span>
          </div>

          <div className="mt-6" aria-label="Module progress">
            <div className="h-2 rounded-full bg-slate-800">
              <div className="h-2 w-[18%] rounded-full bg-gradient-to-r from-blue-600 to-cyan-400" />
            </div>
          </div>

          <ul className="mt-6 divide-y divide-slate-800">
            {lessons.map((lesson, index) => (
              <li
                key={lesson}
                className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="text-sm font-semibold text-slate-100">
                  {lesson}
                </span>
                <span className="text-sm text-slate-400">
                  Lesson {index + 1}
                </span>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-lg border border-slate-800 bg-slate-900 p-5 shadow-lg sm:p-6">
          <h2 className="text-xl font-bold text-white">Skill Focus</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            This week emphasizes prompt clarity, reusable context, evaluation
            rubrics, and automation habits for production-quality AI work.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {["Prompting", "Evaluation", "Context", "Automation"].map(
              (skill) => (
                <span
                  key={skill}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-sm font-semibold text-slate-200"
                >
                  {skill}
                </span>
              ),
            )}
          </div>
        </article>
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
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="rounded-lg border border-slate-800 bg-slate-900 p-5 shadow-md"
          >
            <div className="h-4 w-28 animate-pulse rounded bg-slate-700" />
            <div className="mt-4 h-8 w-20 animate-pulse rounded bg-slate-700" />
            <div className="mt-3 h-4 w-36 animate-pulse rounded bg-slate-800" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
