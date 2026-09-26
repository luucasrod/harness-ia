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
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
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
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-zinc-200 bg-white/95 px-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-50 lg:hidden"
          onClick={onMenuClick}
          aria-label="Open navigation"
        >
          <span className="block h-0.5 w-5 bg-current" />
          <span className="mt-1.5 block h-0.5 w-5 bg-current" />
          <span className="mt-1.5 block h-0.5 w-5 bg-current" />
        </button>

        <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-950 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-950">
            IA
          </span>
          <span className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
            Harness IA
          </span>
        </Link>

        <div className="hidden lg:block">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Learning dashboard
          </p>
          <h1 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
            Welcome back
          </h1>
        </div>
      </div>

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          className="flex items-center gap-3 rounded-lg p-1.5 text-left hover:bg-zinc-100 dark:hover:bg-zinc-900"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
        >
          <span className="hidden text-right sm:block">
            <span className="block text-sm font-medium text-zinc-950 dark:text-zinc-50">
              Lucas
            </span>
            <span className="block text-xs text-zinc-500 dark:text-zinc-400">
              Student
            </span>
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-sm font-semibold text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
            L
          </span>
        </button>

        {menuOpen ? (
          <div
            className="absolute right-0 mt-2 w-56 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
            role="menu"
          >
            <Link
              href="/dashboard/profile"
              className="block px-4 py-3 text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-900"
              role="menuitem"
              onClick={() => setMenuOpen(false)}
            >
              Profile
            </Link>
            <Link
              href="/dashboard/profile"
              className="block px-4 py-3 text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-900"
              role="menuitem"
              onClick={() => setMenuOpen(false)}
            >
              Settings
            </Link>
            <button
              type="button"
              className="block w-full px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
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
