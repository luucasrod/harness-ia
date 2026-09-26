const stats = [
  { label: "Course progress", value: "18%", detail: "Module 1 in progress" },
  { label: "Lessons completed", value: "4", detail: "Keep the streak alive" },
  { label: "Skills mapped", value: "7", detail: "Prompting and evaluation" },
];

const nextLessons = [
  "Harnessing context for reliable answers",
  "Prompt patterns for engineering tasks",
  "Evaluating model outputs with rubrics",
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-800 bg-slate-900 p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-cyan-300">Dashboard</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Welcome back, Lucas
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Pick up your AI engineering course where you left off and keep
              building practical skills one focused session at a time.
            </p>
          </div>

          <a
            href="/dashboard/courses"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-cyan-400 px-4 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-300"
          >
            Continue learning
          </a>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-slate-800 bg-slate-900 p-5"
          >
            <p className="text-sm font-medium text-slate-400">{stat.label}</p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {stat.value}
            </p>
            <p className="mt-2 text-sm text-slate-300">{stat.detail}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-white">
                Continue Learning
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                Module 1: Foundations of AI Engineering
              </p>
            </div>
            <span className="rounded-md bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-200">
              18%
            </span>
          </div>

          <div className="mt-5 h-2 rounded-full bg-slate-800">
            <div className="h-2 w-[18%] rounded-full bg-cyan-400" />
          </div>

          <ul className="mt-5 divide-y divide-slate-800">
            {nextLessons.map((lesson, index) => (
              <li
                key={lesson}
                className="flex items-center justify-between gap-4 py-3"
              >
                <span className="text-sm font-medium text-slate-100">
                  {lesson}
                </span>
                <span className="text-xs text-slate-400">
                  Lesson {index + 1}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
          <h3 className="text-lg font-semibold text-white">Skill Focus</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            This week emphasizes prompt clarity, reusable context, and
            verification habits for production-quality AI workflows.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {["Prompting", "Evaluation", "Context", "Automation"].map(
              (skill) => (
                <span
                  key={skill}
                  className="rounded-md bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-200"
                >
                  {skill}
                </span>
              ),
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
