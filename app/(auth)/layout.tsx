import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Autenticação',
  description: 'Entre na Harness IA para continuar seus estudos.',
};

type AuthLayoutProps = {
  children: ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-ink px-4 py-10 sm:px-6">
      {children}
    </div>
  );
}
