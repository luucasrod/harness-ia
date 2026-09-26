"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type TopNavProps = {
  onMenuClick: () => void;
};

const sessionCookies = [
  "harness-ia-session",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "authjs.session-token",
  "__Secure-authjs.session-token",
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

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  function handleLogout() {
    clearSessionCookies();
    router.push("/auth/login");
  }

  return (
    <header className="sticky top-0 z-20 flex flex-col gap-3 border-b border-slate-800/80 bg-slate-950/90 px-4 py-3 shadow-md backdrop-blur sm:h-16 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-start">
        <button
          type="button"
          className="rounded-lg p-2 text-slate-300 transition hover:bg-slate-700 hover:text-white hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-cyan-400 sm:hidden"
          onClick={onMenuClick}
          aria-label="Open navigation"
        >
          <span className="block h-0.5 w-5 bg-current" />
          <span className="mt-1.5 block h-0.5 w-5 bg-current" />
          <span className="mt-1.5 block h-0.5 w-5 bg-current" />
        </button>

        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 sm:hidden"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white shadow-lg shadow-blue-950/40">
            IA
          </span>
          <span className="bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-300 bg-clip-text text-base font-bold text-transparent">
            Harness IA
          </span>
        </Link>

        <div className="hidden sm:block">
          <p className="text-sm font-medium text-slate-400">
            Learning dashboard
          </p>
          <p className="text-lg font-semibold text-white">Welcome back</p>
        </div>
      </div>

      <div className="relative flex w-full justify-end sm:w-auto" ref={menuRef}>
        <button
          type="button"
          className="flex items-center gap-3 rounded-lg p-1.5 text-left transition hover:bg-slate-700 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          aria-label="Open user menu"
        >
          <span className="hidden text-right sm:block">
            <span className="block text-sm font-semibold text-white">
              Lucas
            </span>
            <span className="block text-xs text-slate-400">Student</span>
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-cyan-400 text-sm font-bold text-white shadow-md">
            L
          </span>
        </button>

        {menuOpen ? (
          <div
            className="absolute right-0 top-12 w-56 overflow-hidden rounded-lg border border-slate-700 bg-slate-900 shadow-lg"
            role="menu"
          >
            <Link
              href="/dashboard/profile"
              className="block px-4 py-3 text-sm text-slate-200 transition hover:bg-slate-700 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-400"
              role="menuitem"
              onClick={() => setMenuOpen(false)}
            >
              Profile
            </Link>
            <Link
              href="/dashboard/profile"
              className="block px-4 py-3 text-sm text-slate-200 transition hover:bg-slate-700 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-400"
              role="menuitem"
              onClick={() => setMenuOpen(false)}
            >
              Settings
            </Link>
            <button
              type="button"
              className="block w-full px-4 py-3 text-left text-sm font-semibold text-red-300 transition hover:bg-slate-700 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-400"
              role="menuitem"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
