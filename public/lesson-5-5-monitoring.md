# LIÇÃO 5.5: Monitoring - Observabilidade em Produção

## SEÇÃO 1: INTRODUÇÃO (6 minutos)

### O Problema Real

Seu sistema funciona normalmente. Depois, em um domingo às 22h, um aluno tenta acessar a plataforma e recebe erro 502. Você quer saber:

- Quanto tempo leva para perceber?
- Qual é o impacto exato?
- Por que falhou?
- Quanto tempo durou?

Sem monitoring, você descobre quando o aluno reclamou (15 minutos depois). Com monitoring, você sabe em 10 segundos e já está investigando.

### Por Que Monitoring É Arquitetura

Monitoring não é vaidoso. É:
- **Manutenção:** Identificar degradação antes que usuários percebam
- **Debugging:** Logs + métricas + traces = entender exatamente o que aconteceu
- **Capacidade:** Saber quando adicionar servidores
- **SLOs:** Garantir que você está cumprindo com seus promessas (99.9% uptime)

### Objetivo da Lição

Nesta aula, você vai entender:
- Three Pillars: logs, métricas, traces (3 níveis de observabilidade)
- Alerting: quando acordar on-call
- SLOs: definir e medir confiabilidade
- Exemplo real: dashboard de saúde da plataforma

---

## SEÇÃO 2: THREE PILLARS (14 minutos)

### Pilar 1: Logs (O Que Aconteceu)

Logs são histórico textual de eventos.

```typescript
// ✅ BOM LOG
logger.info('Exercise submitted', {
  userId: 'user123',
  exerciseId: 'ex45',
  duration: 150,
  timestamp: new Date().toISOString()
});

// ❌ RUIM LOG
console.log('ok'); // Vago, sem contexto

// ❌ RUIM LOG
logger.info(`User ${userId} submitted exercise ${exerciseId} in ${duration}ms`);
// Informação em string, não estruturada, difícil de filtrar
```

**Structured Logging:**

```typescript
class StructuredLogger {
  info(event: string, data: Record<string, any>) {
    console.log(JSON.stringify({
      level: 'INFO',
      event,
      ...data,
      timestamp: new Date().toISOString()
    }));
  }
}

// Uso
logger.info('lesson-completed', {
  userId: 'user123',
  lessonId: 'lesson1',
  completionTime: 1200,
  score: 95
});

// Searchable em ELK/Datadog:
// "userId:user123 AND event:lesson-completed"
```

**Log Levels:**
- ERROR: algo quebrou (falha do usuário)
- WARN: algo estranho (degradação)
- INFO: mudança significativa (evento importante)
- DEBUG: informação de debug (off em prod)

### Pilar 2: Métricas (As Tendências)

Métricas são números agregados: latência, throughput, erros/minuto.

```typescript
class MetricsCollector {
  recordLatency(operation: string, durationMs: number) {
    // Registra latência em histogram
    this.histogram(`operation.latency`, durationMs, {
      operation,
      status: 'success'
    });
  }
  
  recordError(operation: string, errorType: string) {
    // Conta erros
    this.counter(`operation.errors`, 1, {
      operation,
      errorType
    });
  }
  
  setGauge(name: string, value: number) {
    // Estado atual (ex: conexões abertas)
    this.gauge(`connections.active`, value);
  }
}

// Uso
const start = Date.now();
try {
  const result = await gradeExercise(answer);
  metrics.recordLatency('grading', Date.now() - start);
} catch (error) {
  metrics.recordError('grading', error.constructor.name);
}
```

**Tipos de Métrica:**
- Counter: incrementa (requisições totais)
- Gauge: valor atual (conexões ativas)
- Histogram: distribuição (latência em ms)
- Summary: percentis (p50, p95, p99)

### Pilar 3: Traces (O Caminho)

Trace segue uma requisição através de múltiplos serviços.

```
Requisição ID: trace-123

[API] POST /exercise/submit → (50ms)
  ├─ [DB] INSERT response → (20ms)
  ├─ [Queue] Enqueue grading → (5ms)
  └─ [Cache] Invalidate progress → (25ms)

[Worker] Process grading → (1200ms)
  ├─ [AI] Generate feedback → (1000ms)
  ├─ [DB] Insert feedback → (150ms)
  └─ [PubSub] Publish notification → (50ms)

[WebSocket] Notify client → (10ms)
```

```typescript
class DistributedTrace {
  // Começa trace
  startTrace(traceId: string, spanName: string) {
    return { traceId, spanId: crypto.randomUUID(), start: Date.now() };
  }
  
  // Cria sub-span
  startChildSpan(parentSpan: Span, name: string) {
    return { traceId: parentSpan.traceId, spanId: crypto.randomUUID(), start: Date.now() };
  }
  
  // Registra
  endSpan(span: Span, status: 'ok' | 'error') {
    const duration = Date.now() - span.start;
    this.send({
      traceId: span.traceId,
      spanId: span.spanId,
      name: span.name,
      duration,
      status
    });
  }
}

// Uso
const trace = tracer.startTrace('trace-123', 'submitExercise');

const dbSpan = tracer.startChildSpan(trace, 'db-insert');
await db.insertResponse(answer);
tracer.endSpan(dbSpan, 'ok');

const queueSpan = tracer.startChildSpan(trace, 'queue-enqueue');
await queue.enqueue('grade', data);
tracer.endSpan(queueSpan, 'ok');
```

---

## SEÇÃO 3: ALERTING (8 minutos)

### Quando Acordar On-Call

Não alerte por tudo. Alerte por:
- **Erros crescentes** (5% → 50% em 5 minutos)
- **Latência degradando** (p99 50ms → 500ms)
- **Quota atingida** (80% capacidade)
- **Falha crítica** (autenticação down)

```typescript
class AlertingRules {
  // ✅ BOM: Dispara quando P95 latência > 500ms
  if (metrics.latency.p95 > 500) {
    alert.critical('High latency detected');
  }
  
  // ❌ RUIM: Dispara se qualquer requisição > 100ms
  if (metrics.latency.max > 100) {
    alert.critical('Slow request'); // Muito barulho
  }
  
  // ✅ BOM: 5+ erros por minuto
  const errorRate = metrics.errors.perMinute;
  if (errorRate >= 5) {
    alert.error('High error rate', { rate: errorRate });
  }
  
  // ✅ BOM: Redis down (critical path)
  if (redis.isDown) {
    alert.critical('Redis unreachable');
  }
  
  // ⚠️ INFO: Apenas log, não alerta
  if (metrics.cacheHitRate < 50) {
    logger.warn('Low cache hit rate', { rate: metrics.cacheHitRate });
  }
}
```

### Escalation

```
Alert dispara
    ↓
Engenheiro on-call é notificado (SMS/Slack)
    ↓
(5 minutos) Sem confirmação? Escala para lead
    ↓
(15 minutos) Sem confirmação? Pager todo o time
```

---

## SEÇÃO 4: SLOs E CONFIABILIDADE (10 minutos)

### SLO (Service Level Objective)

Promessa: "99.9% de uptime = máximo 8.64 horas de downtime por mês"

```typescript
class SLOCalculator {
  // SLI: Service Level Indicator (métrica real)
  calculateUptime(period: 'day' | 'month'): number {
    const totalTime = period === 'day' ? 86400 : 2592000; // segundos
    const downtime = this.getDowntimeSeconds(period);
    const uptime = (totalTime - downtime) / totalTime;
    return uptime * 100; // percentual
  }
  
  // Rastrear error rate
  calculateErrorRate(period: 'minute' | 'hour'): number {
    const totalRequests = this.getRequestCount(period);
    const failedRequests = this.getFailedCount(period);
    return (failedRequests / totalRequests) * 100;
  }
  
  // Latência
  calculateLatencySLI(period: 'minute'): boolean {
    // SLO: 95% de requisições < 200ms
    const p95 = this.getLatencyPercentile(period, 95);
    return p95 < 200;
  }
}

// SLO Budgeting: se 99.9% é seu SLO, você tem 0.1% de "erro budget"
// Em um mês de 2.6M requisições, seu erro budget é ~2600 requisições
// Gastar tudo = bate o SLO exatamente

// Dashboard
interface SLODashboard {
  slo_target: '99.9%', // promessa
  sli_actual: '99.87%', // realidade
  error_budget_used: '87%', // quanto do allowed downtime foi gasto
  error_budget_remaining: '0.013%' // quanto sobra
}
```

---

## SEÇÃO 5: IMPLEMENTAÇÃO COMPLETA (12 minutos)

```typescript
// Arquivo: monitoring/observability-setup.ts
import * as OpenTelemetry from '@opentelemetry/api';
import { NodeTracerProvider } from '@opentelemetry/node';
import PrometheusExporter from '@opentelemetry/exporter-prometheus';
import winston from 'winston';

// Structured Logging
const logger = winston.createLogger({
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Metrics
const prometheusExporter = new PrometheusExporter();
const meter = opentelemetry.metrics.getMeterProvider().getMeter('app');

const latencyHistogram = meter.createHistogram('http.request.duration_ms', {
  description: 'HTTP request latency'
});

const errorCounter = meter.createCounter('http.errors.total', {
  description: 'Total HTTP errors'
});

// Tracing
const tracerProvider = new NodeTracerProvider();
const tracer = tracerProvider.getTracer('app');

// Middleware que instrumenta todas as requisições
app.use((req, res, next) => {
  const span = tracer.startSpan(`${req.method} ${req.path}`);
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Registra métrica
    latencyHistogram.record(duration, { method: req.method, path: req.path });
    
    if (res.statusCode >= 400) {
      errorCounter.add(1, { status: res.statusCode });
    }
    
    // Log estruturado
    logger.info('http.request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration,
      traceId: span.spanContext().traceId
    });
    
    span.end();
  });
  
  next();
});

// Dashboard: Grafana queries
const queries = {
  uptime: 'rate(http.requests.total[5m])', // requests/sec
  errorRate: '(rate(http.errors.total[5m]) / rate(http.requests.total[5m])) * 100',
  p95Latency: 'histogram_quantile(0.95, http.request.duration_ms)',
  activeConnections: 'websocket.connections.active'
};

// Alerting Rules
const alertingRules = [
  {
    name: 'HighErrorRate',
    condition: 'errorRate > 5',
    duration: '5m',
    action: 'notify on-call'
  },
  {
    name: 'HighLatency',
    condition: 'p95Latency > 500',
    duration: '10m',
    action: 'notify team'
  },
  {
    name: 'CriticalServiceDown',
    condition: 'redis.up == 0',
    duration: '1m',
    action: 'escalate to lead'
  }
];
```

---

## Resumo

Observabilidade é a diferença entre "sabemos que quebrou" e "a gente sabe POR QUE quebrou em 10 segundos."

Three Pillars: Logs (o que), Métricas (tendências), Traces (caminho).  
Alerting: dispara quando importa.  
SLOs: promessas mensuráveis.

Sem monitoring, você está dirigindo no escuro. Com monitoring, você vê tudo.

---

### Pontos-Chave

1. **Logs estruturados** — JSON, não strings, searchable
2. **Métricas agregadas** — histogramas, percentis, não valores únicos
3. **Traces distribuídos** — follow requisição entre serviços
4. **Alerting sensato** — alerte por anomalia, não por limiar
5. **SLOs** — promessas mensuráveis, error budgets
