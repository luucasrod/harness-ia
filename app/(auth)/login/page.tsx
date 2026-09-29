'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Suspense, useId, useState } from 'react';

import AuthCard from '@/app/components/AuthCard';
import '@/app/styles/auth.css';

const inputClassName =
  'w-full rounded-lg border bg-surface px-4 py-3 text-base text-white placeholder:text-muted/70 ' +
  'transition-[border-color,box-shadow] duration-200 ease-out-soft ' +
  'focus:border-brand focus:ring-4 focus:ring-brand-ring focus:outline-none ' +
  'aria-[invalid=true]:border-danger';

const buttonClassName =
  'w-full rounded-lg bg-brand px-4 py-3 text-base font-semibold text-white ' +
  'transition-[background-color,transform] duration-200 ease-out-soft ' +
  'hover:scale-[1.02] hover:bg-brand-strong active:scale-[0.98] ' +
  'disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100';

const linkClassName =
  'font-medium text-brand-text underline-offset-4 transition-colors duration-200 ' +
  'hover:text-brand-soft hover:underline';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next');

  const emailFieldId = useId();
  const passwordFieldId = useId();
  const rememberFieldId = useId();
  const errorId = useId();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
      callbackUrl: nextPath ?? '/dashboard',
    });

    if (result?.ok) {
      router.push(nextPath ?? '/dashboard');
      router.refresh();
      return;
    }

    setError(
      result?.error === 'CredentialsSignin'
        ? 'E-mail ou senha incorretos.'
        : 'Não foi possível entrar. Tente novamente em instantes.'
    );
    setIsSubmitting(false);
  }

  return (
    <AuthCard
      footer="Plataforma educacional para aprender engenharia de software com apoio de inteligência artificial."
      tagline="Estude engenharia com um tutor de IA"
      title="Harness IA"
    >
      <form
        onSubmit={handleSubmit}
        noValidate
        className="auth-fade-in auth-fade-in-delay-1 space-y-5 px-8 py-8"
      >
        {error ? (
          <p
            id={errorId}
            role="alert"
            className="auth-error-in flex items-start gap-2 rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="mt-0.5 h-4 w-4 shrink-0"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 4a1 1 0 012 0v5a1 1 0 11-2 0V4zm1 12a1.25 1.25 0 100-2.5 1.25 1.25 0 000 2.5z"
                clipRule="evenodd"
              />
            </svg>
            <span>{error}</span>
          </p>
        ) : null}

        <div>
          <label
            htmlFor={emailFieldId}
            className="mb-2 block text-sm font-medium text-white"
          >
            E-mail
          </label>
          <input
            id={emailFieldId}
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="voce@exemplo.com"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className={inputClassName}
          />
        </div>

        <div>
          <label
            htmlFor={passwordFieldId}
            className="mb-2 block text-sm font-medium text-white"
          >
            Senha
          </label>
          <input
            id={passwordFieldId}
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className={inputClassName}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <input
              id={rememberFieldId}
              name="remember"
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
              className="h-4 w-4 shrink-0 cursor-pointer rounded border-line bg-surface accent-brand"
            />
            <label
              htmlFor={rememberFieldId}
              className="cursor-pointer text-sm text-muted select-none hover:text-white"
            >
              Lembrar de mim
            </label>
          </div>

          <Link href="/auth/forgot-password" className={`text-sm ${linkClassName}`}>
            Esqueci minha senha
          </Link>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className={buttonClassName}
        >
          {isSubmitting ? 'Entrando...' : 'Entrar'}
        </button>

        <p className="text-center text-sm text-muted">
          Novo por aqui?{' '}
          <Link href="/auth/signup" className={linkClassName}>
            Criar conta
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={<div className="h-8 w-8 animate-pulse rounded-lg bg-surface" />}
    >
      <LoginForm />
    </Suspense>
  );
}
