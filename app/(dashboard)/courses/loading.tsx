const skeletonCards = Array.from({ length: 4 }, (_, index) => index);

export default function CoursesLoading() {
  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-6 dark:bg-zinc-950 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-zinc-100 bg-zinc-950 px-5 py-6 dark:border-zinc-800 sm:px-6">
            <div className="h-4 w-20 animate-pulse rounded bg-white/20" />
            <div className="mt-4 h-8 w-56 animate-pulse rounded bg-white/20" />
            <div className="mt-4 h-4 max-w-xl animate-pulse rounded bg-white/15" />
          </div>
        </section>

        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {skeletonCards.map((card) => (
            <div
              className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              key={card}
            >
              <div className="h-44 animate-pulse bg-zinc-200 dark:bg-zinc-800" />
              <div className="space-y-4 p-5">
                <div className="flex justify-between">
                  <div className="h-6 w-24 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                  <div className="h-5 w-16 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                </div>
                <div className="h-6 w-4/5 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                <div className="space-y-2">
                  <div className="h-4 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                </div>
                <div className="h-2 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
