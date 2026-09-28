# LIÇÃO 2.4: Routing & Code Splitting - Next.js App Router

## INTRODUÇÃO (5 min)

App Router (v13+) modernizou Next.js: layouts nested, Server Components, code splitting automático.

Antiga Pages Router: cada arquivo é uma rota. New App Router: estrutura de pasta é estrutura de rota, layouts são compostos, Server Components reduzem JavaScript.

Esta lição foca em App Router (moderno).

---

## APP ROUTER BASICS (12 min)

### Estrutura de Pastas = Rotas

```
app/
├── layout.tsx          // Root layout (HTML, stylesheets, navbar, footer)
├── page.tsx            // GET / → index page
│
├── dashboard/
│   ├── layout.tsx      // Dashboard layout (sidebar, etc)
│   ├── page.tsx        // GET /dashboard
│   └── settings/
│       └── page.tsx    // GET /dashboard/settings
│
└── lesson/
    └── [id]/
        ├── page.tsx    // GET /lesson/:id (dynamic route)
        └── loading.tsx // Loading UI while page loads
```

### Dynamic Routes

```typescript
// app/lesson/[id]/page.tsx
export default function LessonPage({ params }: { params: { id: string } }) {
  return <div>Lesson {params.id}</div>;
}

// Visitando /lesson/1 renderiza Lesson 1
// Visitando /lesson/2 renderiza Lesson 2
```

### Layouts Nested

```typescript
// app/lesson/layout.tsx (compartilhado por todos /lesson/*)
export default function LessonLayout({ children }: { children: ReactNode }) {
  return (
    <div className="lesson-layout">
      <LessonSidebar />
      <main>{children}</main>
    </div>
  );
}

// app/lesson/[id]/page.tsx renderiza dentro deste layout
```

---

## SERVER vs CLIENT COMPONENTS (10 min)

### Server Components (Padrão)

```typescript
// app/lesson/[id]/page.tsx (Server Component por padrão)
import { fetchLesson } from '@/lib/api';

export default async function LessonPage({ params }: Props) {
  // Roda no servidor ✅
  const lesson = await fetchLesson(params.id);
  
  // Sem JavaScript no cliente
  return (
    <div>
      <h1>{lesson.title}</h1>
      <p>{lesson.content}</p>
    </div>
  );
}
```

**Benefícios Server Components:**
- Sem enviar API keys ao browser
- Acesso direto ao banco
- Menos JavaScript no cliente (melhor performance)

### Client Components

```typescript
// app/lesson/[id]/quiz.tsx
'use client'; // Marca como Client Component

import { useState } from 'react';

export default function Quiz({ exerciseId }: Props) {
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState(null);

  const handleSubmit = async () => {
    const res = await fetch(`/api/exercises/${exerciseId}/grade`, {
      method: 'POST',
      body: JSON.stringify({ answer })
    });
    setResult(await res.json());
  };

  return (
    <div>
      <input value={answer} onChange={(e) => setAnswer(e.target.value)} />
      <button onClick={handleSubmit}>Submit</button>
      {result && <ResultDisplay result={result} />}
    </div>
  );
}

// Importar em Server Component
// app/lesson/[id]/page.tsx
export default async function LessonPage({ params }: Props) {
  const lesson = await fetchLesson(params.id);
  
  return (
    <div>
      <h1>{lesson.title}</h1>
      <Quiz exerciseId={lesson.exerciseId} /> {/* Client Component */}
    </div>
  );
}
```

**Quando usar Client Components:**
- Hooks (useState, useEffect)
- Event listeners
- Browser APIs

---

## CODE SPLITTING & DYNAMIC IMPORTS (8 min)

### Automático por Rota

Next.js automaticamente split código por rota. Visitando `/lesson/1` não carrega JavaScript de `/dashboard`.

### Componentes Dinâmicos (Lazy Load)

```typescript
import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';

// Lazy load componente pesado (AITutorPanel)
const AITutorPanel = dynamic(
  () => import('@/components/AITutorPanel'),
  { loading: () => <AITutorSkeleton /> }
);

export default function LessonPage() {
  return (
    <div>
      <LessonContent /> {/* Carrega imediatamente */}
      <AITutorPanel /> {/* Carrega quando precisa (lazy) */}
    </div>
  );
}
```

**Quando usar:**
- Componentes pesados (editores, gráficos)
- Features opcionais (painel do professor)
- Abaixo do fold (não renderiza até scroll)

---

## METADATA & SEO (5 min)

```typescript
// app/lesson/[id]/page.tsx
import type { Metadata } from 'next';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lesson = await fetchLesson(params.id);
  
  return {
    title: lesson.title,
    description: lesson.summary,
    og: {
      title: lesson.title,
      description: lesson.summary,
      image: lesson.thumbnail
    }
  };
}

export default async function LessonPage({ params }: Props) {
  const lesson = await fetchLesson(params.id);
  return <div>...</div>;
}
```

Google indexa corretamente, redes sociais mostram preview correto.

---

## EXEMPLO REAL: Estrutura Completa

```
app/
├── layout.tsx              // Root: navbar, footer
├── page.tsx                // Home
│
├── (auth)/                 // Grupo (não aparece em URL)
│   ├── login/page.tsx      // /login
│   └── register/page.tsx   // /register
│
├── dashboard/
│   ├── layout.tsx          // Sidebar
│   ├── page.tsx            // /dashboard
│   └── progress/
│       ├── page.tsx        // /dashboard/progress
│       └── [module]/
│           └── page.tsx    // /dashboard/progress/:module
│
└── lesson/
    ├── layout.tsx          // Lesson layout
    └── [id]/
        ├── page.tsx        // /lesson/:id (Server Component)
        ├── quiz.tsx        // 'use client' (Client Component)
        ├── ai-tutor.tsx    // 'use client'
        └── loading.tsx     // Loading skeleton
```

---

## KEY TAKEAWAYS

1. **App Router:** Pastas = rotas, layouts compostos
2. **Server Components:** Padrão, menos JS, acesso ao banco
3. **Client Components:** 'use client', hooks, event listeners
4. **Code Splitting:** Automático por rota, dynamic() pra lazy load
5. **Metadata:** generateMetadata() para SEO automático
