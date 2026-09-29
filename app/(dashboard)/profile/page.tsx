export default function ProfilePage() {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
        Perfil
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
        Configurações de perfil
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">
        Configurações de usuário e preferências da conta ficarão aqui quando a
        autenticação estiver totalmente conectada.
      </p>
    </section>
  );
}
