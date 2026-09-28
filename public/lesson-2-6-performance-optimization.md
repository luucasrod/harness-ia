# LIÇÃO 2.6: Performance & Optimization

## SEÇÃO 1: INTRODUÇÃO (5 minutos)

Performance não é estética. É confiabilidade percebida. Uma plataforma educacional lenta faz o aluno perder foco, repetir cliques e abandonar exercícios. Mas otimização prematura também é custo: código mais complexo, bugs sutis e tempo gasto onde não há gargalo.

Engineer mede primeiro, otimiza depois e valida no final. Nesta lição, vamos cobrir renderização, memoização, imagens, bundle, Web Vitals e monitoramento.

---

## SEÇÃO 2: RENDERIZAÇÃO DESNECESSÁRIA (8 minutos)

Nem todo re-render é problema. O problema é re-render caro ou frequente em área sensível.

```typescript
function Dashboard({ modules }: { modules: Module[] }) {
  const [query, setQuery] = React.useState("");

  return (
    <section>
      <input value={query} onChange={(event) => setQuery(event.target.value)} />
      {modules.map((module) => (
        <ModuleProgressCard key={module.id} module={module} />
      ))}
    </section>
  );
}
```

Cada tecla re-renderiza todos os cards. Isso pode ser irrelevante com 5 módulos e ruim com 500 cards complexos.

Solução possível:

```typescript
const ModuleProgressCard = React.memo(function ModuleProgressCard({
  module
}: {
  module: Module;
}) {
  return (
    <article>
      <h3>{module.title}</h3>
      <p>{module.completedLessons}/{module.totalLessons}</p>
    </article>
  );
});
```

Mas `React.memo` só ajuda se `module` mantém a mesma referência. Se você recria objetos no render, perde benefício.

---

## SEÇÃO 3: PROFILER E IDENTIFICAÇÃO (8 minutos)

Use React DevTools Profiler para responder:

- O que renderizou?
- Por que renderizou?
- Quanto tempo levou?
- O custo é percebido pelo usuário?

Fluxo prático: grave interação lenta, identifique componentes caros, veja props que mudam, aplique uma mudança, grave novamente.

```typescript
function SlowTutorSuggestions({ messages }: { messages: TutorMessage[] }) {
  const concepts = messages.flatMap((message) => message.concepts);
  const uniqueConcepts = concepts.filter((item, index) => concepts.indexOf(item) === index);

  return <SuggestionList items={uniqueConcepts} />;
}
```

Esse algoritmo é desnecessariamente caro.

```typescript
function TutorSuggestions({ messages }: { messages: TutorMessage[] }) {
  const uniqueConcepts = React.useMemo(() => {
    return Array.from(new Set(messages.flatMap((message) => message.concepts)));
  }, [messages]);

  return <SuggestionList items={uniqueConcepts} />;
}
```

---

## SEÇÃO 4: MEMOIZAÇÃO ESTRATÉGICA (8 minutos)

`memo`, `useMemo` e `useCallback` resolvem problemas diferentes.

```typescript
const LessonRow = React.memo(function LessonRow({
  lesson,
  onOpen
}: {
  lesson: Lesson;
  onOpen: (id: string) => void;
}) {
  return <button onClick={() => onOpen(lesson.id)}>{lesson.title}</button>;
});

function LessonList({ lessons }: { lessons: Lesson[] }) {
  const router = useRouter();

  const handleOpen = React.useCallback(
    (id: string) => {
      router.push(`/lessons/${id}`);
    },
    [router]
  );

  return lessons.map((lesson) => (
    <LessonRow key={lesson.id} lesson={lesson} onOpen={handleOpen} />
  ));
}
```

Checklist antes de memoizar:

- Existe lentidão medida?
- O componente é caro?
- As props podem ficar estáveis?
- A memoização deixa o código compreensível?
- O ganho foi validado depois?

---

## SEÇÃO 5: IMAGE OPTIMIZATION (7 minutos)

Imagens são causa comum de LCP ruim. Em Next.js, use `next/image` para dimensões, lazy loading e formatos otimizados.

```typescript
import Image from "next/image";

export function CourseHero() {
  return (
    <Image
      src="/course-cover.png"
      alt="Interface da plataforma educacional"
      width={1200}
      height={630}
      priority
    />
  );
}
```

Use `priority` apenas para imagem crítica acima da dobra. Para imagens de lista, deixe lazy loading padrão.

Reserve dimensões para evitar CLS:

```typescript
<Image
  src={lesson.thumbnailUrl}
  alt=""
  width={320}
  height={180}
  sizes="(max-width: 768px) 100vw, 320px"
/>
```

---

## SEÇÃO 6: BUNDLE ANALYSIS (7 minutos)

Bundle pesado nasce de imports descuidados.

```typescript
import { Chart } from "huge-chart-library";

export function DashboardSummary() {
  return <Chart />;
}
```

Se o gráfico aparece só quando o usuário abre analytics, adie.

```typescript
import dynamic from "next/dynamic";

const AnalyticsChart = dynamic(() => import("./analytics-chart"), {
  loading: () => <p>Carregando gráfico...</p>
});
```

Use Bundle Analyzer para descobrir peso real. Não otimize por palpite.

---

## SEÇÃO 7: WEB VITALS E MONITORAMENTO (7 minutos)

Métricas principais:

| Métrica | O que mede | Como melhorar |
|---|---|---|
| LCP | Maior conteúdo visível carregou rápido? | Imagem crítica otimizada, SSR, menos bloqueio |
| FID/INP | Interação responde rápido? | Menos JS, handlers leves, dividir trabalho |
| CLS | Layout pula? | Dimensões reservadas, fontes e imagens estáveis |

Produção precisa de monitoramento: Sentry para erros, logs estruturados para APIs, Web Vitals para experiência real.

```typescript
export function reportWebVitals(metric: {
  name: string;
  value: number;
  id: string;
}) {
  navigator.sendBeacon(
    "/api/vitals",
    JSON.stringify({
      name: metric.name,
      value: metric.value,
      id: metric.id
    })
  );
}
```

---

## QUIZ

1. **Multiple choice:** Qual é a primeira etapa de otimização madura?
2. **Short answer:** Quando `React.memo` ajuda de verdade?
3. **Code review:** Um componente importa biblioteca pesada no layout global para uso raro. O que fazer?
4. **Prediction:** Uma imagem sem dimensões pode afetar qual Web Vital?
5. **Debugging:** O Profiler mostra uma lista inteira renderizando a cada tecla. Quais hipóteses investigar?

---

## EXERCÍCIO PRÁTICO

Profile uma aplicação de lições, identifique um gargalo e otimize.

Passos: grave interação no React DevTools Profiler; anote componente mais caro; explique por que renderiza; aplique uma otimização; rode Lighthouse; compare antes/depois; documente trade-off.

## RESUMO

Performance é ciclo: medir, entender, otimizar e validar. Re-render não é automaticamente bug. Memoização deve ter alvo. Imagens precisam de dimensões e prioridade correta. Bundle analysis revela peso real. Web Vitals e monitoramento fecham o ciclo em produção.
