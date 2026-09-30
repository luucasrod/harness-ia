const contentRows = Array.from({ length: 7 }, (_, index) => index);
const outlineRows = Array.from({ length: 5 }, (_, index) => index);

export default function LessonLoading() {
  return (
    <div className="grid animate-pulse gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
      <div className="min-w-0">
        <div className="rounded-xl border border-line bg-ink-raised p-4">
          <div className="h-3 w-16 rounded bg-surface" />
          <div className="mt-3 h-4 w-40 rounded bg-surface" />
          <div className="mt-5 h-1.5 w-full rounded-full bg-surface" />
          <div className="mt-5 space-y-2">
            {outlineRows.map((row) => (
              <div className="h-12 rounded-lg bg-surface/80" key={row} />
            ))}
          </div>
        </div>
      </div>

      <div className="min-w-0">
        <section className="overflow-hidden rounded-xl border border-line bg-ink-raised">
          <div className="border-b border-line px-6 py-7 sm:px-8">
            <div className="h-3 w-64 rounded bg-surface" />
            <div className="mt-5 h-9 w-3/4 rounded bg-surface" />
            <div className="mt-4 h-4 w-2/3 rounded bg-surface" />
          </div>
          <div className="space-y-5 px-6 py-8 sm:px-8">
            {contentRows.map((row) => (
              <div
                className="h-4 rounded bg-surface"
                key={row}
                style={{ width: `${row % 3 === 0 ? 92 : row % 3 === 1 ? 78 : 86}%` }}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
