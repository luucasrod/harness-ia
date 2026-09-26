import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
      <section className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <p className="text-sm font-medium text-cyan-300">Harness IA</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Sign in</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Authentication will be connected by the auth task. This public page is
          ready for protected route redirects and logout.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-lg bg-cyan-400 px-4 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
        >
          Return to dashboard
        </Link>
      </section>
    </main>
  );
}
