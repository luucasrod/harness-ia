import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function seedModule1() {
  console.log('🌱 Seeding Module 1: Engineering Foundations...');

  // Create Module 1
  const module = await db.module.create({
    data: {
      title: 'Engineering Foundations',
      courseId: 1,
      order: 1,
    },
  });

  console.log(`✅ Module created: ${module.title}`);

  // Lesson 1.1: Engineering vs. Coding
  const lesson1 = await db.lesson.create({
    data: {
      title: 'Engineering vs. Coding - Mentalidade Profissional',
      content: `# Engenharia vs. Coding - Mentalidade Profissional

## Seção 1: Introdução (5 min)

A diferença entre um **"developer"** que escreve código e um **"engineer"** que constrói sistemas é fundamental. Um developer pergunta: "Como faço X funcionar?" Um engineer pergunta: "Como faço X funcionar de forma escalável, mantível, confiável e econômica?"

Esta lição estabelece o mindset que diferencia profissionais.

## Seção 2: O Que Diferencia Engenheiro de Desenvolvedor (15 min)

### Perspectiva do Coder (Feature-focused)
\`\`\`typescript
// Coder: "Preciso desenbloquear a lição quando o aluno completa o exercício"
async function completeLessonOnExerciseCompletion(userId: number, exerciseId: number) {
  const exercise = await db.exercise.findUnique({ where: { id: exerciseId } });
  await db.userProgress.update({
    where: { userId_lessonId: { userId, lessonId: exercise.lessonId } },
    data: { completed: true },
  });
}
\`\`\`

### Perspectiva do Engineer (System-focused)
\`\`\`typescript
// Engineer: "Preciso de um sistema de progressão que:
// - Valida transições de estado (not started → in progress → completed)
// - Atualiza agregados relacionados (progress, skills, achievements)
// - Dispara eventos para notificações, badges, etc
// - É idempotente (safe to retry)
// - É auditável (registra quem mudou quando)"

class LessonProgressionService {
  constructor(
    private db: PrismaClient,
    private eventBus: EventBus,
    private skillCalculator: SkillCalculator,
  ) {}

  async completeLessonWhenExerciseCompleted(
    userId: string,
    exerciseId: number,
  ): Promise<void> {
    const exercise = await this.db.exercise.findUniqueOrThrow({
      where: { id: exerciseId },
      include: { lesson: true },
    });

    // Transaction para integridade
    await this.db.$transaction(async (tx) => {
      // Verificar pré-condição
      const progress = await tx.userProgress.findUniqueOrThrow({
        where: { userId_lessonId: { userId, lessonId: exercise.lessonId } },
      });

      if (progress.completed) {
        throw new AlreadyCompletedError('Lição já foi marcada como completa');
      }

      if (!this.canProgress(progress.status)) {
        throw new InvalidTransitionError(
          \`Não posso completar a lição no estado \${progress.status}\`,
        );
      }

      // Atualizar progresso
      const updated = await tx.userProgress.update({
        where: { userId_lessonId: { userId, lessonId: exercise.lessonId } },
        data: {
          completed: true,
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      // Atualizar agregados relacionados
      await this.updateModuleProgress(tx, userId, exercise.lesson.moduleId);
      await this.updateUserSkills(tx, userId, exercise.lesson);

      // Disparo de eventos (desacoplado)
      await this.eventBus.publish(new LessonCompletedEvent({
        userId,
        lessonId: exercise.lessonId,
        moduleId: exercise.lesson.moduleId,
        completedAt: updated.completedAt,
      }));
    });
  }

  private canProgress(status: string): boolean {
    return status === 'NOT_STARTED' || status === 'IN_PROGRESS';
  }

  private async updateModuleProgress(
    tx: Prisma.TransactionClient,
    userId: string,
    moduleId: number,
  ): Promise<void> {
    // Lógica para calcular progresso do módulo
  }

  private async updateUserSkills(
    tx: Prisma.TransactionClient,
    userId: string,
    lesson: any,
  ): Promise<void> {
    // Lógica para atualizar skills do usuário baseado na lição
  }
}
\`\`\`

**Diferença chave:** Coder = X funciona. Engineer = X funciona, escala, é mantível, é seguro.

## Seção 3: SOLID Principles (Introdução)

Os princípios SOLID (Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion) são a base para código que se adapta a mudanças.

**Exemplo SRP violado:**
\`\`\`typescript
class UserRepository {
  async createUser(userData: any) {
    // Validação
    if (!userData.email.includes('@')) throw new Error('Invalid email');

    // Criptografia
    userData.password = bcrypt.hashSync(userData.password, 10);

    // Envio de email
    await sendWelcomeEmail(userData.email);

    // Persistência
    return db.user.create({ data: userData });
  }
}
\`\`\`

**Exemplo SRP correto:**
\`\`\`typescript
class UserRepository {
  async createUser(userData: UserDTO) {
    return db.user.create({ data: userData });
  }
}

class UserValidator {
  validate(data: any): void {
    if (!data.email.includes('@')) throw new ValidationError('Invalid email');
  }
}

class PasswordHasher {
  hash(password: string): string {
    return bcrypt.hashSync(password, 10);
  }
}

class WelcomeEmailService {
  async sendWelcome(email: string): Promise<void> {
    await sendWelcomeEmail(email);
  }
}

class UserCreationService {
  constructor(
    private validator: UserValidator,
    private hasher: PasswordHasher,
    private emailService: WelcomeEmailService,
    private repository: UserRepository,
  ) {}

  async create(userData: UserDTO): Promise<User> {
    this.validator.validate(userData);
    const hashed = this.hasher.hash(userData.password);
    const user = await this.repository.createUser({ ...userData, password: hashed });
    await this.emailService.sendWelcome(user.email);
    return user;
  }
}
\`\`\`

## Seção 4: Pensamento em Sistemas vs. Features

Quando você é convidado a "adicionar um tutor de IA", um coder pensa: "Preciso chamar a API do Claude e retornar a resposta." Um engineer pensa:

- Como cache de respostas?
- Como acompanho uso (tokens, custo)?
- Como integro feedback do usuário?
- Como audito que a resposta foi apropriada?
- Como trato timeouts da API?
- Como escalo isso para 10M estudantes?

O sistema de tutor não é apenas "chamar API", é um subsistema completo.

## Seção 5: Qualidade de Código como Arquitetura

Código de qualidade é código que:
- É fácil de ler (intent é claro)
- É fácil de testar (dependências são injetadas)
- É fácil de estender (aberto para extensão, fechado para modificação)
- É fácil de manter (responsabilidades bem definidas)

Débito técnico é a distância entre onde você está e onde deveria estar. É real, acumula juros (custos aumentam), e eventualmente quebra a empresa.

---

## Exercício Prático: Refatore Componente

Refatore este código aplicando princípios de engenharia:

\`\`\`typescript
async function processUserLesson(userId: number, lessonId: number) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  const lesson = await db.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) throw new Error('Lesson not found');

  const progress = await db.userProgress.findFirst({
    where: { userId, lessonId },
  });

  if (progress && progress.completed) {
    throw new Error('Already completed');
  }

  await db.userProgress.updateMany({
    where: { userId, lessonId },
    data: { completed: true },
  });

  const count = await db.userProgress.count({
    where: { userId, completed: true },
  });

  if (count % 5 === 0) {
    await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + process.env.SENDGRID_KEY },
      body: JSON.stringify({
        from: { email: 'course@example.com' },
        to: [{ email: user.email }],
        subject: 'Parabéns! Completou 5 lições!',
        content: [{ type: 'text/html', value: '<h1>Parabéns!</h1>' }],
      }),
    });
  }
}
\`\`\`

**Problemas:**
1. Responsabilidades mistas (validação, persistência, notificações)
2. Difícil de testar (hardcoded API, db calls)
3. Difícil de estender (notificações estão no meio da lógica)
4. Sem tratamento de erro (fetch pode falhar)

**Gabarito incluído na plataforma.**
`,
      moduleId: module.id,
      type: 'CONTENT',
      duration: 45,
      order: 1,
    },
  });

  // Lesson 1.2: Claude Code & AI-Powered Development
  const lesson2 = await db.lesson.create({
    data: {
      title: 'Claude Code & AI-Powered Development',
      content: `# Claude Code & AI-Powered Development

## O Mindset Certo

Claude Code não é "IA que escreve seu código por você". É uma ferramenta arquitetural que:
- Gera código structural (scaffolding)
- Refatora código existente
- Faz code review
- Sugere alternativas de design

Você ainda pensa. A IA tira trabalho braçal.

## Workflows Profissionais

### Workflow 1: Pair Programming
Você descreve o que quer. Claude gera. Você revisa e adapta.

### Workflow 2: Code Review
Passe código para Claude revisar segurança, performance, padrões.

### Workflow 3: Refactoring
Pegue código legado. Claude refatora seguindo SOLID.

## Prompting Efetivo

Um bom prompt tem:
1. **Contexto** - qual é o projeto?
2. **Problema** - o que precisa fazer?
3. **Restrições** - o que não pode fazer?
4. **Formato** - como quer a resposta?

**Péssimo:**
"Faz uma função de login"

**Bom:**
"Preciso de uma função de login em Express que:
- Valida email com regex
- Compara senha com bcrypt
- Retorna JWT
- Lança erro se credenciais inválidas
Tipo de retorno: Promise<{token: string}> | throws InvalidCredentialsError"

**Excelente:**
"Contexto: App Next.js com Prisma + NextAuth.
Preciso de: Migração de auth para API Keys (OpenAI style).
Requirements:
- API Keys are random, 32 chars
- Hash with SHA256, store hash
- Rate limit 100 requests/min per key
- Rotation support (old keys keep working 30 days)
Constraints:
- Use existing User + Session models
- Maintain backward compat with JWT auth
Output format: TypeScript interfaces + Prisma schema changes + API routes"
`,
      moduleId: module.id,
      type: 'CONTENT',
      duration: 60,
      order: 2,
    },
  });

  // Lesson 1.3: Git & Collaboration Workflow
  const lesson3 = await db.lesson.create({
    data: {
      title: 'Git & Collaboration Workflow Avançado',
      content: `# Git & Collaboration Workflow Avançado

## Git Flow vs. Trunk-Based Development

### Git Flow
- Feature branches para cada feature
- Release branches para releases
- Hotfix branches para emergências
- **Bom para:** Múltiplos releases simultâneos

### Trunk-Based
- Todos fazem commits em main (ou develop)
- Feature flags ao invés de branches longas
- Deploy contínuo
- **Bom para:** Startups, SaaS, CI/CD forte

**Google, Netflix, Uber usam Trunk-Based.**

## Conventional Commits

Formato: \`type(scope): subject\`

Tipos:
- feat: nova feature
- fix: correção
- refactor: refatoração
- test: testes
- docs: documentação
- ci: CI/CD

Exemplo: \`feat(auth): add OAuth2 Google integration\`

## Code Review Checklist

- [ ] Code funciona?
- [ ] Testes inclusos?
- [ ] Sem code smells?
- [ ] SOLID aplicado?
- [ ] Performance OK?
- [ ] Segurança OK?
- [ ] Documentação OK?

## Merge Conflicts

Estratégias:
1. **Manual merge** - entender ambas mudanças
2. **Rebase** - replay commits em ordem
3. **GUI tools** - VS Code, Beyond Compare
4. **Ours/Theirs** - take lado específico (use com cuidado!)

Prevention: commits pequenos, escopos bem definidos.
`,
      moduleId: module.id,
      type: 'CONTENT',
      duration: 45,
      order: 3,
    },
  });

  // Lesson 1.4: Dev Environment Setup
  const lesson4 = await db.lesson.create({
    data: {
      title: 'Dev Environment Setup & Tooling Profissional',
      content: `# Dev Environment Setup & Tooling Profissional

## Node.js & Package Managers

**LTS vs. Latest:**
- LTS: Estável, produção
- Latest: Novas features, pode quebrar

**npm vs. yarn vs. pnpm:**
- npm: Padrão, bundled com Node
- yarn: Mais rápido, lock file melhor
- pnpm: Mais rápido ainda, economiza espaço

**Lock files são obrigatórios.** Sem package-lock.json/yarn.lock, cada um tira uma versão diferente.

## TypeScript Stricto

\`\`\`json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "exactOptionalPropertyTypes": true
  }
}
\`\`\`

Strict mode previne 80% dos bugs em produção.

## ESLint + Prettier

- **ESLint:** Regras de qualidade
- **Prettier:** Formata automaticamente
- **Husky:** Git hooks automáticos

Pre-commit hook:
\`\`\`bash
npx husky add .husky/pre-commit "npm run lint"
\`\`\`

## Docker para Dev

\`\`\`dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
\`\`\`

Dev container garante que dev/prod são idênticos.
`,
      moduleId: module.id,
      type: 'CONTENT',
      duration: 45,
      order: 4,
    },
  });

  // Criar exercícios para cada lição
  const exercises = [
    {
      lessonId: lesson1.id,
      title: 'Quiz: Engineering vs. Coding',
      description: 'Responda 5 questões sobre mentalidade de engenharia',
    },
    {
      lessonId: lesson2.id,
      title: 'Quiz: Claude Code Workflows',
      description: 'Teste seu entendimento de prompting e workflows com IA',
    },
    {
      lessonId: lesson3.id,
      title: 'Quiz: Git & Collaboration',
      description: 'Perguntas sobre Git flow, commits semânticos, code review',
    },
    {
      lessonId: lesson4.id,
      title: 'Quiz: Dev Environment Setup',
      description: 'Teste sua compreensão de ferramentas e setup profissional',
    },
  ];

  for (const exercise of exercises) {
    await db.exercise.create({
      data: {
        ...exercise,
      },
    });
  }

  console.log(`✅ Module 1 seeded with 4 lessons and 4 exercises`);
}

seedModule1()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
