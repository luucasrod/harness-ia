import type { ReactNode } from 'react';

type AuthCardProps = {
  title: string;
  tagline?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export default function AuthCard({
  title,
  tagline,
  children,
  footer,
}: AuthCardProps) {
  return (
    <div className="w-full max-w-md">
      <div className="auth-fade-in overflow-hidden rounded-2xl border border-line bg-ink-raised shadow-[0_24px_60px_-24px_rgba(0,0,0,0.9)]">
        <div
          className="px-8 py-9 text-center"
          style={{
            backgroundImage: 'linear-gradient(180deg, #0066FF 0%, #0052CC 100%)',
          }}
        >
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 text-lg font-bold text-white ring-1 ring-white/30">
            IA
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-white">
            {title}
          </h1>
          {tagline ? (
            <p className="mt-2 text-sm leading-6 text-white/85">{tagline}</p>
          ) : null}
        </div>

        {children}
      </div>

      {footer ? (
        <p className="auth-fade-in auth-fade-in-delay-3 mt-6 text-center text-xs leading-5 text-muted">
          {footer}
        </p>
      ) : null}
    </div>
  );
}
