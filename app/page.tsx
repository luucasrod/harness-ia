import Image from 'next/image';
import Link from 'next/link';

const highlights = [
  {
    title: 'Agentes de IA',
    description:
      'Aprenda a projetar tutores, fluxos multiagente e automações com segurança, custo controlado e observabilidade.',
  },
  {
    title: 'Modelos de ML',
    description:
      'Entenda como escolher, avaliar e integrar modelos em sistemas reais sem transformar protótipos em dívida técnica.',
  },
  {
    title: 'Governança',
    description:
      'Construa critérios para privacidade, auditoria, qualidade de resposta e operação responsável de IA em produção.',
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-ink text-white">
      <section className="mx-auto grid min-h-screen w-full max-w-7xl gap-10 px-5 py-8 sm:px-6 sm:py-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)] lg:items-center lg:px-8">
        <div className="max-w-2xl space-y-7">
          <div className="inline-flex items-center rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-brand-text">
            Curso Engenharia Harness IA
          </div>

          <div className="space-y-5">
            <h1 className="text-4xl font-bold leading-tight tracking-normal text-white sm:text-5xl lg:text-6xl">
              Engenharia de software para produtos com IA
            </h1>
            <p className="max-w-xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
              Uma trilha prática para sair de prompts soltos e construir
              sistemas com arquitetura, testes, deploy, governança e experiência
              de produto.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-brand px-5 text-sm font-bold text-white transition hover:bg-brand-strong focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-ink"
            >
              Acessar dashboard
            </Link>
            <Link
              href="/login"
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-line px-5 text-sm font-bold text-white transition hover:border-brand hover:text-brand-text focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-ink"
            >
              Entrar na conta
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {highlights.map((item) => (
              <article
                key={item.title}
                className="rounded-lg border border-line bg-ink-raised p-4"
              >
                <h2 className="text-sm font-bold text-white">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="relative min-h-[320px] overflow-hidden rounded-lg border border-line bg-ink-raised shadow-[0_20px_60px_rgba(0,0,0,0.35)] sm:min-h-[440px] lg:min-h-[540px]">
          <Image
            src="/ai-technology-hero.png"
            alt="Chip de IA conectado a painéis de dados e redes neurais"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 52vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/10 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 grid gap-3 p-4 sm:grid-cols-3 sm:p-5">
            {['Arquitetura', 'Observabilidade', 'Deploy'].map((label) => (
              <div
                key={label}
                className="rounded-lg border border-white/10 bg-black/35 p-3 backdrop-blur"
              >
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-text">
                  {label}
                </p>
                <div className="mt-3 h-1.5 rounded-full bg-white/15">
                  <div className="h-full w-2/3 rounded-full bg-brand" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
