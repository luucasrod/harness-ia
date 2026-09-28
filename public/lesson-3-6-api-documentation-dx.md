# LIÇÃO 3.6: API Documentation & DX - Sua API é Tão Boa Quanto Sua Documentação

## SEÇÃO 1: INTRODUÇÃO (5 minutos)

### O Problema Real

Um frontend developer recebe o link da sua API. Sem documentação. Ele lê o código fonte pra tentar entender. Depois faz request errado e recebe erro genérico. Passa 2 horas pra descobrir que precisava enviar `X-User-Id` como header. Seu código está perfeito, mas ninguém consegue usar.

Documentação boa faz sua API parecer 10x melhor. Documentação ruim faz a melhor API parecer horrível. A diferença entre "dev consegue integrar em 5 minutos" e "dev passa horas com suporte" é documentação.

### Por Que Importa

- ✅ Frontend consegue integrar sozinho (sem ficar pedindo ajuda).
- ✅ Menos bugs (desenvolvedor entende o contrato).
- ✅ Código é auto-documentado (alguém lê docs, não código).
- ✅ DX (Developer Experience) aumenta satisfação.
- ✅ Onboarding novo dev é 10x mais rápido.

### Objetivo da Lição

Nesta aula, você vai aprender:

- OpenAPI/Swagger: padrão profissional pra documentação.
- Documentação automática vs manual.
- Boas práticas de DX (Developer Experience).
- Exemplos reais, não abstratos.

---

## SEÇÃO 2: OPENAPI & SWAGGER (20 minutos)

### O Padrão OpenAPI

OpenAPI é um padrão pra descrever APIs REST em formato JSON/YAML. Uma ferramenta (Swagger UI) renderiza isso como documentação interativa.

### Documentação Manual com Swagger Decorators

```typescript
// Arquivo: examples/swagger-decorators.ts

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Educational Platform API',
      version: '1.0.0',
      description: 'API for managing lessons and student submissions'
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://api.educacional.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/routes/*.ts'] // Procura decoradores nos arquivos
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
```

```typescript
// Arquivo: src/routes/lessons.routes.ts

/**
 * @openapi
 * /api/lessons:
 *   get:
 *     summary: List all lessons
 *     description: Retrieve a paginated list of all lessons
 *     tags:
 *       - Lessons
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of lessons per page
 *     responses:
 *       200:
 *         description: Successful retrieval of lessons
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Lesson'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *       500:
 *         description: Server error
 */
router.get('/lessons', listLessons);

/**
 * @openapi
 * /api/lessons:
 *   post:
 *     summary: Create a lesson
 *     description: Create a new lesson (requires teacher role)
 *     tags:
 *       - Lessons
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Introduction to Node.js"
 *               content:
 *                 type: string
 *                 example: "Node.js is a runtime..."
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["nodejs", "async"]
 *     responses:
 *       201:
 *         description: Lesson created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Lesson'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions (must be teacher)
 */
router.post('/lessons', authMiddleware, requireRole(['teacher']), createLesson);

/**
 * @openapi
 * /api/lessons/{id}:
 *   get:
 *     summary: Get a lesson by ID
 *     description: Retrieve details of a specific lesson
 *     tags:
 *       - Lessons
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Lesson ID
 *     responses:
 *       200:
 *         description: Lesson found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Lesson'
 *       404:
 *         description: Lesson not found
 */
router.get('/lessons/:id', getLessonById);

/**
 * @openapi
 * components:
 *   schemas:
 *     Lesson:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         title:
 *           type: string
 *         content:
 *           type: string
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
```

### Documentação Automática com TypeScript

```typescript
// Arquivo: examples/auto-documentation.ts

import { z } from 'zod';
import { generateOpenApi } from 'ts-rest/open-api';

// Define schemas
const LessonSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(5).max(200),
  content: z.string().min(50),
  createdAt: z.date()
});

const CreateLessonSchema = LessonSchema.omit({ id: true, createdAt: true });

// Define rotas com tipos
const lessonRoutes = {
  listLessons: {
    method: 'GET',
    path: '/lessons',
    responses: {
      200: z.array(LessonSchema)
    }
  },
  createLesson: {
    method: 'POST',
    path: '/lessons',
    body: CreateLessonSchema,
    responses: {
      201: LessonSchema,
      400: z.object({ error: z.string() }),
      401: z.object({ error: z.string() })
    }
  },
  getLesson: {
    method: 'GET',
    path: '/lessons/:id',
    responses: {
      200: LessonSchema,
      404: z.object({ error: z.string() })
    }
  }
};

// Gera OpenAPI spec automaticamente
const spec = generateOpenApi(lessonRoutes, {
  title: 'Educational Platform API',
  version: '1.0.0'
});

// Agora Swagger UI usa esse spec
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spec));
```

---

## SEÇÃO 3: BOAS PRÁTICAS DE DOCUMENTAÇÃO (15 minutos)

### Regra 1: Documentação Próxima ao Código

```typescript
// ❌ Documentação em arquivo separado (fica fora de sync)
// docs/api.md
// POST /api/students - Cria um aluno
// Body: { name, email, age }

// Mas no código mudou:
app.post('/api/students', (req, res) => {
  // Agora requer courseId também
  const student = { ...req.body, courseId: req.query.courseId };
  // Documentação não foi atualizada!
});

// ✅ Documentação próxima ao código
/**
 * Cria um novo aluno.
 * 
 * @param {Object} body
 * @param {string} body.name - Nome do aluno (obrigatório)
 * @param {string} body.email - Email único (obrigatório)
 * @param {number} body.age - Idade (obrigatório)
 * @param {string} query.courseId - ID do curso (obrigatório via query)
 * 
 * @returns {201} Aluno criado
 * @returns {400} Validação falhou
 */
app.post('/api/students', (req, res) => {
  const student = { ...req.body, courseId: req.query.courseId };
  res.json(student);
});
```

### Regra 2: Exemplos Reais

```typescript
// ❌ Exemplo vago
/**
 * @param data - The lesson data
 * @returns {object} - The created lesson
 */
async function createLesson(data) { }

// ✅ Exemplo concreto
/**
 * Cria uma lição.
 * 
 * Exemplo de request:
 * ```json
 * {
 *   "title": "Introduction to Async/Await",
 *   "content": "Learn how to use async/await in JavaScript",
 *   "duration": 45,
 *   "tags": ["javascript", "async"]
 * }
 * ```
 * 
 * Exemplo de response (201):
 * ```json
 * {
 *   "id": "550e8400-e29b-41d4-a716-446655440000",
 *   "title": "Introduction to Async/Await",
 *   "content": "Learn how to use async/await in JavaScript",
 *   "duration": 45,
 *   "tags": ["javascript", "async"],
 *   "createdAt": "2024-01-15T10:30:00Z"
 * }
 * ```
 */
async function createLesson(data: CreateLessonInput): Promise<Lesson> { }
```

### Regra 3: Documentar Erros

```typescript
/**
 * Submete uma resposta de aluno.
 * 
 * @returns {200} Resposta processada
 * @returns {400} Campo obrigatório faltando
 *   - error: "studentId is required"
 * @returns {401} Não autenticado
 * @returns {404} Exercício não encontrado
 * @returns {500} Erro ao processar resposta
 */
app.post('/api/submit', (req, res) => { }
```

### Regra 4: Versionamento da API

```typescript
// ✅ URLs com versão
app.use('/api/v1/lessons', lessonsV1Router);
app.use('/api/v2/lessons', lessonsV2Router);

// Ou headers
app.get('/api/lessons', (req, res) => {
  const version = req.headers['api-version'] || '1';
  
  if (version === '2') {
    // Novo formato
    res.json({ data: lessons, pagination: {...} });
  } else {
    // Formato legado
    res.json(lessons);
  }
});
```

---

## SEÇÃO 4: DEVELOPER EXPERIENCE (DX) (10 minutos)

### Dicas de DX

1. **Consistent Error Format**

```typescript
// ✅ Sempre retorna mesmo formato
{
  "error": "Lesson not found",
  "statusCode": 404,
  "requestId": "550e8400-e29b-41d4",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

2. **Clear Status Codes**

| Code | Significado |
|------|-------------|
| 200 | OK |
| 201 | Created |
| 204 | No Content |
| 400 | Validation Error |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 500 | Server Error |

3. **Pagination Padrão**

```typescript
// ✅ Paginação consistente
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 250,
    "totalPages": 25
  }
}
```

4. **Rate Limiting Headers**

```typescript
// ✅ Comunica ao cliente quando vai resetar
res.setHeader('X-RateLimit-Limit', '100');
res.setHeader('X-RateLimit-Remaining', '42');
res.setHeader('X-RateLimit-Reset', '1705318800');
```

5. **Changelog**

```
# API Changelog

## v2.0.0 (2024-01-15)
- **BREAKING:** Removido endpoint DELETE /api/lessons/{id}/exercises (use PATCH com empty exercises array)
- **NEW:** Suporte a tags em lições
- **IMPROVED:** Paginação agora retorna totalPages

## v1.5.0 (2024-01-10)
- **DEPRECATED:** GET /api/lessons/{id}/stats (use GET /api/lessons/{id} com ?include=stats)
- **NEW:** Endpoint POST /api/lessons/{id}/duplicate

## v1.4.0 (2024-01-05)
- Bug fix: Corrigido rate limiting não funcionar com IPv6
```

---

## SEÇÃO 5: EXEMPLO COMPLETO (10 minutos)

```typescript
// Arquivo: src/app.ts

import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger';
import lessonsRouter from './routes/lessons.routes';
import { errorHandler } from './middleware/error-handler';

const app = express();

app.use(express.json());

// Documentação interativa
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Changelog
app.get('/api/changelog', (req, res) => {
  const changelog = `
# API Changelog

## v1.0.0
- Initial release
`;
  res.type('text/markdown').send(changelog);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.use('/api', lessonsRouter);
app.use(errorHandler);

export default app;
```

```typescript
// Arquivo: README.md (root)

# Educational Platform API

## Quick Start

```bash
# Obter documentação interativa
curl http://localhost:3000/api-docs

# Listar lições
curl http://localhost:3000/api/lessons

# Criar lição (requer autenticação)
curl -X POST http://localhost:3000/api/lessons \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Node.js Basics", "content": "..."}'
```

## Authentication

Use JWT no header Authorization:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Rate Limiting

100 requisições por minuto. Verifique headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 42
X-RateLimit-Reset: 1705318800
```

## Error Format

Todos os erros retornam:

```json
{
  "error": "Descrição do erro",
  "statusCode": 400,
  "requestId": "550e8400-e29b"
}
```

## Documentação

- [OpenAPI Spec](http://localhost:3000/api-docs)
- [Changelog](/api/changelog)
- [Health Check](/api/health)
```

---

## QUIZ: 5 Perguntas

### Pergunta 1: OpenAPI

**O que OpenAPI faz?**

A) Faz API rodar mais rápido.  
B) Descreve o contrato da API (endpoints, params, responses).  
C) Criptografa a API.  
D) Monitora uso.

**Resposta Correta:** B

---

### Pergunta 2: Documentação Próxima ao Código

**Por que documentação deve estar próxima ao código?**

A) Porque fica mais legível.  
B) Porque fica sincronizado (quando código muda, dev lê doc nova).  
C) Porque ocupa menos espaço.  
D) Porque é mais rápido escrever.

**Resposta Correta:** B

---

### Pergunta 3: Status Code

**Qual é o status correto para "recurso não encontrado"?**

A) 400  
B) 401  
C) 404  
D) 500

**Resposta Correta:** C

---

### Pergunta 4: Error Format

**Por que padronizar formato de erro é importante?**

A) Porque fica mais bonito.  
B) Porque frontend consegue processar consistentemente.  
C) Porque usa menos bytes.  
D) Porque é mais seguro.

**Resposta Correta:** B

---

### Pergunta 5: Rate Limiting Header

**Por que informar ao cliente quando o rate limit reseta?**

A) Porque é obrigatório.  
B) Porque frontend consegue fazer retry inteligente.  
C) Porque reduz carga.  
D) Porque é mais rápido.

**Resposta Correta:** B

---

## EXERCÍCIO PRÁTICO: Documente uma API

### Desafio

Você tem uma API sem documentação:

```typescript
app.post('/api/submit-answer', (req, res) => {
  const result = processAnswer(req.body);
  res.json(result);
});

app.get('/api/lessons/:id', (req, res) => {
  const lesson = getLesson(req.params.id);
  res.json(lesson);
});
```

### Sua Missão

1. Adicione comentários Swagger.
2. Documentemente em OpenAPI.
3. Crie README com exemplos.
4. Documente erros e rate limiting.

### Gabarito

```typescript
// src/routes/exercises.routes.ts

import swaggerUi from 'swagger-ui-express';

/**
 * @openapi
 * /api/submit-answer:
 *   post:
 *     summary: Submit student answer
 *     description: Submit an answer to an exercise and get evaluation
 *     tags:
 *       - Exercises
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - exerciseId
 *               - answer
 *             properties:
 *               exerciseId:
 *                 type: string
 *                 format: uuid
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *               answer:
 *                 type: string
 *                 example: "def fibonacci(n): return 1 if n <= 1 else fibonacci(n-1) + fibonacci(n-2)"
 *     responses:
 *       200:
 *         description: Answer evaluated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 passed:
 *                   type: boolean
 *                 score:
 *                   type: number
 *                   minimum: 0
 *                   maximum: 100
 *                 feedback:
 *                   type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Exercise not found
 *       429:
 *         description: Too many requests (rate limited)
 *         headers:
 *           X-RateLimit-Limit:
 *             schema:
 *               type: integer
 *           X-RateLimit-Remaining:
 *             schema:
 *               type: integer
 *           X-RateLimit-Reset:
 *             schema:
 *               type: integer
 */
router.post('/submit-answer', authMiddleware, submitAnswer);

/**
 * @openapi
 * /api/lessons/{id}:
 *   get:
 *     summary: Get lesson details
 *     description: Retrieve full content and metadata of a lesson
 *     tags:
 *       - Lessons
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *         description: Lesson ID
 *     responses:
 *       200:
 *         description: Lesson found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 title:
 *                   type: string
 *                 content:
 *                   type: string
 *                 exercises:
 *                   type: array
 *       404:
 *         description: Lesson not found
 */
router.get('/lessons/:id', getLesson);
```

```markdown
# README.md

## Quick Start

### Get All Lessons
```bash
curl http://localhost:3000/api/lessons
```

### Submit Answer
```bash
curl -X POST http://localhost:3000/api/submit-answer \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "exerciseId": "550e8400-e29b-41d4-a716-446655440000",
    "answer": "def fibonacci(n): return 1 if n <= 1 else fibonacci(n-1) + fibonacci(n-2)"
  }'
```

### Response
```json
{
  "passed": true,
  "score": 95,
  "feedback": "Great! Your solution is optimal."
}
```

## Rate Limiting

API limita a 100 requisições por minuto. Veja headers:
- `X-RateLimit-Limit`: Limite total
- `X-RateLimit-Remaining`: Requisições restantes
- `X-RateLimit-Reset`: Timestamp quando reseta
```

**Resultado:**
- ✅ Documentação interativa (Swagger).
- ✅ Exemplos reais.
- ✅ Erros documentados.
- ✅ Rate limiting comunicado.
- ✅ DX excelente.

