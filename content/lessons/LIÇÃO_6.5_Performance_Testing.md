# LIÇÃO 6.5: Performance Testing - Medindo o Que Importa

**Duração:** 200 minutos (3h 20min)  
**Nível:** Avançado  
**Foco:** Performance profiling, benchmarking, carga e otimização  
**Público-alvo:** Engenheiros que precisam garantir aplicação rápida e escalável

---

## ÍNDICE
1. [Métricas que Importam](#seção-1-métricas-que-importam-25-min)
2. [Profiling em Node.js](#seção-2-profiling-em-nodejs-35-min)
3. [Benchmarking Código](#seção-3-benchmarking-código-35-min)
4. [Load Testing e k6](#seção-4-load-testing-e-k6-35-min)
5. [Lighthouse e Web Performance](#seção-5-lighthouse-e-web-performance-30-min)
6. [Análise e Otimização](#seção-6-análise-e-otimização-20-min)
7. [Quiz & Exercício Prático](#quiz--exercício-prático)

---

## Seção 1: Métricas que Importam (25 min)

### Latência vs. Throughput

```
┌─────────────────────────────────────────────┐
│ Request Timeline                            │
├─────────────────────────────────────────────┤
│ [Start] → [Proc] → [Finish]                 │
│    ├─────────────┤ = Latência (50ms)        │
│                                              │
│ Throughput: quantos requests/segundo?      │
│ = 20 requests/sec (se cada leva 50ms)      │
└─────────────────────────────────────────────┘
```

**Regra:** Baixa latência ≠ Alta throughput

```typescript
// Exemplo: API de lição
async function getLesson(lessonId: string) {
  // Latência: 200ms
  // Throughput: 5 req/sec em 1 CPU
  
  const lesson = await db.findById(lessonId); // 80ms
  const quiz = await db.findQuiz(lessonId);   // 60ms
  const progress = await db.getProgress();    // 40ms
  const cache = await redis.set(key, data);   // 20ms
  
  return { lesson, quiz, progress };
}
```

### Percentis (P99 é mais importante que média)

```
Tempo de resposta (100 requisições):
Mínimo:    10ms
P50 (50%): 50ms    ← Mediana
P95 (95%): 150ms   ← 95% das requisições são mais rápidas
P99 (99%): 500ms   ← 1% das requisições demoram >500ms
Máximo:    2000ms

Média:     100ms   ← Enganosa! Pode esconder P99 ruim
```

**Por quê P99 importa:**
- Usuário "sortudo": 50ms (ótimo)
- Usuário "azarado": 500ms (péssimo)
- Ambos contam como 1 usuário feliz/infeliz

### Web Vitals (o que usuários sentem)

```typescript
// Métricas que o usuário realmente sente:

// 1. LCP (Largest Contentful Paint): Quando conteúdo principal aparece
LCP: 2.5 segundos (alvo)
└─ Bom: < 2.5s
└─ Precisa melhorar: 2.5-4s
└─ Ruim: > 4s

// 2. FID (First Input Delay): Tempo entre interação e resposta
FID: 100ms (alvo)
└─ Bom: < 100ms
└─ Precisa melhorar: 100-300ms
└─ Ruim: > 300ms

// 3. CLS (Cumulative Layout Shift): Quanto página se mexe
CLS: 0.1 (alvo, escala 0-1)
└─ Bom: < 0.1
└─ Precisa melhorar: 0.1-0.25
└─ Ruim: > 0.25
```

---

## Seção 2: Profiling em Node.js (35 min)

### Usando Node.js Built-in Profiler

```bash
# Registra profile
node --prof app.js

# Depois:
node --prof-process isolate-*.log > profile.txt
cat profile.txt
```

### Usando Clinic.js (Recomendado)

```bash
npm install -D clinicjs

# Flame graph
clinic flame -- node app.js

# Doctor (detecta problemas)
clinic doctor -- node app.js

# Bubbleprof (mostra delays)
clinic bubbleprof -- node app.js
```

### Exemplo: Profiling de Serviço

```typescript
// src/services/lesson.service.ts
import { performance } from "perf_hooks";

export class LessonService {
  async getLessonWithProgress(
    lessonId: string,
    studentId: string
  ) {
    const start = performance.now();
    
    try {
      // Mede cada operação
      const lessonStart = performance.now();
      const lesson = await this.lessonRepo.findById(lessonId);
      const lessonDuration = performance.now() - lessonStart;
      console.log(`[PROFILE] Lesson fetch: ${lessonDuration.toFixed(2)}ms`);
      
      const quizStart = performance.now();
      const quiz = await this.quizRepo.findByLesson(lessonId);
      const quizDuration = performance.now() - quizStart;
      console.log(`[PROFILE] Quiz fetch: ${quizDuration.toFixed(2)}ms`);
      
      const progressStart = performance.now();
      const progress = await this.progressRepo.getStudentProgress(studentId);
      const progressDuration = performance.now() - progressStart;
      console.log(`[PROFILE] Progress fetch: ${progressDuration.toFixed(2)}ms`);
      
      const total = performance.now() - start;
      console.log(`[PROFILE] Total time: ${total.toFixed(2)}ms`);
      
      return { lesson, quiz, progress };
    } catch (error) {
      console.error("Erro ao buscar lição:", error);
      throw error;
    }
  }
}

// Output esperado:
// [PROFILE] Lesson fetch: 45.12ms
// [PROFILE] Quiz fetch: 52.34ms
// [PROFILE] Progress fetch: 38.92ms
// [PROFILE] Total time: 136.38ms
```

### Análise com Chrome DevTools

```typescript
// Para analisar código Node em tempo real:

// 1. Inicia com debugger
// node --inspect app.js

// 2. Abre em Chrome:
// chrome://inspect

// 3. Ativa profiler
// Performance → Record → Execute código → Stop

// 4. Analisa flame graph
```

### Memory Profiling

```typescript
// Detecta memory leaks
const memUsage = process.memoryUsage();
console.log({
  rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
  heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
  heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
  external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
});

// Output esperado:
// {
//   rss: '120MB',           ← Resident Set Size (total)
//   heapTotal: '45MB',      ← Memória alocada
//   heapUsed: '32MB',       ← Memória em uso
//   external: '2MB'         ← Buffer externo
// }

// Rodar periodicamente:
setInterval(() => {
  const mem = process.memoryUsage().heapUsed / 1024 / 1024;
  console.log(`Heap used: ${mem.toFixed(2)}MB`);
}, 5000);
```

---

## Seção 3: Benchmarking Código (35 min)

### Benchmark.js

```typescript
// npm install -D benchmark

import Benchmark from "benchmark";

const suite = new Benchmark.Suite("Lesson Progress");

suite
  .add("Calculate progress - Simple", function() {
    const completed = 5;
    const total = 10;
    return (completed / total) * 100;
  })
  .add("Calculate progress - Object", function() {
    const progress = {
      completed: [1, 2, 3, 4, 5],
      total: 10
    };
    return (progress.completed.length / progress.total) * 100;
  })
  .add("Calculate progress - With cache", function() {
    const cache = new Map();
    const key = "lesson-progress-student-1";
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = 50;
    cache.set(key, result);
    return result;
  })
  .on("complete", function() {
    console.log("Fastest is " + this.filter("fastest").map("name"));
  })
  .run({ async: true });

// Output esperado:
// Fastest is Calculate progress - Simple
// 
// Lesson Progress
// Calculate progress - Simple
//   x 1,000,000 ops/sec
// Calculate progress - Object
//   x 950,000 ops/sec (5% slower)
// Calculate progress - With cache
//   x 1,100,000 ops/sec (10% faster)
```

### Exemplo Real: Otimizando Cálculo

```typescript
// ❌ ANTES: Array.filter em cada chamada
export function getPassedQuizzes(studentId: string): Quiz[] {
  const quizzes = database.query(
    `SELECT * FROM quizzes WHERE student_id = ${studentId}`
  );
  
  // O(n) - itera toda vez
  return quizzes.filter(q => q.score >= 70);
}

// Benchmark resultado:
// 10,000 students: 234ms

// ✅ DEPOIS: Cachear resultado
export class QuizCache {
  private cache = new Map<string, Quiz[]>();
  
  getPassedQuizzes(studentId: string): Quiz[] {
    const cached = this.cache.get(studentId);
    if (cached) return cached;
    
    const quizzes = database.query(
      `SELECT * FROM quizzes WHERE student_id = ${studentId}`
    );
    
    const passed = quizzes.filter(q => q.score >= 70);
    this.cache.set(studentId, passed);
    
    return passed;
  }
  
  invalidate(studentId: string) {
    this.cache.delete(studentId);
  }
}

// Benchmark resultado:
// 10,000 students: 45ms (5x faster!)
// Primeira chamada: 23ms
// Chamadas subsequentes: < 0.1ms
```

### Test: Declarativo vs. Imperativo

```typescript
// ❌ LENTO: Imperativo
function findBestLesson(student: Student, courses: Course[]) {
  let bestLesson = null;
  let maxProgress = 0;
  
  for (let i = 0; i < courses.length; i++) {
    const course = courses[i];
    
    for (let j = 0; j < course.lessons.length; j++) {
      const lesson = course.lessons[j];
      const progress = calculateProgress(student.id, lesson.id);
      
      if (progress > maxProgress) {
        maxProgress = progress;
        bestLesson = lesson;
      }
    }
  }
  
  return bestLesson;
}

// ✅ RÁPIDO: Declarativo
function findBestLesson(student: Student, courses: Course[]) {
  return courses
    .flatMap(course => course.lessons)
    .map(lesson => ({
      lesson,
      progress: calculateProgress(student.id, lesson.id)
    }))
    .sort((a, b) => b.progress - a.progress)[0]
    ?.lesson ?? null;
}

// Benchmark:
// Imperativo com 1000 cursos * 100 lições: 2.3ms
// Declarativo: 2.1ms
// Diferença: 10% - mas código mais legível!
```

---

## Seção 4: Load Testing com k6 (35 min)

### Instalação e Setup

```bash
npm install -D k6
```

### Teste de Carga Básico

```typescript
// e2e-load/lesson-load.ts
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "30s", target: 20 },   // Ramp up para 20 users
    { duration: "1m30s", target: 20 }, // Mantém 20 users
    { duration: "30s", target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ["p(99)<400", "p(95)<200"],
    http_req_failed: ["rate<0.1"],
  },
};

export default function() {
  // VU (Virtual User) executa isso em loop
  
  const lessonId = __VU % 100; // Distribui load entre 100 lições
  
  const res = http.get(
    `http://localhost:3000/api/lessons/${lessonId}`,
    {
      headers: { "Content-Type": "application/json" }
    }
  );
  
  check(res, {
    "status is 200": (r) => r.status === 200,
    "response time < 200ms": (r) => r.timings.duration < 200,
    "body contains lesson title": (r) => r.body.includes("title")
  });
  
  sleep(1); // Espera 1 segundo entre requests
}

// Rodar: k6 run e2e-load/lesson-load.ts
```

### Teste Realista com Autenticação

```typescript
// e2e-load/realistic-flow.ts
import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = "http://localhost:3000";
let authToken = "";

export const options = {
  stages: [
    { duration: "10s", target: 50 },
    { duration: "30s", target: 50 },
    { duration: "10s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(99)<500"],
    http_req_failed: ["rate<0.05"],
  },
};

function login() {
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, {
    email: `user${__VU}@test.com`,
    password: "password123"
  });
  
  check(loginRes, {
    "login successful": (r) => r.status === 200,
  });
  
  authToken = loginRes.json("token");
}

function accessLesson() {
  const lessonId = Math.floor(Math.random() * 10) + 1;
  
  const lessonRes = http.get(
    `${BASE_URL}/api/lessons/${lessonId}`,
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
      }
    }
  );
  
  check(lessonRes, {
    "lesson loaded": (r) => r.status === 200,
    "lesson duration < 100ms": (r) => r.timings.duration < 100,
  });
  
  sleep(2);
}

function completeQuiz() {
  const quizRes = http.post(
    `${BASE_URL}/api/quiz/submit`,
    {
      questionId: "q1",
      answer: "A",
    },
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
      }
    }
  );
  
  check(quizRes, {
    "quiz submitted": (r) => r.status === 200,
  });
  
  sleep(1);
}

export default function() {
  // Simula fluxo real do usuário
  login();
  sleep(1);
  
  accessLesson();
  completeQuiz();
  
  accessLesson();
  completeQuiz();
}
```

### Análise de Resultados

```
k6 output:

     ✓ checks........................: 99.2% ✓ 495 ✗ 4
     
     http_reqs......................: 500 in 50s

     duration [p(95)]: 180ms
     duration [p(99)]: 380ms  ← Atende threshold de 500ms? ✓
     
     received_bytes.................: 250KB
     sent_bytes......................: 150KB
     
     iteration_duration.............: avg=4.2s
     
     check_failure_rate..............: 0.8% (aceitável)
```

---

## Seção 5: Lighthouse e Web Performance (30 min)

### Lighthouse Automated

```typescript
// npm install -D lighthouse

import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";

async function runLighthouse(url: string) {
  let chrome = await chromeLauncher.launch({ chromeFlags: ["--headless"] });
  
  const options = {
    logLevel: "info",
    output: "json",
    port: chrome.port,
  };
  
  const runnerResult = await lighthouse(url, options);
  
  // Análise de resultados
  const scores = runnerResult.lhr.categories;
  
  console.log("Performance Score:", scores.performance.score * 100);
  console.log("Accessibility Score:", scores.accessibility.score * 100);
  console.log("Best Practices Score:", scores["best-practices"].score * 100);
  console.log("SEO Score:", scores.seo.score * 100);
  
  // Audits específicas
  const audits = runnerResult.lhr.audits;
  
  console.log("\nLargest Contentful Paint:");
  console.log(audits["largest-contentful-paint"].displayValue);
  
  console.log("\nFirst Input Delay:");
  console.log(audits["first-input-delay-v3"].displayValue);
  
  await chromeLauncher.kill(chrome.pid);
}

runLighthouse("http://localhost:3000");
```

### Lighthouse em CI/CD

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse

on: [push]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      
      - run: npm install
      - run: npm run build
      
      - uses: treosh/lighthouse-ci-action@v10
        with:
          configPath: "./lighthouse.json"
          temporaryPublicStorage: true
```

### Lighthouse Config (lighthouse.json)

```json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:3000/lessons/1"],
      "numberOfRuns": 3
    },
    "upload": {
      "target": "temporary-public-storage"
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.9}],
        "categories:accessibility": ["error", {"minScore": 0.95}],
        "categories:best-practices": ["error", {"minScore": 0.90}]
      }
    }
  }
}
```

---

## Seção 6: Análise e Otimização (20 min)

### Exemplo Real: Otimizando Plataforma Educacional

```
ANTES (P99: 800ms):
├─ API GET /lessons (200ms)
│  └─ DB query com 3 joins
├─ API GET /quiz (150ms)
│  └─ DB query N+1
├─ API GET /progress (250ms)
│  └─ Calcula de novo cada vez
└─ Frontend render (200ms)

PROBLEMA IDENTIFICADO:
- N+1 query em quiz (1 query + N queries por questão)
- Nenhuma cache de progress
- Joins ineficientes em lições
```

**Otimizações:**

```typescript
// 1. Batch queries (resolve N+1)
// ANTES
for (const quizId of quizIds) {
  const questions = await db.query(
    `SELECT * FROM questions WHERE quiz_id = ${quizId}`
  ); // N queries!
}

// DEPOIS
const questions = await db.query(
  `SELECT * FROM questions WHERE quiz_id = ANY($1)`,
  [quizIds] // 1 query!
);

// 2. Usar índices
CREATE INDEX idx_quiz_student_score 
ON quiz_attempts(student_id, quiz_id, score);

// 3. Cache com TTL
async function getStudentProgress(studentId: string) {
  const cached = await redis.get(`progress:${studentId}`);
  if (cached) return JSON.parse(cached);
  
  const progress = calculateProgress(studentId);
  await redis.setex(`progress:${studentId}`, 300, JSON.stringify(progress));
  
  return progress;
}

// Invalidar cache quando necessário:
async function completeLesson(studentId: string, lessonId: string) {
  // ... complete lesson logic ...
  await redis.del(`progress:${studentId}`); // Cache bust
}

// 4. Lazy load
// ANTES: Carrega quiz completo
const quiz = await getQuiz(quizId);
const full = { ...quiz, questions: quiz.questions };

// DEPOIS: Carrega só quando necessário
const quiz = await getQuiz(quizId);
const questions = await getQuestions(quizId); // Só se necessário
```

**Resultado esperado:**
```
DEPOIS (P99: 180ms):
├─ API GET /lessons (50ms) ← 4x mais rápido
├─ API GET /quiz (40ms)    ← 3.75x mais rápido
├─ API GET /progress (10ms) ← 25x mais rápido (cache)
└─ Frontend render (80ms)   ← 2.5x mais rápido (menos dados)

Melhoria total: 80% redução em latência
```

---

## Quiz & Exercício Prático

### Questão 1: Percentis
Por que P99 é mais importante que média?

**Resposta:** Média esconde outliers. Se 99% dos usuários têm 50ms, mas 1% tem 2s, média pode ser 70ms (bom), mas 1% dos usuários sofrem.

---

### Questão 2: Caching
Quando NÃO usar cache?

a) Dados que mudam frequentemente  
b) Dados read-heavy, write-rarely  
c) Dados que precisam ser sempre atualizados  
d) a) e c)  

**Resposta:** d) - Cache é bom para read-heavy, ruim para dados voláteis

---

### Questão 3: Load Testing
O que esta carga testa?

```
stages: [
  { duration: "30s", target: 100 },
  { duration: "5m", target: 100 },
  { duration: "30s", target: 0 }
]
```

**Resposta:** Ramp-up (encontra limite), plateau (comportamento sob carga), ramp-down (recuperação). Não testa picos (spike test).

---

### Questão 4: Lighthouse
Score de Performance é 0.60. O que fazer?

a) Tudo está bem  
b) Otimizar CSS e JavaScript  
c) Adicionar mais servidores  
d) Ignorar, não importa  

**Resposta:** b) - Performance score mede eficiência frontend/backend, não capacidade de servidor

---

### Questão 5: Cenário Real
API leva 300ms em média, mas P99 é 1.5s. O quê fazer?

**Resposta:**
- Investigar o que causa 1.5s (95% dos cases)
- Validar se é timeout de banco, I/O ou CPU
- Adicionar timeout/circuit breaker
- Cache para queries lentas
- Index banco de dados

---

### Exercício Prático: Performance Analysis e Otimização

**Objetivo:** Perfil, benchmark e otimizar serviço

**Código com Problemas:**

```typescript
// src/services/course-analysis.service.ts
export class CourseAnalysisService {
  constructor(private db: Database) {}
  
  // Operação lenta
  async getTopStudents(courseId: string, limit: number = 10) {
    // N+1: pega course, depois cada enrollment
    const course = await this.db.query(
      `SELECT * FROM courses WHERE id = $1`,
      [courseId]
    );
    
    const enrollments = await this.db.query(
      `SELECT * FROM enrollments WHERE course_id = $1`,
      [courseId]
    );
    
    // Para cada enrollment, busca progresso (N queries!)
    const withProgress = await Promise.all(
      enrollments.map(async (e) => ({
        ...e,
        progress: await this.db.query(
          `SELECT * FROM progress WHERE student_id = $1`,
          [e.student_id]
        )
      }))
    );
    
    // Ordena na memória (não usa índice)
    return withProgress
      .sort((a, b) => b.progress[0].percentage - a.progress[0].percentage)
      .slice(0, limit);
  }
}
```

**Seu Desafio:**

1. ✅ Perfilar para encontrar gargalos (use performance.now())
2. ✅ Benchmark operação ANTES (tempo base)
3. ✅ Otimizar:
   - Resolver N+1 query
   - Adicionar índice no banco
   - Caching se apropriado
4. ✅ Benchmark operação DEPOIS (comparar)
5. ✅ Validar que resultado é igual

**Estrutura Esperada:**

```typescript
// __tests__/performance/course-analysis.perf.ts
describe("CourseAnalysisService Performance", () => {
  test("benchmark before optimization", async () => {
    const service = new CourseAnalysisService(db);
    
    const start = performance.now();
    const students = await service.getTopStudents("course-1", 10);
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(5000); // Baseline
    expect(students).toHaveLength(10);
  });
  
  test("getTopStudents is optimized", async () => {
    // Seu teste com versão otimizada
  });
});

// e2e-load/course-analysis-load.ts
// k6 load test para 50 usuários simultâneos
```

**Dicas:**
- Use `EXPLAIN` no PostgreSQL para ver query plan
- `EXPLAIN ANALYZE` mostra tempo real
- Batch queries com `IN` ou `ANY`
- Índice em colunas de filtro (WHERE, ORDER BY)

---

**Tempo Total:** 200 minutos  
**Próxima Lição:** 6.6 - CI/CD Pipeline & Deployment Testing
