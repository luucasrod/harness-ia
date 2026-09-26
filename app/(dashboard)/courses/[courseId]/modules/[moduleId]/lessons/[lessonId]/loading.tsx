const lessonSkeletonRows = Array.from({ length: 7 }, (_, index) => index);
const outlineSkeletonRows = Array.from({ length: 5 }, (_, index) => index);

export default function LessonLoading() {
  return (
    <div className="grid animate-pulse gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900">
        <div className="border-b border-slate-800 bg-slate-950/60 px-6 py-7 sm:px-8">
          <div className="h-4 w-64 rounded bg-slate-800" />
          <div className="mt-5 h-10 w-3/4 rounded bg-slate-800" />
          <div className="mt-4 h-5 w-2/3 rounded bg-slate-800" />
        </div>
        <div className="space-y-5 px-6 py-8 sm:px-8">
          {lessonSkeletonRows.map((row) => (
            <div
              key={row}
              className="h-4 rounded bg-slate-800"
              style={{ width: `${row % 3 === 0 ? 92 : row % 3 === 1 ? 78 : 86}%` }}
            />
          ))}
        </div>
      </section>

      <aside className="rounded-lg border border-slate-800 bg-slate-900/75 p-4">
        <div className="h-3 w-28 rounded bg-slate-800" />
        <div className="mt-3 h-5 w-48 rounded bg-slate-800" />
        <div className="mt-5 space-y-3">
          {outlineSkeletonRows.map((row) => (
            <div key={row} className="h-16 rounded-lg bg-slate-800/80" />
          ))}
        </div>
      </aside>
    </div>
  );
}
