# LIÇÃO 3.5: Logging & Error Handling - Visibilidade que Salva Vidas

## SEÇÃO 1: INTRODUÇÃO (5 minutos)

### O Problema Real

É 3 da manhã. Seu CEO recebe uma mensagem: "API está lenta". Você acorda, conecta no servidor e... vazio. Sem logs. Sem informação. Você começa a chutar: "É database? Memória? CPU?" Demora 2 horas pra descobrir que alguém fez uma query que entra em loop infinito. Nesse tempo, 10 mil usuários viram erro 500.

Cenário 2: Um aluno não consegue enviar sua resposta. Você olha o endpoint e está retornando erro genérico `Error`. Não há informação sobre o que deu errado. É validação? Banco? API externa? Você passa 30 minutos debugando sem informação.

Logging não é "nice to have". É a diferença entre 30 minutos pra resolver um bug e 30 horas.

### Por Que Importa

- ✅ Diagnostica problemas rápido.
- ✅ Encontra padrões (qual endpoint falha mais? Por quê?).
- ✅ Monitora saúde da API.
- ✅ Audita ações (quem fez o quê).
- ✅ Comunica erros aos usuários (em vez de "erro genérico").

### Objetivo da Lição

Nesta aula, você vai aprender:

- Estratégia de logging (o que logar, quanto logar, onde logar).
- Levels de logging (debug, info, warn, error).
- Structured logging (JSON, não strings vagas).
- Error handling prático (tratamento, propagação, comunicação).
- Monitoramento e alertas.

---

## SEÇÃO 2: LOGGING: ESTRATÉGIA (20 minutos)

### O Que NÃO Fazer

```typescript
// ❌ Sem logs
app.post('/api/submit-answer', async (req, res) => {
  const result = await processAnswer(req.body);
  res.json(result);
});

// Alguém reporta erro? Você: "Qual erro? Quando?" Sem informação.

// ❌ Logs demais / sem estrutura
app.post('/api/submit-answer', async (req, res) => {
  console.log('got request');
  console.log('body:', JSON.stringify(req.body)); // Pode expor dados sensíveis
  console.log('processing...');
  
  const result = await processAnswer(req.body);
  
  console.log('done');
  console.log('result:', result);
  res.json(result);
});

// Em produção: 1000 requisições = 5000 linhas de log. Impossível debugar.
```

### O Que Fazer: Structured Logging

```typescript
// ✅ Structured logging com nível apropriado
interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  service: string;
  context: Record<string, any>;
  message: string;
}

const logger = {
  debug: (message: string, context?: any) => {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'debug',
      service: 'api',
      context,
      message
    }));
  },
  
  info: (message: string, context?: any) => {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      service: 'api',
      context,
      message
    }));
  },
  
  warn: (message: string, context?: any) => {
    console.warn(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'warn',
      service: 'api',
      context,
      message
    }));
  },
  
  error: (message: string, error: Error, context?: any) => {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'error',
      service: 'api',
      context,
      message,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    }));
  }
};

// Uso
app.post('/api/submit-answer', async (req, res) => {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  
  try {
    // Info: Requisição chegou
    logger.info('submit_answer_started', {
      requestId,
      studentId: req.user.userId
    });

    const result = await processAnswer(req.body);

    // Info: Sucesso
    logger.info('submit_answer_completed', {
      requestId,
      studentId: req.user.userId,
      durationMs: Date.now() - startTime
    });

    res.json(result);
  } catch (err) {
    // Error: Falha
    logger.error('submit_answer_failed', err, {
      requestId,
      studentId: req.user.userId,
      durationMs: Date.now() - startTime
    });

    res.status(500).json({ error: 'Failed to process answer' });
  }
});
```

### Levels de Logging

| Level | Quando? | Volume |
|-------|---------|--------|
| **DEBUG** | Informação pra dev debugar localmente | Alto |
| **INFO** | Eventos importantes (requisição, sucesso) | Médio |
| **WARN** | Algo incomum mas não fatal | Baixo |
| **ERROR** | Algo falhou | Muito baixo |

```typescript
// Debug: Apenas em desenvolvimento
logger.debug('parsing JSON body', { body: req.body });
// → Enabled: process.env.LOG_LEVEL === 'debug'

// Info: Eventos importantes
logger.info('lesson_completed', { studentId, lessonId, timeSpent });
// → Sempre (em produção)

// Warn: Possível problema
logger.warn('slow_query_detected', { query, durationMs: 2000 });
// → Sempre (monitor deveria alertar)

// Error: Falha
logger.error('database_connection_failed', err, { host, port });
// → Sempre (crítico)
```

---

## SEÇÃO 3: STRUCTURED LOGGING COM WINSTON (15 minutos)

```typescript
// Arquivo: examples/winston-logging.ts

import winston from 'winston';

// Cria logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'api', environment: process.env.NODE_ENV },
  transports: [
    // Escreve erro em arquivo
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    // Escreve tudo em arquivo
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Em desenvolvimento, também mostra no console
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Middleware que loga requisições
app.use((req, res, next) => {
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  req.id = requestId;

  const startTime = Date.now();

  // Intercepta response.json e response.status
  const originalJson = res.json.bind(res);
  res.json = function(data) {
    logger.info('request_completed', {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: Date.now() - startTime
    });
    return originalJson(data);
  };

  next();
});

// Uso em handler
app.post('/api/submit-answer', async (req, res, next) => {
  try {
    logger.debug('processing_answer', {
      requestId: req.id,
      exerciseId: req.body.exerciseId
    });

    const result = await processAnswer(req.body);

    logger.info('answer_processed', {
      requestId: req.id,
      exerciseId: req.body.exerciseId,
      passed: result.passed
    });

    res.json(result);
  } catch (err) {
    logger.error('answer_processing_failed', {
      requestId: req.id,
      error: err.message,
      exerciseId: req.body.exerciseId
    });

    next(err);
  }
});
```

---

## SEÇÃO 4: ERROR HANDLING PROFISSIONAL (20 minutos)

### Arquitetura de Erros

```typescript
// Arquivo: src/errors/index.ts

export class AppError extends Error {
  constructor(
    public statusCode: number = 500,
    public message: string = 'Internal Server Error',
    public isOperational: boolean = true // vs programming error
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Invalid credentials') {
    super(401, message);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(403, message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} not found`);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message);
  }
}

export class InternalError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(500, message, true);
  }
}
```

### Global Error Handler

```typescript
// Arquivo: src/middleware/error-handler.ts

import { logger } from '../logger';
import { AppError } from '../errors';

export function globalErrorHandler(
  err: Error,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  // Log erro
  if (err instanceof AppError && err.isOperational) {
    // Erro esperado
    logger.warn('operational_error', {
      requestId: req.id,
      status: err.statusCode,
      message: err.message
    });
  } else {
    // Erro inesperado (bug)
    logger.error('unexpected_error', {
      requestId: req.id,
      error: err.message,
      stack: err.stack
    });
  }

  // Retorna erro ao cliente
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      statusCode: err.statusCode,
      requestId: req.id
    });
  }

  // Erro não esperado: não expõe detalhes
  res.status(500).json({
    error: 'Internal server error',
    statusCode: 500,
    requestId: req.id
  });
}

// Registra no Express (deve ser por ÚLTIMO)
app.use(globalErrorHandler);
```

### Usando Erros

```typescript
// Arquivo: src/services/lesson.service.ts

import { ValidationError, NotFoundError, ConflictError } from '../errors';

export async function createLesson(data: { title: string; content: string }) {
  // Validação
  if (data.title.length < 5) {
    throw new ValidationError('Title must be at least 5 characters');
  }

  // Verificar se já existe
  const existing = await db.query(
    'SELECT id FROM lessons WHERE title = $1',
    [data.title]
  );

  if (existing.rows.length > 0) {
    throw new ConflictError('A lesson with this title already exists');
  }

  // Criar
  return await db.query(
    'INSERT INTO lessons (title, content) VALUES ($1, $2) RETURNING *',
    [data.title, data.content]
  );
}

// Arquivo: src/controllers/lessons.controller.ts

export async function createLesson(req, res, next) {
  try {
    const lesson = await lessonService.createLesson(req.body);
    res.status(201).json(lesson);
  } catch (err) {
    // Error middleware cuida de tudo
    next(err);
  }
}
```

---

## SEÇÃO 5: MONITORAMENTO (10 minutos)

### Métricas Importantes

```typescript
// Arquivo: examples/monitoring.ts

import prometheus from 'prom-client';

// Criar métricas
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'path', 'status']
});

const errorCount = new prometheus.Counter({
  name: 'errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'path']
});

// Middleware que registra
app.use((req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    httpRequestDuration
      .labels(req.method, req.path, res.statusCode)
      .observe(duration);

    if (res.statusCode >= 400) {
      errorCount
        .labels(res.statusCode.toString(), req.path)
        .inc();
    }
  });

  next();
});

// Endpoint que Prometheus scrapes
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', prometheus.register.contentType);
  res.end(await prometheus.register.metrics());
});
```

### Alertas

```typescript
# prometheus.yml (Prometheus config)
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'api'
    static_configs:
      - targets: ['localhost:3000']

rule_files:
  - '/etc/prometheus/alerts.yml'

# alerts.yml
groups:
  - name: api
    rules:
      - alert: HighErrorRate
        expr: rate(errors_total[5m]) > 0.05
        for: 5m
        annotations:
          summary: "High error rate (> 5%)"
          
      - alert: SlowRequests
        expr: histogram_quantile(0.95, http_request_duration_seconds_bucket) > 1
        for: 5m
        annotations:
          summary: "95th percentile response time > 1s"
```

---

## QUIZ: 5 Perguntas

### Pergunta 1: Structured Logging

**Por que JSON é melhor que strings de texto?**

A) Porque é mais rápido.  
B) Porque é parseable (máquinas entendem).  
C) Porque é mais bonito.  
D) Porque toma menos espaço.

**Resposta Correta:** B

---

### Pergunta 2: Log Levels

**Qual é o nível apropriado para logar sucesso de requisição?**

A) DEBUG  
B) INFO  
C) WARN  
D) ERROR

**Resposta Correta:** B

---

### Pergunta 3: Error Handling

**Por que retornar diferentes status codes é importante?**

A) Porque cliente consegue reagir diferente (400 vs 401 vs 500).  
B) Porque melhora performance.  
C) Porque é obrigatório.  
D) Porque reduz tamanho da resposta.

**Resposta Correta:** A

---

### Pergunta 4: RequestId

**Por que adicionar RequestId em cada requisição?**

A) Porque reduz latência.  
B) Porque permite rastrear uma requisição através de logs.  
C) Porque aumenta segurança.  
D) Porque é obrigatório.

**Resposta Correta:** B

---

### Pergunta 5: Monitoramento

**Qual métrica é mais importante para alertas?**

A) Número de requisições totais.  
B) Taxa de erro (erros por segundo).  
C) Percentil de latência (p95, p99).  
D) Ambas B e C.

**Resposta Correta:** D

---

## EXERCÍCIO PRÁTICO: Implemente Logging Completo

### Desafio

Você tem uma API sem logging. Implemente:

1. **Logger estruturado** (JSON, níveis apropriados).
2. **Error handling** (classes de erro, global handler).
3. **Request tracking** (requestId em logs).
4. **Monitoramento** (duração, status code).

### Gabarito

```typescript
// src/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'api' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

```typescript
// src/errors/index.ts
export class AppError extends Error {
  constructor(
    public statusCode: number = 500,
    public message: string = 'Internal Server Error'
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} not found`);
  }
}
```

```typescript
// src/middleware/error-handler.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors';
import { logger } from '../logger';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const requestId = (req as any).id;

  if (err instanceof AppError) {
    logger.warn('operational_error', {
      requestId,
      statusCode: err.statusCode,
      message: err.message
    });

    return res.status(err.statusCode).json({
      error: err.message,
      statusCode: err.statusCode,
      requestId
    });
  }

  logger.error('unexpected_error', {
    requestId,
    message: err.message,
    stack: err.stack
  });

  res.status(500).json({
    error: 'Internal server error',
    requestId
  });
}
```

```typescript
// src/middleware/request-logger.ts
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logger } from '../logger';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const requestId = crypto.randomUUID();
  (req as any).id = requestId;

  const startTime = Date.now();

  const originalJson = res.json.bind(res);
  res.json = function(data) {
    const duration = Date.now() - startTime;

    logger.info('request_completed', {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: duration
    });

    return originalJson(data);
  };

  next();
}
```

```typescript
// src/app.ts
import express from 'express';
import { requestLogger } from './middleware/request-logger';
import { errorHandler } from './middleware/error-handler';
import routes from './routes';

const app = express();

app.use(express.json());
app.use(requestLogger);
app.use('/api', routes);
app.use(errorHandler); // Deve ser por último

export default app;
```

**Resultado:**
- ✅ Todos os requests são logados.
- ✅ RequestId rastreia requisição completa.
- ✅ Erros retornam status codes apropriados.
- ✅ Logs estruturados (JSON) pra análise.

