# LIÇÃO 3.2: Express & REST API Fundamentals - Construindo APIs Profissionais

## SEÇÃO 1: INTRODUÇÃO (5 minutos)

### O Problema Real

Express é o framework mais popular do Node.js para APIs. Você começou com exemplos triviais: GET `/users`, POST `/users`, DELETE `/users/:id`. Funcionou. Depois cresceu. Agora tem 30 endpoints em um único arquivo `server.js`. Lógica de validação, autenticação, logs e tratamento de erro estão misturados. Um novo desenvolvedor tenta adicionar um endpoint e quebra 3 outros acidentalmente. Você quer refatorar, mas não sabe por onde começar.

Express é flexível demais. Dá a você uma `app.get()` e deixa você fazer o que quiser. Isso é força e fraqueza. Força porque é flexível. Fraqueza porque sem estrutura, APIs crescem caóticas.

### Por Que Estrutura Importa

Uma API é um contrato entre frontend e backend. Muda o contrato, quebra o frontend. Muda a lógica de validação, o backend fica inseguro. Muda um endpoint, quebra a documentação. Uma API bem estruturada:

- ✅ Escala com novos endpoints sem caos.
- ✅ Permite que novos devs entendam a estrutura rapidamente.
- ✅ Separa responsabilidades (roteamento, validação, lógica, persistência).
- ✅ Facilita testes.
- ✅ Facilita documentação.

### Objetivo da Lição

Nesta aula, você vai aprender:

- Estrutura profissional de APIs Express.
- Roteamento escalável (não tudo em um arquivo).
- Middleware de forma correta.
- Padrão request-response-error.
- Como Express funciona internamente (importante!).
- Exemplos em contexto: API de plataforma educacional.

---

## SEÇÃO 2: COMO EXPRESS FUNCIONA (15 minutos)

### O Loop Interno do Express

Express é simples: é um gerenciador de middleware e roteamento. Quando você faz `app.use()` ou `app.get()`, está registrando funções que vão executar em sequência:

```javascript
// Simplificação do que Express faz
app.middlewares = [];
app.routes = [];

// Quando chama app.use(middlewareFunc)
app.use = (fn) => app.middlewares.push(fn);

// Quando chama app.get('/path', handlerFunc)
app.get = (path, handler) => app.routes.push({ method: 'GET', path, handler });

// Quando chega uma requisição
app.onRequest = async (req, res) => {
  // 1. Executa middleware em sequência
  for (const middleware of app.middlewares) {
    await middleware(req, res, next);
    // Se middleware chamar res.send() ou res.json(),
    // a cadeia para aqui
  }

  // 2. Tenta encontrar rota que bate com path e method
  const route = app.routes.find(r => r.method === req.method && r.path === req.path);
  if (route) {
    await route.handler(req, res);
  } else {
    res.status(404).send('Not found');
  }
};
```

Middleware é tudo em Express. É uma função que pode processar a requisição, modificar `req` ou `res`, ou chamar `next()` para continuar a cadeia.

### Anatomia de um Request em Express

```typescript
// Arquivo: examples/request-lifecycle.ts

import express from 'express';

const app = express();

// MIDDLEWARE GLOBAL 1
app.use((req, res, next) => {
  console.log('1. Middleware global - início');
  req.startTime = Date.now();
  next(); // Passa para próximo middleware
});

// MIDDLEWARE GLOBAL 2 (parsing)
app.use(express.json());

// MIDDLEWARE DE ROTA (apenas para /api/lessons)
app.use('/api/lessons', (req, res, next) => {
  console.log('2. Middleware de rota - apenas /api/lessons');
  next();
});

// ROTA
app.post('/api/lessons/:id/submit', (req, res) => {
  console.log('3. Handler da rota');
  const duration = Date.now() - req.startTime;
  res.json({ duration, message: 'Resposta recebida' });
});

// MIDDLEWARE DE ERROR (deve vir por ÚLTIMO)
app.use((err, req, res, next) => {
  console.log('4. Error middleware (se erro ocorrer)');
  res.status(500).json({ error: err.message });
});

app.listen(3000);
```

**Ordem de execução:**

1. Middleware global 1 (sempre).
2. JSON parser middleware (sempre).
3. Middleware de rota `/api/lessons` (apenas se rota começar com /api/lessons).
4. Handler da rota.
5. Error middleware (se algum erro ocorrer).

### Middleware: Conceito Crítico

Middleware é uma função que recebe `(req, res, next)`:

```typescript
// Forma tradicional
app.use((req, res, next) => {
  // Faz algo com req
  req.userId = extractUserId(req.headers);
  
  // Se tudo ok, continua
  next();
  
  // Ou se erro:
  // next(new Error('Unauthorized'));
});

// Forma com tipos TypeScript
interface RequestWithUser extends express.Request {
  userId?: string;
}

const extractUserMiddleware = (
  req: RequestWithUser,
  res: express.Response,
  next: express.NextFunction
) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    req.userId = decodeToken(token);
  }
  next();
};

app.use(extractUserMiddleware);
```

A cadeia para se:
- Você chamar `res.send()`, `res.json()`, `res.redirect()`, etc. (responde).
- Você chamar `next(error)` (salta para error middleware).
- Você não chamar `next()` (fica pendurado).

---

## SEÇÃO 3: ARQUITETURA ESCALÁVEL COM EXPRESS (25 minutos)

### A Estrutura Anti-Pattern

```
projeto/
├── server.js          ❌ ~1000 linhas, tudo aqui
└── package.json
```

Todos os endpoints, middleware, lógica, conexão com banco - tudo no `server.js`. Inevitável caos.

### A Estrutura Profissional

```
projeto/
├── src/
│   ├── routes/
│   │   ├── lessons.routes.ts      ← Rotas de lessons
│   │   ├── students.routes.ts     ← Rotas de students
│   │   ├── exercises.routes.ts    ← Rotas de exercises
│   │   └── index.ts               ← Agrupa todas as rotas
│   ├── controllers/
│   │   ├── lessons.controller.ts  ← Lógica de lessons
│   │   ├── students.controller.ts ← Lógica de students
│   │   └── exercises.controller.ts ← Lógica de exercises
│   ├── services/
│   │   ├── lesson.service.ts      ← Regras de negócio
│   │   └── student.service.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts     ← Autenticação
│   │   ├── validation.middleware.ts ← Validação
│   │   ├── error.middleware.ts    ← Erro handling
│   │   └── logging.middleware.ts  ← Logging
│   ├── repositories/
│   │   ├── lesson.repository.ts   ← Acesso ao banco
│   │   └── student.repository.ts
│   ├── app.ts                     ← Criação do app
│   └── server.ts                  ← Inicialização
├── tests/
└── package.json
```

### Implementação Passo a Passo

#### 1. Criar a Aplicação Base

```typescript
// Arquivo: src/app.ts

import express from 'express';
import routes from './routes';
import errorMiddleware from './middleware/error.middleware';
import loggingMiddleware from './middleware/logging.middleware';

export function createApp(): express.Application {
  const app = express();

  // Middleware global
  app.use(express.json());
  app.use(loggingMiddleware);

  // Rotas
  app.use('/api', routes);

  // Error middleware (deve vir por ÚLTIMO)
  app.use(errorMiddleware);

  return app;
}
```

#### 2. Definir Rotas de Forma Escalável

```typescript
// Arquivo: src/routes/lessons.routes.ts

import { Router } from 'express';
import * as lessonsController from '../controllers/lessons.controller';
import { validateRequestBody } from '../middleware/validation.middleware';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// GET /api/lessons - Lista todas as lições
router.get('/', lessonsController.listLessons);

// GET /api/lessons/:id - Detalhes de uma lição
router.get('/:id', lessonsController.getLessonById);

// POST /api/lessons - Criar lição (requer auth)
router.post(
  '/',
  authMiddleware,
  validateRequestBody({
    title: { type: 'string', required: true },
    content: { type: 'string', required: true }
  }),
  lessonsController.createLesson
);

// PUT /api/lessons/:id - Atualizar lição
router.put(
  '/:id',
  authMiddleware,
  validateRequestBody({
    title: { type: 'string' },
    content: { type: 'string' }
  }),
  lessonsController.updateLesson
);

// DELETE /api/lessons/:id - Deletar lição
router.delete('/:id', authMiddleware, lessonsController.deleteLesson);

export default router;
```

```typescript
// Arquivo: src/routes/index.ts

import { Router } from 'express';
import lessonsRouter from './lessons.routes';
import studentsRouter from './students.routes';
import exercisesRouter from './exercises.routes';

const router = Router();

router.use('/lessons', lessonsRouter);
router.use('/students', studentsRouter);
router.use('/exercises', exercisesRouter);

export default router;
```

#### 3. Controllers Concentram Lógica de Request/Response

```typescript
// Arquivo: src/controllers/lessons.controller.ts

import { Request, Response, NextFunction } from 'express';
import * as lessonService from '../services/lesson.service';
import { NotFoundError, ValidationError } from '../errors';

export async function listLessons(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const lessons = await lessonService.getAllLessons();
    res.json({ data: lessons, count: lessons.length });
  } catch (err) {
    next(err);
  }
}

export async function getLessonById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;

    // Validação
    if (!id) {
      throw new ValidationError('ID é obrigatório');
    }

    // Busca no service
    const lesson = await lessonService.getLessonById(id);

    if (!lesson) {
      throw new NotFoundError(`Lição ${id} não encontrada`);
    }

    res.json({ data: lesson });
  } catch (err) {
    next(err);
  }
}

export async function createLesson(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { title, content } = req.body;

    // Validação (já feita pelo middleware, mas redundância é ok)
    if (!title || !content) {
      throw new ValidationError('Title e content são obrigatórios');
    }

    // Cria
    const lesson = await lessonService.createLesson({ title, content });

    // Responde com status 201 (Created)
    res.status(201).json({ data: lesson });
  } catch (err) {
    next(err);
  }
}

export async function updateLesson(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const updates = req.body;

    const lesson = await lessonService.updateLesson(id, updates);
    res.json({ data: lesson });
  } catch (err) {
    next(err);
  }
}

export async function deleteLesson(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    await lessonService.deleteLesson(id);

    // Responde com 204 (No Content) pois não há body
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
```

#### 4. Services Concentram Regras de Negócio

```typescript
// Arquivo: src/services/lesson.service.ts

import { lessonRepository } from '../repositories/lesson.repository';
import { cacheService } from './cache.service';
import { ValidationError, NotFoundError } from '../errors';

export async function getAllLessons() {
  // Tenta cache primeiro
  const cached = await cacheService.get('lessons:all');
  if (cached) return cached;

  // Se não há cache, busca do banco
  const lessons = await lessonRepository.findAll();

  // Armazena em cache por 1 hora
  await cacheService.set('lessons:all', lessons, 3600);

  return lessons;
}

export async function getLessonById(id: string) {
  // Validação de negócio
  if (id.length !== 36) { // UUID length
    throw new ValidationError('ID inválido');
  }

  return await lessonRepository.findById(id);
}

export async function createLesson(data: { title: string; content: string }) {
  // Validações de negócio
  if (data.title.length < 5) {
    throw new ValidationError('Título deve ter pelo menos 5 caracteres');
  }

  if (data.content.length < 50) {
    throw new ValidationError('Conteúdo deve ter pelo menos 50 caracteres');
  }

  const lesson = await lessonRepository.create(data);

  // Invalida cache (porque adicionou uma lição nova)
  await cacheService.delete('lessons:all');

  return lesson;
}

export async function updateLesson(id: string, updates: Partial<Lesson>) {
  const existing = await lessonRepository.findById(id);
  if (!existing) {
    throw new NotFoundError(`Lição ${id} não existe`);
  }

  const updated = await lessonRepository.update(id, updates);

  // Invalida cache
  await cacheService.delete('lessons:all');
  await cacheService.delete(`lesson:${id}`);

  return updated;
}

export async function deleteLesson(id: string) {
  const lesson = await lessonRepository.findById(id);
  if (!lesson) {
    throw new NotFoundError(`Lição ${id} não existe`);
  }

  await lessonRepository.delete(id);

  // Invalida cache
  await cacheService.delete('lessons:all');
  await cacheService.delete(`lesson:${id}`);
}
```

#### 5. Inicializar a Aplicação

```typescript
// Arquivo: src/server.ts

import { createApp } from './app';

const app = createApp();
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
```

---

## SEÇÃO 4: PADRÕES E ARMADILHAS COMUNS (20 minutos)

### Armadilha 1: Middleware na Ordem Errada

```typescript
// ❌ ERRADO - Error middleware não vem por último
app.use(errorMiddleware);
app.use(express.json());
app.get('/api/data', handler);

// ✅ CORRETO - Error middleware por último
app.use(express.json());
app.get('/api/data', handler);
app.use(errorMiddleware);
```

Error middleware só funciona se registrado por último. Express procura por middleware com assinatura `(err, req, res, next)`.

### Armadilha 2: Não Chamar `next()` ou `res.send()`

```typescript
// ❌ PENDURADO - Requisição nunca completa
app.get('/api/data', (req, res) => {
  const data = await fetchData();
  // Esqueceu res.json() ou next()
});

// ✅ CORRETO
app.get('/api/data', (req, res) => {
  const data = await fetchData();
  res.json(data);
});
```

### Armadilha 3: Lógica no Route Handler

```typescript
// ❌ MISTURADO
app.post('/api/lessons', async (req, res) => {
  // Validação
  if (!req.body.title) return res.status(400).json({ error: 'Title required' });
  
  // Negócio
  const lesson = new Lesson(req.body.title, req.body.content);
  const saved = await db.lessons.save(lesson);
  
  // Persistência
  res.json(saved);
});

// ✅ SEPARADO
// Validação → Middleware
// Negócio → Service
// Persistência → Repository
// Handler → Orquestra
app.post('/api/lessons', validateLessonBody, async (req, res, next) => {
  try {
    const lesson = await lessonService.create(req.body);
    res.status(201).json(lesson);
  } catch (err) {
    next(err);
  }
});
```

### Padrão Correto: Resultado vs Erro

```typescript
// Arquivo: src/types.ts

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; statusCode: number };

export class ApiError extends Error {
  constructor(
    public statusCode: number = 500,
    public message: string = 'Internal Server Error'
  ) {
    super(message);
  }
}
```

```typescript
// Arquivo: src/middleware/error.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../types';

export default function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: message,
    statusCode
  });
}
```

---

## SEÇÃO 5: RESUMO E CHECKLIST (10 minutos)

Uma API Express bem estruturada:

- ✅ Separa rotas, controllers, services, repositories.
- ✅ Usa middleware para concerns transversais (auth, logging, validation).
- ✅ Sempre chama `next(err)` em error handlers.
- ✅ Valida entrada no middleware.
- ✅ Trata erros no error middleware global.
- ✅ Não bloqueia a thread (usa async/await).

---

## QUIZ: 5 Perguntas para Consolidar

### Pergunta 1: Ordem do Middleware

**Qual é a ordem correta de middleware em uma aplicação Express?**

A) Global → Routes → Error  
B) Error → Global → Routes  
C) Routes → Global → Error  
D) Não importa a ordem

**Resposta Correta:** A  
**Explicação:** Middleware global executa para todas as rotas. Error middleware deve vir por último para capturar erros.

---

### Pergunta 2: Responsabilidade do Controller

**O que um controller deve fazer?**

A) Validar entrada, implementar lógica de negócio, persistir dados.  
B) Orquestrar chamadas para service e responder ao cliente.  
C) Gerenciar banco de dados.  
D) Gerenciar autenticação.

**Resposta Correta:** B  
**Explicação:** Controller é a ponte entre HTTP e service. Validação vai para middleware, lógica para service, persistência para repository.

---

### Pergunta 3: Error Handling

**Por que é importante chamar `next(err)` em handlers?**

A) Porque Express fica mais rápido.  
B) Porque a requisição é completada automaticamente.  
C) Porque o erro é capturado pelo error middleware global.  
D) Porque não afeta nada.

**Resposta Correta:** C  
**Explicação:** Chamar `next(err)` salta a cadeia de middleware normal e vai direto para o error middleware.

---

### Pergunta 4: Arquitetura de Pastas

**Qual é a vantagem de separar routes, controllers e services?**

A) Menos código.  
B) Cada camada tem responsabilidade clara e é testável.  
C) API fica mais lenta.  
D) Nenhuma, é só estética.

**Resposta Correta:** B  
**Explicação:** Separação permite testar lógica de negócio sem HTTP, e mudar HTTP sem afetar lógica.

---

### Pergunta 5: Middleware de Validação

**Para qual camada vai a validação de entrada?**

A) Controller  
B) Service  
C) Middleware  
D) Repository

**Resposta Correta:** C  
**Explicação:** Validação é concern transversal. Middleware é o lugar certo para rejeitar requisições inválidas antes do handler.

---

## EXERCÍCIO PRÁTICO: Refatore uma API Desorganizada

### Desafio

Você recebeu uma API Express com tudo em um arquivo (antipadrão):

```typescript
// ❌ server.js com 500+ linhas
import express from 'express';

const app = express();
app.use(express.json());

// Validação inline
app.post('/api/students', (req, res) => {
  if (!req.body.name) return res.status(400).send('Name required');
  if (!req.body.email) return res.status(400).send('Email required');
  
  // Lógica de negócio inline
  const email = req.body.email.toLowerCase();
  const student = {
    id: Math.random().toString(),
    name: req.body.name,
    email,
    enrolledAt: new Date(),
    completedLessons: []
  };
  
  // Persistência inline
  db.run(`INSERT INTO students (id, name, email) VALUES (?, ?, ?)`,
    [student.id, student.name, student.email],
    (err) => {
      if (err) return res.status(500).send('Database error');
      res.json(student);
    }
  );
});

app.get('/api/students/:id', (req, res) => {
  const id = req.params.id;
  
  db.get(`SELECT * FROM students WHERE id = ?`, [id], (err, row) => {
    if (err) return res.status(500).send('Database error');
    if (!row) return res.status(404).send('Not found');
    res.json(row);
  });
});

// ... 400 linhas mais de handlers
```

### Sua Missão

Refatore aplicando:

1. **Estrutura de pastas** (routes, controllers, services, repositories).
2. **Middleware de validação**.
3. **Error handling global**.
4. **Async/await** (não callbacks).
5. **Separação de responsabilidades**.

### Gabarito (Estrutura)

```typescript
// src/app.ts
import express from 'express';
import studentRoutes from './routes/students.routes';
import errorMiddleware from './middleware/error.middleware';

export function createApp() {
  const app = express();
  
  app.use(express.json());
  app.use('/api', studentRoutes);
  app.use(errorMiddleware);
  
  return app;
}
```

```typescript
// src/routes/students.routes.ts
import { Router } from 'express';
import * as studentsController from '../controllers/students.controller';
import { validateStudentBody } from '../middleware/validation.middleware';

const router = Router();

router.post('/students', validateStudentBody, studentsController.createStudent);
router.get('/students/:id', studentsController.getStudentById);

export default router;
```

```typescript
// src/controllers/students.controller.ts
import { Request, Response, NextFunction } from 'express';
import * as studentService from '../services/student.service';

export async function createStudent(req: Request, res: Response, next: NextFunction) {
  try {
    const student = await studentService.createStudent(req.body);
    res.status(201).json(student);
  } catch (err) {
    next(err);
  }
}

export async function getStudentById(req: Request, res: Response, next: NextFunction) {
  try {
    const student = await studentService.getStudentById(req.params.id);
    res.json(student);
  } catch (err) {
    next(err);
  }
}
```

```typescript
// src/services/student.service.ts
import { studentRepository } from '../repositories/student.repository';
import { NotFoundError, ValidationError } from '../errors';

export async function createStudent(data: { name: string; email: string }) {
  // Validação de negócio
  if (data.name.length < 3) {
    throw new ValidationError('Name must be at least 3 characters');
  }
  
  return await studentRepository.create({
    ...data,
    email: data.email.toLowerCase(),
    enrolledAt: new Date()
  });
}

export async function getStudentById(id: string) {
  const student = await studentRepository.findById(id);
  if (!student) {
    throw new NotFoundError(`Student ${id} not found`);
  }
  return student;
}
```

```typescript
// src/repositories/student.repository.ts
import { db } from '../db';

export const studentRepository = {
  create: async (data: any) => {
    return new Promise((resolve, reject) => {
      db.run(`INSERT INTO students (id, name, email, enrolledAt) VALUES (?, ?, ?, ?)`,
        [data.id || Math.random().toString(), data.name, data.email, data.enrolledAt],
        (err) => {
          if (err) reject(err);
          resolve(data);
        }
      );
    });
  },
  
  findById: async (id: string) => {
    return new Promise((resolve, reject) => {
      db.get(`SELECT * FROM students WHERE id = ?`, [id], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
  }
};
```

```typescript
// src/middleware/validation.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../errors';

export function validateStudentBody(req: Request, res: Response, next: NextFunction) {
  const { name, email } = req.body;
  
  if (!name || typeof name !== 'string') {
    throw new ValidationError('Name is required and must be a string');
  }
  
  if (!email || !email.includes('@')) {
    throw new ValidationError('Valid email is required');
  }
  
  next();
}
```

```typescript
// src/middleware/error.middleware.ts
import { Request, Response, NextFunction } from 'express';

export default function errorMiddleware(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({ error: message });
}
```

**Melhorias:**
- ✅ Código modular e testável.
- ✅ Validação centralizada.
- ✅ Erro handling global.
- ✅ Fácil adicionar novos endpoints.

