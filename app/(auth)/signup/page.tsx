'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useId, useState } from 'react';

import AuthCard from '@/app/components/AuthCard';
import '@/app/styles/auth.css';

const inputClassName =
  'w-full rounded-lg border bg-surface px-4 py-3 text-base text-white placeholder:text-muted/70 ' +
  'transition-[border-color,box-shadow] duration-200 ease-out-soft ' +
  'focus:border-brand focus:ring-4 focus:ring-brand-ring focus:outline-none';

export default function SignupPage() {
  const router = useRouter();
  const nameFieldId = useId();
  const emailFieldId = useId();
  const passwordFieldId = useId();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password }),
      });

      if (response.ok) {
        router.push('/auth/login');
        router.refresh();
        return;
      }

      setError('Não foi possível criar a conta com esses dados.');
    } catch {
      setError('Não foi possível conectar. Tente novamente em instantes.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard tagline="Comece a aprender hoje" title="Criar conta">
      <form
        onSubmit={handleSubmit}
        noValidate
        className="auth-fade-in auth-fade-in-delay-1 space-y-5 px-8 py-8"
      >
        {error ? (
          <p
            role="alert"
            className="auth-error-in rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger"
          >
            {error}
          </p>
        ) : null}

        <div>
          <label
            htmlFor={nameFieldId}
            className="mb-2 block text-sm font-medium text-white"
          >
            Nome
          </label>
          <input
            id={nameFieldId}
            name="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Seu nome completo"
            className={inputClassName}
          />
        </div>

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
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Mínimo de 8 caracteres"
            className={inputClassName}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className="w-full rounded-lg bg-brand px-4 py-3 text-base font-semibold text-white transition-[background-color,transform] duration-200 ease-out-soft hover:scale-[1.02] hover:bg-brand-strong active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
        >
          {isSubmitting ? 'Criando...' : 'Criar conta'}
        </button>

        <p className="text-center text-sm text-muted">
          Já tem conta?{' '}
          <Link
            href="/auth/login"
            className="font-medium text-brand-text underline-offset-4 transition-colors duration-200 hover:text-brand-soft hover:underline"
          >
            Fazer login
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
