export default function DashboardProfilePage() {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900 p-6">
      <p className="text-sm font-medium text-cyan-300">Perfil</p>
      <h2 className="mt-2 text-2xl font-semibold text-white">
        Configurações de perfil
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
        Configurações de usuário e preferências da conta ficarão aqui quando a
        autenticação estiver totalmente conectada.
      </p>
    </section>
  );
}
