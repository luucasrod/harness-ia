"use client";

import Link from "next/link";

type LessonErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function LessonError({ error, reset }: LessonErrorProps) {
  return (
    <section className="rounded-lg border border-rose-400/30 bg-rose-950/30 p-6 shadow-lg">
      <p className="text-sm font-semibold uppercase tracking-wide text-rose-200">
        Something went wrong
      </p>
      <h1 className="mt-3 text-2xl font-semibold text-white">
        The lesson could not be displayed.
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-rose-100/80">
        {error.message || "Refresh the lesson or return to the course library."}
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-white px-4 text-sm font-semibold text-rose-950 transition hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-white"
        >
          Try again
        </button>
        <Link
          href="/dashboard/courses"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-rose-200/30 px-4 text-sm font-semibold text-rose-50 transition hover:bg-rose-200/10 focus:outline-none focus:ring-2 focus:ring-rose-100"
        >
          Back to courses
        </Link>
      </div>
    </section>
  );
}
