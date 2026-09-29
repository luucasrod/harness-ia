'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type SidebarProps = {
  isOpen?: boolean;
  onClose?: () => void;
};

const navItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: 'M3 12h7V3H3v9Zm0 9h7v-7H3v7Zm11 0h7v-9h-7v9Zm0-11h7V3h-7v7Z',
  },
  {
    href: '/dashboard/courses',
    label: 'Cursos',
    icon: 'M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5A2.5 2.5 0 0 1 17.5 21H6.5A2.5 2.5 0 0 1 4 18.5v-13ZM6.5 16A2.5 2.5 0 0 0 4 18.5M8 7h8M8 11h6',
  },
  {
    href: '/dashboard/progress',
    label: 'Progresso',
    icon: 'M4 19V5m0 14h16M8 16v-5m4 5V8m4 8v-3',
  },
  {
    href: '/dashboard/skills',
    label: 'Habilidades',
    icon: 'M12 3 4 7v6c0 4 3.5 7 8 8 4.5-1 8-4 8-8V7l-8-4Zm-3 9 2 2 4-5',
  },
  {
    href: '/dashboard/profile',
    label: 'Perfil',
    icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0',
  },
];

function isActivePath(pathname: string, href: string) {
  if (href === '/dashboard') {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-ink/70 transition-opacity duration-300 sm:hidden ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden="true"
        onClick={onClose}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 max-w-[85vw] flex-col border-r border-line bg-ink-raised transition-transform duration-300 ease-out-soft sm:static sm:z-auto sm:w-[17rem] sm:max-w-none sm:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Navegação principal"
      >
        <div className="flex h-16 items-center justify-between border-b border-line px-5">
          <Link
            href="/dashboard"
            className="flex min-w-0 items-center gap-3 rounded-lg"
            onClick={onClose}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">
              IA
            </span>
            <span className="truncate text-base font-bold text-white">
              Harness IA
            </span>
          </Link>

          <button
            type="button"
            className="rounded-lg p-2 text-muted transition hover:bg-surface hover:text-white sm:hidden"
            onClick={onClose}
            aria-label="Fechar navegação"
          >
            <span className="block h-5 w-5 text-center text-xl leading-4">
              ×
            </span>
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
          {navItems.map((item) => {
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                aria-current={active ? 'page' : undefined}
                className={`flex h-11 min-w-0 items-center gap-3 rounded-lg px-3 text-sm transition-[background-color,color] duration-200 ease-out-soft ${
                  active
                    ? 'border-l-2 border-brand bg-brand/15 font-bold text-brand-text'
                    : 'border-l-2 border-transparent font-medium text-muted hover:bg-surface hover:text-white'
                }`}
              >
                <svg
                  className="h-5 w-5 shrink-0"
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                >
                  <path d={item.icon} />
                </svg>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-line p-4">
          <div className="rounded-lg border border-line bg-surface p-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">
              Trilha atual
            </p>
            <p className="mt-1 text-sm font-semibold leading-5 text-white">
              Fundamentos de Engenharia de IA
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
