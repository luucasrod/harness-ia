# LIÇÃO 1.1: Engineering vs. Coding - Mentalidade Profissional

## SEÇÃO 1: INTRODUÇÃO (5 minutos)

### O Problema Real

Você escreve código que funciona. Depois, três meses depois, alguém precisa mudar uma regra simples e descobre que aquela função toca em 15 arquivos diferentes. Você mesmo volta a um código seu de seis meses atrás e pensa: "Quem escreveu isso?". Um bug é corrigido, mas três novos aparecem em produção.

Isso não é sinal de falta de habilidade. É sinal de que entre "código que funciona" e "código que persiste" há um abismo. Esse abismo separa um **coder** de um **engineer**.

### Por Que Essa Diferença Importa

A diferença não é semântica. É prática. Um coder entrega features. Um engineer entrega sistemas. Um coder otimiza para hoje. Um engineer otimiza para hoje e para daqui a seis meses, quando a equipe cresceu, o produto mudou de direção e novos integrantes precisam entender o código.

Empresas que crescem rápido aprendem isso da forma custosa: acumulam débito técnico que depois custa semanas de trabalho para limpar. Equipes maduras aprendem a pensar como engineers desde o começo. Esse curso é sobre pensar assim.

### Objetivo da Lição

Nesta aula, você vai entender:

- Qual é a verdadeira diferença entre um coder e um engineer.
- Por que essa diferença afeta qualidade, velocidade e satisfação de trabalho.
- Introdução aos princípios e padrões que engineers usam para tomar decisões.
- Como começar a aplicar essa mentalidade em seu próximo código.

Ninguém vira engineer lendo uma aula. Vira engineer praticando essas decisões todos os dias, durante meses. Mas a mentalidade é o primeiro passo.

---

## SEÇÃO 2: O QUE DIFERENCIA ENGENHEIRO DE DESENVOLVEDOR (15 minutos)

### A Questão Fundamental

**Um coder pergunta:** "Como faço isso funcionar?"

**Um engineer pergunta:** "Como faço isso funcionar de forma escalável, mantível, testável e confiável?"

Essa mudança de pergunta transforma tudo que vem depois.

### Exemplo Real 1: Implementação Simples vs. Pensada

Imagine que você precisa implementar um sistema de progresso de aluno em uma plataforma educacional. Um aluno completa uma lição e você precisa atualizar seu progresso.

#### Abordagem Coder

```javascript
async function completeLessonQuick(userId, lessonId) {
  // Busca o usuário
  const user = await db.query(
    "SELECT * FROM users WHERE id = '" + userId + "'"
  );
  
  // Marca a lição como completa
  await db.query(
    "UPDATE lessons_completed SET completed = 1 WHERE user_id = '" + 
    userId + "' AND lesson_id = '" + lessonId + "'"
  );
  
  // Busca todas as lições do módulo
  const lessons = await db.query(
    "SELECT * FROM lessons WHERE module_id = (SELECT module_id FROM lessons WHERE id = '" + 
    lessonId + "')"
  );
  
  // Calcula progresso manualmente
  const completed = await db.query(
    "SELECT COUNT(*) as count FROM lessons_completed WHERE user_id = '" + 
    userId + "'"
  );
  
  const percentage = (completed[0].count / lessons.length) * 100;
  
  // Atualiza o percentual
  await db.query(
    "UPDATE users SET progress = " + percentage + " WHERE id = '" + userId + "'"
  );
  
  return { success: true };
}
```

Esse código funciona. No primeiro dia, ele resolve o problema. Mas observe:

- SQL injection é possível (concatenação de strings).
- Lógica de negócio está espalhada no meio de queries.
- Não há tratamento de erro.
- Não há validação.
- Cálculo de progresso está misturado com persistência.
- Se adicionar uma regra (como aulas opcionais ou módulos bloqueados), essa função vira um pesadelo.

#### Abordagem Engineer

```typescript
// Arquivo: domain/models/lesson-progress.ts
export class LessonProgress {
  private userId: string;
  private moduleId: string;
  private completedLessonIds: Set<string>;
  private totalLessonsInModule: number;

  constructor(
    userId: string,
    moduleId: string,
    completedLessonIds: string[],
    totalLessonsInModule: number
  ) {
    this.userId = userId;
    this.moduleId = moduleId;
    this.completedLessonIds = new Set(completedLessonIds);
    this.totalLessonsInModule = totalLessonsInModule;
  }

  getPercentage(): number {
    if (this.totalLessonsInModule === 0) return 0;
    return (this.completedLessonIds.size / this.totalLessonsInModule) * 100;
  }

  isModuleComplete(): boolean {
    return this.completedLessonIds.size === this.totalLessonsInModule;
  }

  addCompletedLesson(lessonId: string): void {
    this.completedLessonIds.add(lessonId);
  }
}

// Arquivo: application/services/lesson-completion.service.ts
export class LessonCompletionService {
  constructor(
    private lessonRepository: LessonRepository,
    private progressRepository: ProgressRepository,
    private eventBus: EventBus,
    private logger: Logger
  ) {}

  async completeLessonForUser(
    userId: string,
    lessonId: string
  ): Promise<CompletionResult> {
    // Validação
    if (!userId || !lessonId) {
      throw new ValidationError("userId e lessonId são obrigatórios");
    }

    try {
      // Busca dados necessários
      const lesson = await this.lessonRepository.findById(lessonId);
      if (!lesson) {
        throw new NotFoundError(`Lição ${lessonId} não existe`);
      }

      // Busca progresso atual
      const progress = await this.progressRepository.getProgress(
        userId,
        lesson.moduleId
      );

      // Aplica regra de negócio (de forma isolada)
      progress.addCompletedLesson(lessonId);

      // Persiste
      await this.progressRepository.save(progress);

      // Publica evento para outros sistemas reagirem
      this.eventBus.emit("LessonCompleted", {
        userId,
        lessonId,
        completionPercentage: progress.getPercentage(),
        isModuleComplete: progress.isModuleComplete()
      });

      this.logger.info("lesson_completed", {
        userId,
        lessonId,
        newProgress: progress.getPercentage()
      });

      return {
        success: true,
        completionPercentage: progress.getPercentage(),
        isModuleComplete: progress.isModuleComplete()
      };
    } catch (error) {
      this.logger.error("lesson_completion_failed", {
        userId,
        lessonId,
        errorName: error.name,
        errorMessage: error.message
      });
      throw error;
    }
  }
}

// Arquivo: tests/lesson-completion.service.spec.ts
describe("LessonCompletionService", () => {
  it("should calculate progress correctly", async () => {
    const progress = new LessonProgress("user1", "module1", ["l1", "l2"], 5);
    
    expect(progress.getPercentage()).toBe(40);
    expect(progress.isModuleComplete()).toBe(false);
  });

  it("should mark module as complete when all lessons are done", () => {
    const progress = new LessonProgress("user1", "module1", ["l1", "l2", "l3"], 3);
    
    expect(progress.isModuleComplete()).toBe(true);
  });

  it("should validate input before processing", async () => {
    const service = createTestService();
    
    await expect(
      service.completeLessonForUser("", "lesson1")
    ).rejects.toThrow(ValidationError);
  });
});
```

Essa abordagem é maior. Mas observe:

- Lógica de negócio está isolada em classes específicas.
- Ela pode ser testada sem banco de dados.
- Erros são tratados com segurança.
- Dados de entrada são validados.
- SQL injection não é possível (o ORM cuida disso).
- Se precisar adicionar regras (aulas opcionais, bloqueios), você adiciona métodos à classe `LessonProgress` sem quebrar a estrutura.
- Outros sistemas podem reagir ao evento "LessonCompleted" sem acoplamento direto.
- Logs estruturados ajudam a investigar problemas em produção.

### Diferenças-Chave Ilustradas

| Aspecto | Coder | Engineer |
|---------|-------|----------|
| **Pergunta Inicial** | "Funciona?" | "Funciona, escala e persiste?" |
| **Mudanças Futuras** | "Vou reescrever" | "Vou adicionar um módulo" |
| **Testes** | "Testei manualmente" | "Testes automatizados protegem" |
| **Segurança** | "Provavelmente tá ok" | "Validação e permissões em todo lugar" |
| **Erros** | "Crasha em produção" | "Tratado, logado, recuperável" |
| **Comunicação** | Código é código | Código conta uma história |
| **Débito** | Acumula rápido | Reduzido intencionalmente |

### Maturidade é Reconhecer Trade-offs

Um engineer não é alguém que "faz tudo perfeito". É alguém que sabe:

- Quando simplicidade é mais valiosa que abstração.
- Quando investir em qualidade agora economiza tempo depois.
- Quando um MVP pode ser mais feito à moda coder (rápido) se souber que será descartado depois.
- Quando a equipe é uma pessoa, decisões mudam; quando são 10, estrutura importa demais.

A mentalidade de engineer é sobre ser **consciente** e **intencional** em cada decisão.

---

## SEÇÃO 3: INTRODUÇÃO AOS PRINCÍPIOS SOLID (10 minutos)

**Nota:** Este é apenas um overview. Cada princípio terá uma aula dedicada no Módulo 7. Agora você vê de onde vêm as ideias que guiam engineers.

SOLID é um acrônimo para cinco princípios que ajudam a escrever código mais flexível e mantível:

### S - Single Responsibility Principle (Responsabilidade Única)

Uma classe deve ter apenas uma razão para mudar.

```typescript
// Errado: classe com múltiplas responsabilidades
class UserManager {
  createUser(data) { /* ... */ }
  saveToDatabase(user) { /* ... */ }
  sendWelcomeEmail(user) { /* ... */ }
  validateCreditCard(card) { /* ... */ }
  processPayment(user, amount) { /* ... */ }
}
```

Se a forma de salvar usuário mudar, essa classe muda. Se o formato de email mudar, ela muda. Se as regras de pagamento mudarem, ela muda novamente. Múltiplas razões para mudar = múltiplos riscos.

```typescript
// Correto: responsabilidades separadas
class UserService {
  createUser(data) { /* ... */ }
}

class UserRepository {
  save(user) { /* ... */ }
}

class EmailService {
  sendWelcomeEmail(user) { /* ... */ }
}

class PaymentService {
  processPayment(user, amount) { /* ... */ }
}
```

Agora cada classe muda por uma razão clara. Um teste de criação de usuário não precisa conhecer detalhes de pagamento.

### O - Open/Closed Principle (Aberto para Extensão, Fechado para Modificação)

Software deve ser aberto para extensão, mas fechado para modificação.

```typescript
// Errado: para adicionar novo tipo de exercício, modificamos a função existente
class ExerciseGrader {
  grade(exercise, answer) {
    if (exercise.type === "multiple_choice") {
      return answer === exercise.correctAnswer;
    }
    if (exercise.type === "essay") {
      // Aqui precisamos saber regras de essay
      return this.gradeEssay(answer, exercise);
    }
    if (exercise.type === "code") {
      // E aqui regras de código
      return this.gradeCode(answer, exercise);
    }
    // Cada novo tipo FORÇA mudança aqui
  }
}
```

```typescript
// Correto: novo tipo = nova classe
interface ExerciseStrategy {
  grade(answer, exercise): boolean;
}

class MultipleChoiceGrader implements ExerciseStrategy {
  grade(answer, exercise) {
    return answer === exercise.correctAnswer;
  }
}

class EssayGrader implements ExerciseStrategy {
  grade(answer, exercise) {
    return this.evaluateContent(answer, exercise);
  }
}

// Para adicionar novo tipo, criamos uma nova classe, não modificamos a existente
class CodeGrader implements ExerciseStrategy {
  grade(answer, exercise) {
    return this.runAndTest(answer, exercise);
  }
}

class GraderFactory {
  createGrader(type: string): ExerciseStrategy {
    if (type === "multiple_choice") return new MultipleChoiceGrader();
    if (type === "essay") return new EssayGrader();
    if (type === "code") return new CodeGrader();
    throw new Error(`Unknown type: ${type}`);
  }
}
```

Agora, adicionar novo tipo de exercício não modifica código existente. Menos risco de quebrar o que já funciona.

### I - Interface Segregation Principle (Segregação de Interface)

Não force uma classe a implementar métodos que não usa.

```typescript
// Errado: interface gorda
interface Repository {
  create(data): Entity;
  read(id): Entity;
  update(id, data): Entity;
  delete(id): void;
  list(): Entity[];
  findByName(name): Entity[];
  findByDate(date): Entity[];
  // ... 10 mais métodos
}

// Uma classe que só precisa ler dados é forçada a implementar tudo
class ReadOnlyLessonRepository implements Repository {
  create() { throw new Error("Not implemented"); }
  read(id) { /* ... */ }
  update() { throw new Error("Not implemented"); }
  delete() { throw new Error("Not implemented"); }
  list() { /* ... */ }
  // ... todos os outros como throw
}
```

```typescript
// Correto: interfaces pequenas e específicas
interface ReadRepository<T> {
  read(id): T;
  list(): T[];
}

interface WriteRepository<T> {
  create(data): T;
  update(id, data): T;
  delete(id): void;
}

interface SearchRepository<T> {
  findByName(name): T[];
  findByDate(date): T[];
}

class LessonService implements ReadRepository<Lesson> {
  read(id) { /* ... */ }
  list() { /* ... */ }
}
```

Agora cada classe implementa apenas o que realmente precisa.

### D - Dependency Inversion Principle (Inversão de Dependência)

Código de alto nível não deve depender de código de baixo nível. Ambos devem depender de abstrações.

```typescript
// Errado: serviço depende diretamente de implementação
class UserService {
  constructor() {
    this.emailService = new EmailService(); // Acoplamento direto
    this.database = new MySQLDatabase(); // Acoplamento direto
  }

  register(user) {
    this.database.save(user);
    this.emailService.send(user.email, "Welcome!");
  }
}
```

Se quiser trocar EmailService por OutlookEmailService ou o banco de MySQL para PostgreSQL, precisa alterar UserService. Acoplamento alto.

```typescript
// Correto: serviço depende de interfaces
interface EmailService {
  send(to: string, message: string): Promise<void>;
}

interface Database {
  save(data: any): Promise<void>;
}

class UserService {
  constructor(
    private emailService: EmailService,
    private database: Database
  ) {}

  async register(user: User) {
    await this.database.save(user);
    await this.emailService.send(user.email, "Welcome!");
  }
}
```

Agora UserService não se importa com detalhes. Você injeta qualquer implementação de EmailService ou Database. Fácil de testar, fácil de trocar.

### Como Esses Princípios Se Conectam

SOLID não são regras arbitrárias. São diretrizes que emergem de um objetivo: escrever código que seja fácil de entender, testar, modificar e estender. Eles evitam armadilhas comuns:

- **Single Responsibility** evita that um change em um lugar quebrar 10 outros.
- **Open/Closed** permite crescimento sem reescrita.
- **Interface Segregation** previne que código fique sobrecarregado de abstrações desnecessárias.
- **Liskov Substitution** (que não detalhei, vem na Módulo 7) garante que subclasses sejam verdadeiramente substituíveis.
- **Dependency Inversion** reduz acoplamento e facilita testes.

### Trade-offs

SOLID é importante, mas não é dogma. Um script de uma linha não precisa de interfaces segregadas. Um MVP pode quebrar esses princípios propositalmente para sair rápido. Um sistema legado pode ter SOLID violado porque foi escrito antes disso ser conhecido.

O que importa é **reconhecer quando está violando** e tomar uma decisão consciente.

---

## SEÇÃO 4: PENSAMENTO EM SISTEMAS VS. FEATURES (8 minutos)

### A Diferença Crítica

**Mentalidade de Feature:** "Preciso adicionar um botão de redefinição de senha."

**Mentalidade de Sistema:** "Como a redefinição de senha se integra com autenticação, auditoria, notificação e recuperação de conta?"

### Exemplo Prático

Imagine uma plataforma educacional. Aluno está preso em um exercício e pede ajuda do tutor de IA.

#### Feature (Coder)

"Vou fazer uma chamada para OpenAI, pegar a resposta e mostrar na tela. Pronto, feito."

```javascript
async function getAIHelp(exerciseId) {
  const response = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: `Explique: ${exerciseId}`
  });
  
  return response.choices[0].text;
}
```

Funciona? Sim. Mas:

- E se a OpenAI cair? A aula inteira fica inutilizável.
- E se o usuário não tiver crédito? Você conhece quando o erro vai acontecer?
- E se a resposta levar 5 segundos? A interface fica congelada?
- Qual é o custo de cada chamada? Você está monitorando?
- Como você sabe quais exercícios os alunos pediam mais ajuda?
- A resposta da IA sempre é boa? Como medir qualidade?

#### Sistema (Engineer)

Você pensa em:

1. **Tolerância a Falhas:** Tutor cai, mas a aula continua. O aluno vê "Explicação não disponível agora."

2. **Custo e Quota:** Monitor de uso, limites por usuário, fila de requisições.

3. **Performance:** Explicações geradas em background, resultado é cacheado.

4. **Auditoria:** Cada interação com IA é registrada para análise.

5. **Qualidade:** Métricas de satisfação com explicações. Se muitos alunos marcam como "não entendi", você revisa prompts.

6. **Escalabilidade:** Hoje é OpenAI. Amanhã talvez Anthropic ou modelo local. A plataforma não pode estar presa a um provedor.

```typescript
// Arquivo: domain/models/ai-explanation.ts
export class AIExplanation {
  private exerciseId: string;
  private studentAnswer: string;
  private explanation: string;
  private confidenceScore: number;
  private timestamp: Date;

  constructor(
    exerciseId: string,
    studentAnswer: string,
    explanation: string,
    confidenceScore: number
  ) {
    this.exerciseId = exerciseId;
    this.studentAnswer = studentAnswer;
    this.explanation = explanation;
    this.confidenceScore = confidenceScore;
    this.timestamp = new Date();
  }

  isHighConfidence(): boolean {
    return this.confidenceScore > 0.8;
  }
}

// Arquivo: application/services/ai-tutor.service.ts
export class AiTutorService {
  constructor(
    private aiProvider: AiProvider,
    private explanationCache: ExplanationCache,
    private explanationRepository: ExplanationRepository,
    private quotaManager: QuotaManager,
    private eventBus: EventBus,
    private logger: Logger
  ) {}

  async explainError(context: {
    exerciseId: string;
    studentAnswer: string;
    expectedAnswer: string;
  }): Promise<AIExplanation | FallbackResponse> {
    try {
      // Valida quota do usuário
      if (!(await this.quotaManager.canRequestExplanation(context.userId))) {
        return {
          fallback: true,
          message: "Você atingiu o limite de explicações. Tente novamente mais tarde."
        };
      }

      // Tenta cache primeiro
      const cached = await this.explanationCache.get(context.exerciseId);
      if (cached && cached.isHighConfidence()) {
        this.logger.info("explanation_cache_hit", { exerciseId: context.exerciseId });
        return cached;
      }

      // Gera nova explicação
      const explanation = await this.aiProvider.explain({
        exerciseId: context.exerciseId,
        studentAnswer: context.studentAnswer,
        expectedAnswer: context.expectedAnswer
      });

      // Salva para futuros alunos
      await this.explanationCache.set(context.exerciseId, explanation);
      await this.explanationRepository.save(explanation);

      // Publica evento para análise
      this.eventBus.emit("ExplanationGenerated", {
        exerciseId: context.exerciseId,
        confidenceScore: explanation.confidenceScore
      });

      this.logger.info("explanation_generated", {
        exerciseId: context.exerciseId,
        confidence: explanation.confidenceScore
      });

      return explanation;
    } catch (error) {
      this.logger.error("ai_explanation_failed", {
        exerciseId: context.exerciseId,
        errorName: error.name
      });

      // Sempre retorna resposta segura
      return {
        fallback: true,
        message: "Não foi possível gerar uma explicação agora. Revise o conteúdo da aula ou peça ajuda a um instrutor."
      };
    }
  }
}

// Arquivo: infrastructure/ai-providers/ai-provider.interface.ts
export interface AiProvider {
  explain(context: ExplanationContext): Promise<AIExplanation>;
}

export class OpenAiProvider implements AiProvider {
  // Implementação com OpenAI
}

export class AnthropicProvider implements AiProvider {
  // Implementação com Anthropic
}

export class LocalLlamaProvider implements AiProvider {
  // Implementação com Llama local
}
```

Viu a diferença? O código "de sistema" é maior, mas:

- Suporta múltiplos provedores.
- Funciona mesmo se IA cair.
- Monitora custo e uso.
- Melhora continuamente com dados de qualidade.
- Fácil de testar cada componente isoladamente.
- Escala para 10 mil alunos ou 10 milhões.

### Padrão de Pensamento

Engineers aplicam esse padrão em quase tudo:

1. **Função Base:** O que preciso fazer de verdade?
2. **Falhas:** O que pode dar errado?
3. **Observabilidade:** Como vou saber que algo deu errado?
4. **Graceful Degradation:** Como continuar funcionando quando é errado?
5. **Escalabilidade:** Isso funciona em 10x o volume?
6. **Alterações Futuras:** Como adiciono um novo provedor/algoritmo/critério?

---

## SEÇÃO 5: QUALIDADE DE CÓDIGO COMO ARQUITETURA (5 minutos)

### Code Quality Não É Linting

Muitos pensam que "qualidade de código" é apenas:

- Sem linhas com mais de 80 caracteres.
- Sem variáveis com nomes estranhos.
- Espaçamento consistente.

Essas coisas importam, mas não são o cerne.

**Qualidade real é:** código que comunica intenção, isolava mudanças, e fácil de testar.

```typescript
// Código com bom linting, mas má qualidade
const x = (a: any[], b: any[]): number => {
  let c = 0;
  for (let i = 0; i < a.length; i++) {
    if (b.some(item => item.id === a[i].id)) {
      c++;
    }
  }
  return c / a.length;
};
```

Está bem formatado. Mas... o que faz? Só lendo a lógica sei que calcula quantos elementos de `a` estão em `b`. Mas não é óbvio por quê.

```typescript
// Mesmo algoritmo, qualidade real
function calculateCompletionRate(
  completedLessons: Lesson[],
  allLessonsInModule: Lesson[]
): number {
  if (allLessonsInModule.length === 0) return 0;

  const completedIds = new Set(completedLessons.map(l => l.id));
  const completedCount = allLessonsInModule.filter(l =>
    completedIds.has(l.id)
  ).length;

  return completedCount / allLessonsInModule.length;
}
```

Agora, ao ler o código, você sabe exatamente o que faz. O nome da função diz. Os nomes de variável dizem. O algoritmo é claro. E o código é testável: posso chamar com listas diferentes sem montar toda a plataforma.

### Débito Técnico É Real

Débito técnico é o custo de tomar atalhos hoje. Você economiza 2 horas de design agora, mas paga 10 horas de correção daqui a 3 meses.

```typescript
// Atalho: misturar responsabilidades
async function processUserRegistration(data) {
  // Valida
  if (!data.email || !data.password) throw new Error("Missing fields");
  
  // Calcula hash de senha
  const hash = await bcrypt.hash(data.password);
  
  // Salva no banco
  const user = await db.insert("users", { email: data.email, password: hash });
  
  // Envia e-mail
  await sendEmail(data.email, "Welcome!");
  
  // Registra em analytics
  await analytics.track("user_registered", { userId: user.id });
  
  // Publica em queue de messaging
  await messageQueue.publish("user.registered", user);
  
  return user;
}
```

Tudo em um lugar. Seis meses depois, alguém quer testar a validação sem banco, sem e-mail, sem analytics. Não consegue. Alguém quer trocar o provedor de e-mail. Precisa tocar essa função. Alguém quer adicionar logging. Idem.

Cada mudança é arriscada porque a função faz tudo.

```typescript
// Investimento: separação de responsabilidades
async function registerUser(
  input: RegisterUserInput,
  userService: UserService,
  emailService: EmailService,
  analyticsService: AnalyticsService
): Promise<User> {
  const validatedInput = validateRegistrationInput(input);
  const user = await userService.register(validatedInput);
  await emailService.sendWelcomeEmail(user);
  await analyticsService.trackUserRegistered(user);
  return user;
}
```

Maior? Sim. Mas agora cada serviço pode ser testado, trocado ou expandido sem afetar os outros. O "débito" de 30 minutos de design agora economiza horas depois.

### Engineers Investem em Qualidade Estrategicamente

Não significa fazer tudo perfeito (impossível e caro). Significa:

- **Alto risco, alta recompensa:** Investir em qualidade. Exemplo: autenticação, pagamento, cálculo de progresso.
- **Prototipagem:** Qualidade menor se for descartado em dias.
- **Monotonia:** Qualidade média para código estável e pouco tocado.

---

## SEÇÃO 6: EXERCÍCIO PRÁTICO (2 minutos)

### Desafio: Refatore Um Script Real

Você recebe este código de uma plataforma educacional. Ele calcula qual aula deve ser desbloqueada para um aluno depois de completar uma aula.

```javascript
// Versão "Coder": Funciona, mas problemático
function unlockNextLesson(userId, completedLessonId) {
  const lesson = db.query(`
    SELECT * FROM lessons WHERE id = '${completedLessonId}'
  `)[0];

  const nextLesson = db.query(`
    SELECT * FROM lessons WHERE module_id = '${lesson.module_id}' 
    AND order > ${lesson.order}
    LIMIT 1
  `)[0];

  if (nextLesson) {
    db.query(`
      UPDATE lessons_unlocked 
      SET unlocked = 1 
      WHERE user_id = '${userId}' AND lesson_id = '${nextLesson.id}'
    `);
    
    sendSlackNotification(`User ${userId} unlocked lesson ${nextLesson.id}`);
    return { success: true, unlockedLessonId: nextLesson.id };
  }

  // Verifica se chegou ao final e desbloqueia próximo módulo
  const nextModule = db.query(`
    SELECT * FROM modules WHERE order > ${lesson.module_id}
    LIMIT 1
  `)[0];

  if (nextModule) {
    const firstLesson = db.query(`
      SELECT * FROM lessons WHERE module_id = '${nextModule.id}'
      ORDER BY order ASC LIMIT 1
    `)[0];

    db.query(`
      UPDATE lessons_unlocked 
      SET unlocked = 1 
      WHERE user_id = '${userId}' AND lesson_id = '${firstLesson.id}'
    `);
    
    sendSlackNotification(`User ${userId} unlocked module ${nextModule.id}`);
    return { success: true, unlockedLessonId: firstLesson.id };
  }

  return { success: false, message: "No more lessons" };
}
```

#### Problemas Identificáveis

1. SQL injection (concatenação de strings).
2. Lógica de negócio (regras de desbloqueio) misturada com persistência.
3. Sem validação de entrada.
4. Sem tratamento de erro.
5. Sideeffect (Slack) dentro de função que deveria ser pura.
6. Impossível de testar sem banco de dados.
7. Impossível de reutilizar lógica em outros contextos (API, batch, etc.).

#### Gabarito Refatorado

```typescript
// Arquivo: domain/models/curriculum-progress.ts
export class CurriculumProgress {
  private userId: string;
  private completedLessonIds: Set<string>;
  private lessonTree: LessonTree;

  constructor(
    userId: string,
    completedLessonIds: string[],
    lessonTree: LessonTree
  ) {
    this.userId = userId;
    this.completedLessonIds = new Set(completedLessonIds);
    this.lessonTree = lessonTree;
  }

  getNextUnlockedLesson(justCompletedLessonId: string): string | null {
    const lesson = this.lessonTree.findLesson(justCompletedLessonId);
    if (!lesson) return null;

    // Tenta próxima aula do mesmo módulo
    const nextInModule = this.lessonTree.findNextInModule(
      lesson.moduleId,
      lesson.order
    );
    if (nextInModule) return nextInModule.id;

    // Tenta primeiro aula do próximo módulo
    const nextModule = this.lessonTree.findNextModule(lesson.moduleId);
    if (nextModule) {
      const firstLesson = this.lessonTree.findFirstLessonInModule(nextModule.id);
      return firstLesson?.id ?? null;
    }

    return null;
  }

  isLessonUnlocked(lessonId: string): boolean {
    return this.completedLessonIds.has(lessonId);
  }
}

// Arquivo: application/services/lesson-progression.service.ts
export class LessonProgressionService {
  constructor(
    private lessonRepository: LessonRepository,
    private progressRepository: ProgressRepository,
    private curriculumService: CurriculumService,
    private eventBus: EventBus,
    private logger: Logger
  ) {}

  async unlockNextLessonAfterCompletion(
    userId: string,
    completedLessonId: string
  ): Promise<UnlockResult> {
    // Validação
    if (!userId || !completedLessonId) {
      throw new ValidationError("userId e completedLessonId são obrigatórios");
    }

    try {
      // Busca dados
      const lesson = await this.lessonRepository.findById(completedLessonId);
      if (!lesson) {
        throw new NotFoundError(`Lição ${completedLessonId} não existe`);
      }

      const progress = await this.progressRepository.getProgressForUser(userId);
      const curriculum = await this.curriculumService.getCurriculum();

      // Aplica lógica de negócio (isolada em domain model)
      const curriculumProgress = new CurriculumProgress(
        userId,
        Array.from(progress.completedLessons),
        curriculum
      );

      const nextLessonId = curriculumProgress.getNextUnlockedLesson(
        completedLessonId
      );

      // Persiste se houver próxima aula
      if (nextLessonId) {
        progress.unlockLesson(nextLessonId);
        await this.progressRepository.save(progress);

        // Publica evento (deixa para outros sistemas reagirem)
        this.eventBus.emit("LessonUnlocked", {
          userId,
          lessonId: nextLessonId,
          triggerBy: completedLessonId
        });

        this.logger.info("lesson_unlocked", {
          userId,
          lessonId: nextLessonId
        });

        return {
          success: true,
          unlockedLessonId: nextLessonId
        };
      }

      this.logger.info("no_more_lessons", { userId });
      return {
        success: false,
        message: "Parabéns! Você completou todos os cursos."
      };
    } catch (error) {
      this.logger.error("lesson_progression_failed", {
        userId,
        completedLessonId,
        errorName: error.name
      });
      throw error;
    }
  }
}

// Arquivo: tests/curriculum-progress.spec.ts
describe("CurriculumProgress", () => {
  it("should return next lesson in same module", () => {
    const lessonTree = buildTestLessonTree();
    const progress = new CurriculumProgress("user1", ["l1"], lessonTree);

    const next = progress.getNextUnlockedLesson("l1");

    expect(next).toBe("l2"); // Próxima no mesmo módulo
  });

  it("should return first lesson of next module when module is complete", () => {
    const lessonTree = buildTestLessonTree(); // 2 módulos
    const progress = new CurriculumProgress("user1", ["l1", "l2"], lessonTree);

    const next = progress.getNextUnlockedLesson("l2"); // Última do módulo 1

    expect(next).toBe("m2-l1"); // Primeira do módulo 2
  });

  it("should return null when curriculum is complete", () => {
    const lessonTree = buildTestLessonTree();
    const progress = new CurriculumProgress("user1", ["l1", "l2", "m2-l1", "m2-l2"], lessonTree);

    const next = progress.getNextUnlockedLesson("m2-l2");

    expect(next).toBeNull();
  });
});
```

#### Melhorias

- ✅ SQL injection eliminado (ORM + prepared statements).
- ✅ Lógica isolada em `CurriculumProgress` (testável).
- ✅ Validação clara.
- ✅ Tratamento de erro estruturado.
- ✅ Evento publicado (Slack pode escutar, não está acoplado).
- ✅ Testes unitários da lógica sem banco.
- ✅ Fácil adicionar regras (aulas opcionais, ramificações, pré-requisitos).

---

## QUIZ: 5 Perguntas para Consolidar

### Pergunta 1: Diferença Fundamental

**Qual é a diferença fundamental entre a pergunta de um coder e a de um engineer?**

A) Coders usam linguagens mais simples.  
B) Coders perguntam "como funciona?" enquanto engineers perguntam "como funciona, escala e persiste?"  
C) Engineers ganham mais dinheiro.  
D) Engineers não precisam testar.

**Resposta Correta:** B  
**Explicação:** Um coder foca em fazer a coisa funcionar. Um engineer pensa em escalabilidade, manutenibilidade, testabilidade e confiabilidade junto.

---

### Pergunta 2: Single Responsibility

**Por que o princípio de Responsabilidade Única é importante?**

A) Porque reduz o número de linhas de código.  
B) Porque faz o código mais bonito visualmente.  
C) Porque cada classe muda por uma razão, reduzindo risco de quebra.  
D) Porque é obrigatório por lei.

**Resposta Correta:** C  
**Explicação:** Quando uma classe tem múltiplas razões para mudar, qualquer mudança em uma afeta a outra, aumentando risco.

---

### Pergunta 3: Pensamento em Sistemas

**No exemplo do tutor de IA, qual é a diferença crítica entre a abordagem "feature" e a de "sistema"?**

A) A de sistema usa mais código.  
B) A de sistema pensa em falhas, observabilidade, quota, cache e múltiplos provedores.  
C) A de sistema é mais lenta.  
D) Não há diferença real.

**Resposta Correta:** B  
**Explicação:** Abordagem de sistema considera tudo que pode dar errado e como o sistema evolui. Feature apenas resolve hoje.

---

### Pergunta 4: Débito Técnico

**O que é débito técnico?**

A) Dinheiro que você deve ao seu chefe.  
B) O custo de tomar atalhos hoje que será pago com juros mais tarde em forma de correções.  
C) Um conceito que não existe.  
D) Algo que só afeta startups.

**Resposta Correta:** B  
**Explicação:** Débito técnico é a dívida técnica. Você economiza tempo agora, mas paga caro depois.

---

### Pergunta 5: Code Quality vs. Linting

**Por que um código com bom linting pode ter má qualidade?**

A) Porque linting não verifica se o código faz o que deveria.  
B) Porque linting é menos importante que testes.  
C) Porque linting apenas formata; qualidade é sobre comunicação, isolamento e testabilidade.  
D) Linting garante qualidade total.

**Resposta Correta:** C  
**Explicação:** Linting formata. Qualidade é arquitetura, clareza, isolamento e facilidade de mudança.

---

## EXERCÍCIO FINAL: Refatore Seu Próprio Código

### Desafio

Traga um código seu (ou de um projeto que você trabalhou) que:

1. Funciona.
2. Mas é difícil de entender.
3. Ou é difícil de testar.
4. Ou quebra facilmente quando muda.

Aplique ao menos três princípios deste curso:

- Separe responsabilidades.
- Elimine acoplamento.
- Valide entrada.
- Trate erros com segurança.
- Isolae lógica de negócio de persistência.

**Entregáveis esperados:**

1. Código original com comentários dos problemas.
2. Código refatorado.
3. Explicação breve (3-5 linhas) de como cada princípio foi aplicado.
4. Um teste unitário do código refatorado.

**Avaliação:**

- Responsabilidades realmente separadas?
- Reduz risco de mudanças futuras?
- Fica mais fácil de testar?
- Nomes comunicam intenção?

---

## RESUMO E PRÓXIMOS PASSOS

Nesta aula, você aprendeu:

1. **A diferença entre coder e engineer** não é experiência ou salário; é mentalidade.
2. **Engineers pensam em escalabilidade, confiabilidade e manutenibilidade** ao tomar decisões.
3. **SOLID é um framework** que ajuda a manter código flexível (detalhes na Módulo 7).
4. **Pensamento em sistemas** significa considerar falhas, observabilidade e evolução.
5. **Qualidade de código** é sobre isolamento, clareza e testabilidade.
6. **Débito técnico é real** e paga-se com juros; invista em qualidade estrategicamente.

A próxima aula (Lição 1.2) vai aprofundar em **Arquitetura de Sistemas**, mostrando como estruturar uma aplicação real. Você verá como as ideias desta aula se manifestam em decisões concretas de design.

**Mentalidade é o passo número um. Prática é o passo número dois. Ambos levam tempo.**

Bem-vindo ao mundo da engenharia de software.
