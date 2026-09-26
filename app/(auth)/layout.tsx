import '../globals.css';

export const metadata = {
  title: 'Harness IA - Autenticação',
  description: 'Login e registro',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">Harness IA</h1>
            <p className="text-slate-400">Programação & Engenharia com IA</p>
          </div>
          <div className="bg-slate-800 rounded-lg shadow-2xl p-8 border border-slate-700">
            {children}
          </div>
          <p className="text-center text-slate-500 text-xs mt-6">Plataforma educacional para aprender software engineering</p>
        </div>
      </body>
    </html>
  );
}
