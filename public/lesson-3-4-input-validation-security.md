# LIÇÃO 3.4: Input Validation & Security - Defensiva é Seu Superpoder

## SEÇÃO 1: INTRODUÇÃO (5 minutos)

### O Problema Real

Seu API recebe um request JSON aparentemente inócuo:

```json
{
  "studentId": "123",
  "answer": "<script>alert('hacked')</script>"
}
```

Você não valida. O `answer` é armazenado direto no banco. Quando outro professor vê essa resposta no painel, o script executa. Agora o hacker tem acesso à sessão do professor.

Outro atacante vê que seu SQL é vulnerável a injection. Manda:

```json
{
  "lessonId": "1' OR '1'='1"
}
```

De repente ele consegue ver todas as lições de todos os alunos.

Validação não é "extras de segurança". É a primeira linha de defesa. Sem validação, você é responsável por todo roubo de dados que acontecer depois.

### Por Que Importa

- ✅ Previne ataques (SQL injection, XSS, CSRF).
- ✅ Melhora qualidade (dados inválidos não entram).
- ✅ Reduz bugs (sabe o que esperar).
- ✅ Protege usuários (seus dados estão seguros).

### Objetivo da Lição

Nesta aula, você vai aprender:

- Tipos de vulnerabilidades (injection, XSS, CSRF, etc.).
- Como validar entrada (whitelist, não blacklist).
- Ferramentas práticas (Zod, Joi).
- Sanitização vs Validação.
- Padrões OWASP Top 10.

---

## SEÇÃO 2: VULNERABILIDADES COMUNS (20 minutos)

### SQL Injection

```typescript
// ❌ VULNERÁVEL
app.get('/api/lessons/:id', async (req, res) => {
  const lessonId = req.params.id;
  
  // Atacante passa: 1' OR '1'='1
  const lesson = await db.query(`SELECT * FROM lessons WHERE id = '${lessonId}'`);
  // Query se torna: SELECT * FROM lessons WHERE id = '1' OR '1'='1'
  // Retorna TODOS os lessons
  
  res.json(lesson);
});

// ✅ SEGURO - Prepared Statement
app.get('/api/lessons/:id', async (req, res) => {
  const lessonId = req.params.id;
  
  // Parâmetro é escapado pelo driver
  const lesson = await db.query('SELECT * FROM lessons WHERE id = $1', [lessonId]);
  
  res.json(lesson);
});
```

**Regra:** Nunca concatene user input em SQL. Sempre use prepared statements.

### XSS (Cross-Site Scripting)

```typescript
// ❌ VULNERÁVEL
app.get('/api/lesson/:id', async (req, res) => {
  const lesson = await lessonRepository.findById(req.params.id);
  
  // Renderiza sem escapar
  res.send(`<h1>${lesson.title}</h1>`);
  // Se lesson.title = "<img src=x onerror='alert(1)'>", script executa
});

// ✅ SEGURO - Escape HTML
import { escapeHtml } from 'escape-html';

app.get('/api/lesson/:id', async (req, res) => {
  const lesson = await lessonRepository.findById(req.params.id);
  
  // Escapa caracteres perigosos
  res.send(`<h1>${escapeHtml(lesson.title)}</h1>`);
  // <img src=x onerror=...> vira &lt;img src=x onerror=...&gt;
});

// Ou melhor: Retorna JSON
app.get('/api/lesson/:id', async (req, res) => {
  const lesson = await lessonRepository.findById(req.params.id);
  res.json(lesson); // Frontend renderiza com template engine seguro
});
```

### CSRF (Cross-Site Request Forgery)

```typescript
// ❌ VULNERÁVEL - Qualquer site consegue fazer POST
app.post('/api/lessons', authMiddleware, async (req, res) => {
  const lesson = await lessonService.create(req.body);
  res.json(lesson);
});

// Atacante coloca no seu site:
// <img src="https://api.educacional.com/api/lessons?title=Hacked" />
// Se você tiver login ativo, cria a lição malvada

// ✅ SEGURO - CSRF Token
app.use(csrf()); // Middleware que gera tokens

app.post('/api/lessons', 
  authMiddleware,
  csrf(),
  async (req, res) => {
    // Token é validado automaticamente
    const lesson = await lessonService.create(req.body);
    res.json(lesson);
  }
);

// Ou com SameSite Cookie
app.use(session({
  cookie: {
    sameSite: 'strict' // Cookie não é enviado em cross-site requests
  }
}));
```

### XXE (XML External Entity)

```typescript
// ❌ VULNERÁVEL
app.post('/api/import-lesson', async (req, res) => {
  const xml = req.body;
  
  // Parse sem desabilitar entidades externas
  const data = xml2js.parseString(xml);
  
  // Atacante passa:
  // <?xml version="1.0"?>
  // <!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
  // <lesson>&xxe;</lesson>
  // Servidor tenta ler arquivo local
});

// ✅ SEGURO - Desabilitar XXE
app.post('/api/import-lesson', async (req, res) => {
  const options = {
    entities: false,
    dtd: false
  };
  
  const data = xml2js.parseString(req.body, options);
  res.json(data);
});
```

---

## SEÇÃO 3: VALIDAÇÃO PRÁTICA (20 minutos)

### Abordagem Errada: Blacklist

```typescript
// ❌ Blacklist é perigosa
function isValidString(str: string): boolean {
  // Bloqueia algumas palavras-chave perigosas
  const blocked = ['<script>', 'DROP TABLE', 'javascript:'];
  
  return !blocked.some(word => str.includes(word));
}

// Mas atacante consegue contornar:
// "<SCRIPT>alert('xss')</SCRIPT>" (maiúsculas)
// "<img src=x onerror=alert('xss')>" (não tem <script>)
// "jAvAsCrIpT:alert('xss')" (case mixing)
```

### Abordagem Correta: Whitelist

```typescript
// ✅ Whitelist define o que é VÁLIDO
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

function isValidUserId(id: string): boolean {
  // UUID v4: XXXXXXXX-XXXX-4XXX-yXXX-XXXXXXXXXXXX
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

function isValidLessonId(id: string): boolean {
  // Apenas números
  return /^\d+$/.test(id) && id.length > 0 && id.length <= 10;
}
```

### Validação com Zod (Recomendado)

```typescript
// Arquivo: examples/zod-validation.ts

import { z } from 'zod';

// Define schema
const studentAnswerSchema = z.object({
  studentId: z.string().uuid('Invalid student ID'),
  exerciseId: z.string().uuid('Invalid exercise ID'),
  answer: z.string()
    .min(1, 'Answer cannot be empty')
    .max(10000, 'Answer too long')
    .refine((val) => !val.includes('<script>'), 'Invalid characters'),
  submittedAt: z.date().optional()
});

// Usa em middleware
function validateRequest(schema: z.ZodSchema) {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated; // Agora é garantido estar correto
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          issues: err.issues
        });
      }
      next(err);
    }
  };
}

// Usa na rota
app.post('/api/submit-answer',
  authMiddleware,
  validateRequest(studentAnswerSchema),
  async (req, res) => {
    // req.body é garantido estar de acordo com schema
    const result = await submitAnswer(req.body);
    res.json(result);
  }
);
```

### Validação com Joi (Alternativa)

```typescript
// Arquivo: examples/joi-validation.ts

import Joi from 'joi';

const submissionSchema = Joi.object({
  studentId: Joi.string().uuid({ version: 'uuidv4' }).required(),
  exerciseId: Joi.string().uuid({ version: 'uuidv4' }).required(),
  answer: Joi.string().min(1).max(10000).required(),
  submittedAt: Joi.date().optional()
});

app.post('/api/submit-answer', async (req, res) => {
  const { error, value } = submissionSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details
    });
  }

  // value é validado
  const result = await submitAnswer(value);
  res.json(result);
});
```

---

## SEÇÃO 4: SANITIZAÇÃO (10 minutos)

### Validação ≠ Sanitização

- **Validação:** Rejeita dados inválidos.
- **Sanitização:** Limpa dados perigosos (mantém sendo útil).

```typescript
// Validação: Rejeita
const isStrictEmail = z.string().email();
// "user@example.com" → ✅ OK
// "user@example.com\n" → ❌ ERRO

// Sanitização: Limpa
const sanitizeEmail = (email: string) => email.trim().toLowerCase();
// "User@Example.Com\n" → "user@example.com"
```

### Exemplos de Sanitização

```typescript
import { sanitize } from 'sanitize-html';
import { escape } from 'html-escaper';

// Limpar HTML (remover tags perigosas)
const dirtyHtml = '<p>Hello <script>alert("xss")</script></p>';
const cleanHtml = sanitize(dirtyHtml, {
  allowedTags: ['p', 'strong', 'em'],
  allowedAttributes: {}
});
// Resultado: '<p>Hello </p>'

// Escapar HTML (manter conteúdo, escapar chars perigosos)
const userInput = '<img src=x onerror="alert(1)">';
const escaped = escape(userInput);
// Resultado: '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;'

// Normalizar string (remover caracteres invisíveis)
const input = 'user\x00name'; // Tem null byte
const clean = input.replace(/\0/g, ''); // 'username'
```

---

## SEÇÃO 5: PADRÃO SEGURO COMPLETO (10 minutos)

```typescript
// Arquivo: examples/secure-api-pattern.ts

import { Router } from 'express';
import { z } from 'zod';
import { sanitize } from 'sanitize-html';

const router = Router();

// 1. Define schema (whitelist)
const createLessonSchema = z.object({
  title: z.string()
    .min(5, 'Title too short')
    .max(200, 'Title too long'),
  content: z.string()
    .min(50, 'Content too short')
    .max(50000, 'Content too long'),
  tags: z.array(z.string()).optional()
});

// 2. Middleware de validação
function validate(schema: z.ZodSchema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: err.issues[0].message });
      }
      next(err);
    }
  };
}

// 3. Middleware de sanitização (opcional, se armazenar HTML)
function sanitizeHtml(req, res, next) {
  if (req.body.content && typeof req.body.content === 'string') {
    req.body.content = sanitize(req.body.content, {
      allowedTags: ['p', 'br', 'strong', 'em', 'ul', 'li'],
      allowedAttributes: {}
    });
  }
  next();
}

// 4. Rota
router.post('/lessons',
  authMiddleware,
  validate(createLessonSchema),
  sanitizeHtml,
  async (req, res, next) => {
    try {
      const lesson = await lessonService.create(req.body);
      res.status(201).json(lesson);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
```

---

## QUIZ: 5 Perguntas

### Pergunta 1: SQL Injection

**Por que prepared statements previnem SQL injection?**

A) Porque escrevem SQL em maiúsculas.  
B) Porque user input é enviado separadamente da query string.  
C) Porque validam com regex.  
D) Porque criptografam o banco.

**Resposta Correta:** B

---

### Pergunta 2: XSS

**Qual é a melhor defesa contra XSS?**

A) Usar password manager.  
B) Escapar HTML ou retornar JSON (deixar frontend renderizar).  
C) Aumentar timeout de sessão.  
D) Usar HTTPS.

**Resposta Correta:** B

---

### Pergunta 3: Validação vs Sanitização

**Qual é a diferença?**

A) São a mesma coisa.  
B) Validação rejeita inválido; sanitização limpa.  
C) Sanitização é mais segura.  
D) Validação não é segura.

**Resposta Correta:** B

---

### Pergunta 4: Whitelist vs Blacklist

**Por que whitelist é melhor que blacklist?**

A) Porque é mais rápida.  
B) Porque bloqueia tudo exceto o permitido (mais seguro).  
C) Porque rejeita mais requests.  
D) Porque é mais fácil de entender.

**Resposta Correta:** B

---

### Pergunta 5: CSRF Token

**O que previne CSRF?**

A) Senha forte.  
B) Token + validação que site é autorizado.  
C) HTTPS.  
D) Logout.

**Resposta Correta:** B

---

## EXERCÍCIO PRÁTICO: Valide e Sanitize uma API

### Desafio

Você recebeu um endpoint vulnerável:

```typescript
// ❌ VULNERÁVEL
app.post('/api/discussions/comment', authMiddleware, async (req, res) => {
  const comment = {
    discussionId: req.body.discussionId,
    studentId: req.user.userId,
    text: req.body.text,
    createdAt: new Date()
  };

  await db.run(`
    INSERT INTO comments (discussionId, studentId, text, createdAt)
    VALUES ('${comment.discussionId}', '${comment.studentId}', '${comment.text}', '${comment.createdAt}')
  `);

  res.json({ message: 'Comment posted', comment });
});
```

### Sua Missão

1. Implemente validação (whitelist).
2. Use prepared statements (SQL injection).
3. Sanitize HTML se houver.
4. Retorna erros sensatos.

### Gabarito

```typescript
// Arquivo: src/middleware/validation.ts
import { z } from 'zod';

export const commentSchema = z.object({
  discussionId: z.string().uuid('Invalid discussion ID'),
  text: z.string()
    .min(1, 'Comment cannot be empty')
    .max(5000, 'Comment too long')
});

export function validateComment(req, res, next) {
  try {
    req.body = commentSchema.parse(req.body);
    next();
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.issues[0].message });
    }
    next(err);
  }
}
```

```typescript
// Arquivo: src/routes/discussions.ts
import { Router } from 'express';
import { validateComment } from '../middleware/validation';
import { authMiddleware } from '../middleware/auth.middleware';
import * as discussionService from '../services/discussion.service';

const router = Router();

router.post('/discussions/comment',
  authMiddleware,
  validateComment,
  async (req, res, next) => {
    try {
      const comment = await discussionService.createComment({
        discussionId: req.body.discussionId,
        studentId: req.user.userId,
        text: req.body.text
      });

      res.status(201).json({ message: 'Comment posted', comment });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
```

```typescript
// Arquivo: src/services/discussion.service.ts
import { sanitize } from 'sanitize-html';

export async function createComment(data: {
  discussionId: string;
  studentId: string;
  text: string;
}) {
  // Sanitize HTML (remove scripts, mas permite basic formatting)
  const cleanText = sanitize(data.text, {
    allowedTags: ['p', 'br', 'strong', 'em', 'code'],
    allowedAttributes: {}
  });

  // Prepared statement (SQL injection proof)
  return await db.query(`
    INSERT INTO comments (discussionId, studentId, text, createdAt)
    VALUES ($1, $2, $3, NOW())
    RETURNING *
  `, [data.discussionId, data.studentId, cleanText]);
}
```

**Melhorias:**
- ✅ Validação com Zod (whitelist).
- ✅ Prepared statement (não vulnerável a SQL injection).
- ✅ Sanitização de HTML.
- ✅ Tratamento de erro.
- ✅ UUID para discussionId (não aceita qualquer string).

