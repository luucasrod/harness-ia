'use client';

import Link from 'next/link';
import { useId, useState } from 'react';

import AuthCard from '@/app/components/AuthCard';
import '@/app/styles/auth.css';

export default function ForgotPasswordPage() {
  const emailFieldId = useId();
  const [email, setEmail] = useState('');

  return (
    <AuthCard tagline="Harness IA" title="Recuperar acesso">
      <div className="auth-fade-in auth-fade-in-delay-1 space-y-5 px-8 py-8">
        <p className="text-sm leading-6 text-muted">
          A redefinição de senha é feita pela equipe de suporte. Informe o
          e-mail da sua conta e avisaremos como prosseguir.
        </p>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            setEmail('');
          }}
        >
          <label
            htmlFor={emailFieldId}
            className="mb-2 block text-sm font-medium text-white"
          >
            E-mail da conta
          </label>
          <input
            id={emailFieldId}
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="voce@exemplo.com"
            className="w-full rounded-lg border border-line bg-surface px-4 py-3 text-base text-white placeholder:text-muted/70 transition-[border-color,box-shadow] duration-200 ease-out-soft focus:border-brand focus:ring-4 focus:ring-brand-ring focus:outline-none"
          />
          <button
            type="submit"
            className="mt-4 w-full rounded-lg bg-brand px-4 py-3 text-base font-semibold text-white transition-[background-color,transform] duration-200 ease-out-soft hover:scale-[1.02] hover:bg-brand-strong active:scale-[0.98]"
          >
            Solicitar ajuda
          </button>
        </form>

        <p className="text-center text-sm text-muted">
          Lembrou a senha?{' '}
          <Link
            href="/auth/login"
            className="font-medium text-brand-text underline-offset-4 transition-colors duration-200 hover:text-brand-soft hover:underline"
          >
            Voltar para o login
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}
