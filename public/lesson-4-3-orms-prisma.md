# LIÇÃO 4.3: ORMs (Prisma)

## SEÇÃO 1: INTRODUÇÃO (5 minutos)

### O Dilema do Developer

Você pode escrever SQL puro — poderoso, eficiente, mas verboso e arriscado (SQL injection, typos). Ou usar ORM — seguro, produtivo, mas abstração pode gerar queries ruins. Desenvolvedores experientes usam ORM *sabendo* como ele funciona.

Prisma é ORM moderno, type-safe (TypeScript), com migrations automáticas e relações explícitas. Não é SQL generator mágico — precisa entender o que faz embaixo.

### O Que Você Vai Aprender

- Prisma schema: definir modelo de dados, relacionamentos
- CRUD com Prisma Client
- Relações: 1:1, 1:N, N:M e como evitar N+1
- Migrations: evoluir schema sem perder dados
- Quando ORM é overkill vs perfeito; anti-patterns comuns

---

## SEÇÃO 2: PRISMA SCHEMA — DEFINIR MODELO (12 minutos)

### Estrutura Básica

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id    String @id @default(cuid()) // Ou @default(uuid())
  email String @unique
  name  String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relação: um usuário tem muitos progressos
  lessons LessonProgress[]
}

model Lesson {
  id    String @id @default(cuid())
  title String
  content String
  moduleId String
  module Module @relation(fields: [moduleId], references: [id])
  
  createdAt DateTime @default(now())

  // Relação reversa: muitos progressos apontam para lição
  userProgress LessonProgress[]
}

model Module {
  id String @id @default(cuid())
  title String
  
  lessons Lesson[] // Reverso: módulo tem muitas lições
}

model LessonProgress {
  id String @id @default(cuid())
  
  // Foreign keys explícitas
  userId String
  lessonId String
  
  status String @default("in_progress")
  progressPercentage Int @default(0)
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  lesson Lesson @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Unique: (user, lesson) não se repete
  @@unique([userId, lessonId])
  // Índices para queries frequentes
  @@index([userId])
  @@index([status])
}
```

Tipos de dados:
- `String`, `Int`, `Float`, `Boolean`, `DateTime`
- `Decimal` para valores monetários
- `Json` para dados estruturados
- `Bytes` para binários

---

## SEÇÃO 3: CRUD COM PRISMA CLIENT (12 minutos)

### Create

```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Inserir usuário
const user = await prisma.user.create({
  data: {
    email: 'student@example.com',
    name: 'Alice',
  }
});

// Inserir com relação (nested create)
const lesson = await prisma.lesson.create({
  data: {
    title: 'Algoritmos Básicos',
    content: '...',
    module: {
      connect: { id: 'module-1' } // Conecta a módulo existente
    }
  }
});

// Batch insert
const lessons = await prisma.lesson.createMany({
  data: [
    { title: 'Lição 1', moduleId: 'mod-1' },
    { title: 'Lição 2', moduleId: 'mod-1' }
  ]
});
```

### Read

```typescript
// Buscar um
const user = await prisma.user.findUnique({
  where: { email: 'student@example.com' }
});

// Buscar muitos
const users = await prisma.user.findMany({
  where: { createdAt: { gte: new Date('2024-01-01') } },
  take: 10,
  skip: 0,
  orderBy: { createdAt: 'desc' }
});

// Com relações (incluir progressos)
const userWithProgress = await prisma.user.findUnique({
  where: { id: 'user-1' },
  include: {
    lessons: true // CUIDADO: N+1 se não filtra
  }
});

// Melhor: include com where (filter relação)
const userWithCompletedLessons = await prisma.user.findUnique({
  where: { id: 'user-1' },
  include: {
    lessons: {
      where: { status: 'completed' }
    }
  }
});
```

### Update

```typescript
// Update um
const updated = await prisma.lessonProgress.update({
  where: { id: 'progress-1' },
  data: { status: 'completed', progressPercentage: 100 }
});

// Update muitos
const updatedMany = await prisma.lessonProgress.updateMany({
  where: { status: 'in_progress' },
  data: { progressPercentage: 50 }
});

// Upsert (insert ou update)
const result = await prisma.user.upsert({
  where: { email: 'new@example.com' },
  update: { name: 'Updated Name' },
  create: { email: 'new@example.com', name: 'New User' }
});
```

### Delete

```typescript
// Delete um
await prisma.lessonProgress.delete({
  where: { id: 'progress-1' }
});

// Delete muitos
const deleted = await prisma.lessonProgress.deleteMany({
  where: { status: 'abandoned' }
});

// Com onDelete: Cascade no schema, deletar user cascata deleta progresso
await prisma.user.delete({
  where: { id: 'user-1' }
});
```

---

## SEÇÃO 4: RELACIONAMENTOS E EVITAR N+1 (12 minutos)

### Um-para-Muitos (1:N)

```prisma
model User {
  id String @id @default(cuid())
  lessons LessonProgress[]
}

model LessonProgress {
  id String @id @default(cuid())
  userId String
  user User @relation(fields: [userId], references: [id])
}
```

Queries:
```typescript
// Certo: Fetch com relação em uma query
const user = await prisma.user.findUnique({
  where: { id: 'user-1' },
  include: { lessons: true }
});

// Errado: Múltiplas queries (N+1)
const user = await prisma.user.findUnique({ where: { id: 'user-1' } });
const lessons = await prisma.lessonProgress.findMany({
  where: { userId: user.id }
});
```

### Muitos-para-Muitos (N:M)

```prisma
model Student {
  id String @id @default(cuid())
  courses StudentCourse[]
}

model Course {
  id String @id @default(cuid())
  students StudentCourse[]
}

model StudentCourse {
  studentId String
  courseId String
  enrolledAt DateTime @default(now())
  
  student Student @relation(fields: [studentId], references: [id])
  course Course @relation(fields: [courseId], references: [id])
  
  @@id([studentId, courseId]) // Chave composta
}
```

Queries:
```typescript
// Listar cursos de estudante
const student = await prisma.student.findUnique({
  where: { id: 'student-1' },
  include: {
    courses: {
      include: { course: true } // Inclui dados do curso
    }
  }
});

// Atribuir aluno a curso
await prisma.studentCourse.create({
  data: {
    studentId: 'student-1',
    courseId: 'course-1'
  }
});
```

---

## SEÇÃO 5: MIGRATIONS — EVOLUIR SCHEMA (10 minutos)

### Workflow

```bash
# 1. Editar schema.prisma
# Adicionar campo, mudar tipo, etc.

# 2. Criar migration (snapshot + SQL)
npx prisma migrate dev --name add_exercise_answers

# Prisma gera:
# prisma/migrations/20240101120000_add_exercise_answers/migration.sql

# 3. Migration é aplicada automaticamente (dev)
# Precisa escrever data seed? Inclua em prisma/seed.ts

# 4. Em produção:
npx prisma migrate deploy
```

### Exemplo: Adicionar Campo

```prisma
// ANTES
model LessonProgress {
  id String @id @default(cuid())
  userId String
  lessonId String
  status String
}

// DEPOIS (nova coluna com default)
model LessonProgress {
  id String @id @default(cuid())
  userId String
  lessonId String
  status String
  completedAt DateTime? // Nullable, preenchido quando concluído
}
```

Migration gerada (SQL):
```sql
ALTER TABLE "LessonProgress" ADD COLUMN "completedAt" TIMESTAMP;
```

### Rollback

```bash
# Reverter última migration
npx prisma migrate resolve --rolled-back 20240101120000_add_exercise_answers

# Deletar arquivo migration, próximo deploy ignora
# Cuidado: se database foi afetada, estado fica inconsistente
```

---

## SEÇÃO 6: ANTI-PATTERNS E QUANDO EVITAR ORM (8 minutos)

### Anti-Pattern 1: N+1 via include

```typescript
// Ruim: include traz TODAS relações
const users = await prisma.user.findMany({
  take: 100,
  include: {
    lessons: true // Se cada user tem 50 lições, 100 users * 50 = 5000 linhas
  }
});

// Melhor: select apenas o necessário
const users = await prisma.user.findMany({
  take: 100,
  include: {
    lessons: {
      select: { id: true, status: true }, // Só colunas necessárias
      where: { status: 'completed' } // Filtrar
    }
  }
});
```

### Anti-Pattern 2: Sem Índices

```prisma
model LessonProgress {
  userId String // Foreign key, mas sem índice explícito
  status String // Consultado frequentemente sem índice
}
```

Melhor:
```prisma
model LessonProgress {
  userId String
  status String
  
  @@index([userId])
  @@index([status])
}
```

### Quando Evitar ORM

- **Raw queries muito complexas:** Agregações, window functions, CTEs
- **Bulk operations:** 1M de inserts — ORM é lento, SQL bulk é rápido
- **Relatórios:** SQL puro é mais rápido, mais simples
- **Queries multi-tabela:** SQL hand-written é mais transparente

Solução: Prisma permite $queryRaw para SQL puro:
```typescript
const result = await prisma.$queryRaw`
  SELECT u.id, COUNT(p.id) as lessons_completed
  FROM users u
  LEFT JOIN LessonProgress p ON u.id = p.user_id
  GROUP BY u.id
  HAVING COUNT(p.id) > 50
`;
```

---

## SEÇÃO 7: SÍNTESE (3 minutos)

**Prisma é excelente para:**
- CRUD simples (create, read, update, delete)
- Relações explícitas (type-safe)
- Migrations automáticas
- Evitar SQL injection

**Não é bom para:**
- Queries muito complexas (SQL puro é melhor)
- Bulk operations (use $queryRaw)
- Relatórios (SQL raw é transparente)

**Ouro: Combinar:** Prisma para modelo, $queryRaw para queries críticas.

---

## EXERCÍCIO PRÁTICO

Implemente modelo de dados para plataforma educacional com Prisma:

1. **Schema:** Users, Lessons, LessonProgress, ExerciseAnswers, AiTutorQueries
2. **Migrations:** Evoluir schema (adicionar campo, novo modelo)
3. **CRUD:** Implementar serviço que completa lição para usuário
4. **Otimização:** Use include com where para evitar N+1
5. **Raw Query:** Agregação de respostas corretas (COUNT, GROUP BY)

---

## RESUMO

Prisma torna CRUD seguro e produtivo, mas entender SQL embaixo é essencial. Use ORM para modelo, SQL raw para queries críticas. Migrations automáticas reduzem bugs de evolução schema.
