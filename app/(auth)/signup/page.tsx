'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password }),
      });

      if (res.ok) {
        router.push('/auth/login');
      } else {
        setError('Erro ao criar conta');
      }
    } catch (err) {
      setError('Erro ao conectar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-0">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            Harness IA
          </h1>
          <p className="text-gray-400">Comece a aprender hoje</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">Nome</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={() => setFocused('name')}
              onBlur={() => setFocused(null)}
              className={`w-full px-4 py-3 bg-slate-800 text-white rounded-lg border-2 transition-all placeholder-gray-500 focus:outline-none ${
                focused === 'name' ? 'border-blue-400 shadow-[0_0_20px_rgba(96,165,250,0.3)]' : 'border-slate-600'
              }`}
              placeholder="Seu nome completo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused(null)}
              className={`w-full px-4 py-3 bg-slate-800 text-white rounded-lg border-2 transition-all placeholder-gray-500 focus:outline-none ${
                focused === 'email' ? 'border-blue-400 shadow-[0_0_20px_rgba(96,165,250,0.3)]' : 'border-slate-600'
              }`}
              placeholder="student@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused(null)}
              className={`w-full px-4 py-3 bg-slate-800 text-white rounded-lg border-2 transition-all placeholder-gray-500 focus:outline-none ${
                focused === 'password' ? 'border-blue-400 shadow-[0_0_20px_rgba(96,165,250,0.3)]' : 'border-slate-600'
              }`}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm flex items-center gap-2">
              <span>⚠</span>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full px-4 py-3 font-semibold rounded-lg text-white transition-all flex items-center justify-center gap-2 ${
              loading
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-cyan-400 hover:shadow-lg hover:shadow-blue-500/50 active:scale-95'
            }`}
            aria-busy={loading}
          >
            {loading ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Criando...
              </>
            ) : (
              'Criar Conta'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          Já tem conta?{' '}
          <Link href="/auth/login" className="text-blue-400 hover:text-cyan-400 font-medium transition-colors">
            Fazer login aqui
          </Link>
        </p>
      </div>
    </div>
  );
}
