'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

type TopNavProps = {
  onMenuClick: () => void;
};

const sessionCookies = [
  'harness-ia-session',
  'next-auth.session-token',
  '__Secure-next-auth.session-token',
  'authjs.session-token',
  '__Secure-authjs.session-token',
];

function clearSessionCookies() {
  for (const name of sessionCookies) {
    document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
    document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax; Secure`;
  }
}

export default function TopNav({ onMenuClick }: TopNavProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  function handleLogout() {
    clearSessionCookies();
    router.push('/login');
  }

  return (
    <header className="sticky top-0 z-20 flex min-w-0 flex-col gap-3 border-b border-line bg-ink/90 px-4 py-3 backdrop-blur sm:h-16 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex w-full min-w-0 items-center justify-between gap-3 sm:w-auto sm:justify-start">
        <button
          type="button"
          className="rounded-lg p-2 text-muted transition hover:bg-surface hover:text-white sm:hidden"
          onClick={onMenuClick}
          aria-label="Abrir navegação"
        >
          <span className="block h-0.5 w-5 bg-current" />
          <span className="mt-1.5 block h-0.5 w-5 bg-current" />
          <span className="mt-1.5 block h-0.5 w-5 bg-current" />
        </button>

        <Link
          href="/dashboard"
          className="flex min-w-0 items-center gap-2 rounded-lg sm:hidden"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand text-xs font-bold text-white">
            IA
          </span>
          <span className="truncate text-base font-bold text-white">
            Harness IA
          </span>
        </Link>

        <div className="hidden sm:block">
          <p className="text-sm font-medium text-muted">Área de aprendizado</p>
          <p className="text-lg font-semibold text-white">Bem-vindo de volta</p>
        </div>
      </div>

      <div
        className="relative flex w-full justify-end sm:w-auto"
        ref={menuRef}
      >
        <button
          type="button"
          className="flex items-center gap-3 rounded-lg p-1.5 text-left transition hover:bg-surface"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          aria-label="Abrir menu do usuário"
        >
          <span className="hidden text-right sm:block">
            <span className="block text-sm font-semibold text-white">Lucas</span>
            <span className="block text-xs text-muted">Estudante</span>
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">
            L
          </span>
        </button>

        {menuOpen ? (
          <div
            className="absolute right-0 top-12 w-56 overflow-hidden rounded-lg border border-line bg-ink-raised"
            role="menu"
          >
            <Link
              href="/dashboard/profile"
              className="block px-4 py-3 text-sm text-muted transition hover:bg-surface hover:text-white"
              role="menuitem"
              onClick={() => setMenuOpen(false)}
            >
              Perfil
            </Link>
            <Link
              href="/dashboard/skills"
              className="block px-4 py-3 text-sm text-muted transition hover:bg-surface hover:text-white"
              role="menuitem"
              onClick={() => setMenuOpen(false)}
            >
              Habilidades
            </Link>
            <button
              type="button"
              className="block w-full px-4 py-3 text-left text-sm font-semibold text-danger transition hover:bg-danger/10"
              role="menuitem"
              onClick={handleLogout}
            >
              Sair
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
