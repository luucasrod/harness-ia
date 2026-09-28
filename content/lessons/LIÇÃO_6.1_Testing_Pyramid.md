# LIÇÃO 6.1: Testing Pyramid - A Estratégia Fundamental

**Duração:** 200 minutos (3h 20min)  
**Nível:** Intermediário  
**Foco:** Por que testar, como pensar estrategicamente sobre testes  
**Público-alvo:** Engenheiros que querem qualidade escalável

---

## ÍNDICE
1. [O Mito dos Testes](#seção-1-o-mito-dos-testes-20-min)
2. [A Pirâmide de Testes Explicada](#seção-2-a-pirâmide-de-testes-explicada-30-min)
3. [Unit Tests: Rápidos e Isolados](#seção-3-unit-tests-rápidos-e-isolados-40-min)
4. [Integration Tests: Você Precisa Deles](#seção-4-integration-tests-você-precisa-deles-40-min)
5. [E2E Tests: A Parte Cara](#seção-5-e2e-tests-a-parte-cara-30-min)
6. [Arquitetura Testável](#seção-6-arquitetura-testável-20-min)
7. [Quiz & Exercício Prático](#quiz--exercício-prático)

---

## Seção 1: O Mito dos Testes (20 min)

### O Problema Real

Muitos times começam com entusiasmo: "Vamos ter 100% de cobertura de testes!". Seis meses depois, descobrem que:

- Testes levam 45 minutos para rodar
- Qualquer mudança quebra 50 testes
- Novos testes são escritos contra código ruim
- Cobertura é alta, mas bugs continuam chegando em produção

Isso não é culpa dos testes. É culpa de **estratégia errada**.

### A Verdade Sobre Testes

**Fato 1:** Nem todo código precisa ser testado da mesma forma  
**Fato 2:** Testes são código — desvio técnico é possível  
**Fato 3:** Testes lentos matam valor mais rápido que bugs  
**Fato 4:** 100% cobertura ≠ 100% confiança  

Um teste que valida que `2 + 2 = 4` é cobertura. Mas um teste que valida que o débito de um cliente foi processado corretamente é valor.

### O Paradoxo da Qualidade

A maioria dos times tenta alcançar qualidade testando TUDO intensamente. O resultado:

```
Tempo de desenvolvimento   ████████ (alto)
Velocidade de entrega     ██ (baixa)
Quebra de testes          ███████ (frequente)
Confiança em produção     ███ (baixa!)
```

Times que alcançam qualidade de verdade fazem o oposto:

```
Tempo de desenvolvimento   ██████ (moderado)
Velocidade de entrega     ████████ (alta)
Quebra de testes          ██ (raro)
Confiança em produção     ████████ (alta!)
```

Como? **Estratégia de testes alinhada com risco.**

---

## Seção 2: A Pirâmide de Testes Explicada (30 min)

### O Conceito Original (Mike Cohn)

```
           /\
          /  \
         / E2E \  5-10% do tempo
        /______\
       /        \
      / Integration\ 20-30% do tempo
     /____________\
    /              \
   /  Unit Tests    \ 60-70% do tempo
  /________________\
```

Mas essa pirâmide é enganosa. Vamos entender por quê.

### A Verdade: Pirâmide vs. Seus Testes Reais

**Pirâmide Teórica (o que os livros dizem):**

- Unit tests: rápidos, isolados, muitos
- Integration tests: moderados, alguns
- E2E tests: lentos, poucos

**Pirâmide Real (o que funciona):**

```
         E2E
     ╱────────╲
    ╱  Critical ╲  ← Apenas fluxos críticos
   ╱    Paths    ╲     (~5-10% do tempo)
  ╱────────────────╲
 ╱  Integration     ╲  ← Pontos de falha
╱    Boundaries      ╲   (20-30% do tempo)
╱──────────────────────╲
│  Lógica de Negócio   │  ← Onde bugs moram
│  Unit Tests          │   (50-70% do tempo)
│  (Bem Testada)       │
└──────────────────────┘
```

### Por Que Unit Tests Primeiro?

**Exemplo: Sistema de Cálculo de Juros em uma Plataforma de Crédito**

#### ❌ Abordagem Errada: Testar via E2E

```javascript
// Test: "Usuário pega empréstimo com juros"
test("User borrows 1000 with 5% monthly interest", async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Login
  await page.goto("https://app.com/login");
  await page.fill("#email", "user@test.com");
  await page.fill("#password", "pass123");
  await page.click("#submit");
  
  // Navega para empréstimos
  await page.click("a[href='/loans']");
  await page.waitForSelector("#loans-list");
  
  // Clica em "novo empréstimo"
  await page.click("#new-loan");
  
  // Preenche valores
  await page.fill("#loan-amount", "1000");
  await page.fill("#interest-rate", "5");
  await page.click("#submit");
  
  // Espera resultado
  await page.waitForSelector("#success-message");
  
  // Valida número de juros (isso é o que realmente importa!)
  const interestAmount = await page.textContent("#total-interest");
  expect(interestAmount).toBe("50"); // 1000 * 0.05
  
  await browser.close();
});
```

**Problemas:**
- Teste leva 15 segundos
- Precisa de usuário real no banco de dados
- Se login quebrar, você não sabe se cálculo está certo
- Precisa de banco de dados rodando
- Flaky (intermitente)

#### ✅ Abordagem Correta: Unit Test + E2E Crítico

```typescript
// Arquivo: domain/models/loan-calculator.ts
export class LoanCalculator {
  calculateMonthlyInterest(principal: number, annualRate: number): number {
    if (principal <= 0) {
      throw new ValidationError("Principal must be positive");
    }
    if (annualRate < 0 || annualRate > 100) {
      throw new ValidationError("Rate must be 0-100%");
    }
    
    const monthlyRate = annualRate / 12 / 100;
    return principal * monthlyRate;
  }
  
  calculateTotalInterest(
    principal: number,
    annualRate: number,
    months: number
  ): number {
    let total = 0;
    for (let i = 1; i <= months; i++) {
      total += this.calculateMonthlyInterest(principal, annualRate);
    }
    return total;
  }
}

// Arquivo: __tests__/loan-calculator.test.ts
describe("LoanCalculator", () => {
  let calculator: LoanCalculator;
  
  beforeEach(() => {
    calculator = new LoanCalculator();
  });
  
  describe("calculateMonthlyInterest", () => {
    test("calculates interest correctly for 1000 at 5%", () => {
      const result = calculator.calculateMonthlyInterest(1000, 5);
      expect(result).toBeCloseTo(4.17, 1); // 1000 * (5/12/100)
    });
    
    test("returns 0 for 0% rate", () => {
      expect(calculator.calculateMonthlyInterest(1000, 0)).toBe(0);
    });
    
    test("throws on negative principal", () => {
      expect(() => {
        calculator.calculateMonthlyInterest(-1000, 5);
      }).toThrow(ValidationError);
    });
    
    test("throws on invalid rate", () => {
      expect(() => {
        calculator.calculateMonthlyInterest(1000, 150);
      }).toThrow(ValidationError);
    });
  });
  
  describe("calculateTotalInterest", () => {
    test("calculates 12-month total correctly", () => {
      // 1000 at 5% = ~50 total
      const result = calculator.calculateTotalInterest(1000, 5, 12);
      expect(result).toBeCloseTo(50, 0);
    });
    
    test("handles edge case: 1 month", () => {
      const result = calculator.calculateTotalInterest(1000, 5, 1);
      expect(result).toBeCloseTo(4.17, 1);
    });
  });
});

// Arquivo: __tests__/e2e/loan-flow.e2e.test.ts
describe("Loan E2E - Critical Path", () => {
  test("User can complete loan application and see correct interest", async () => {
    // Apenas testa o fluxo crítico: login → formulário → resultado
    // A lógica de cálculo já foi testada em unit tests
    
    await page.goto("https://app.com/loans/apply");
    await page.fill("#amount", "1000");
    await page.fill("#rate", "5");
    await page.click("#submit");
    
    const interest = await page.textContent("#interest");
    expect(interest).toContain("50"); // Confia que o cálculo está certo
  });
});
```

**Benefícios:**
- Unit tests rodam em 50ms
- E2E testa apenas a integração
- Se calcular errado, unit test falha imediatamente
- Se UI quebrar, E2E falha
- Cada teste tem responsabilidade clara

---

## Seção 3: Unit Tests - Rápidos e Isolados (40 min)

### Características de um Bom Unit Test

1. **Isolado:** Testa uma função, não suas dependências
2. **Rápido:** Roda em < 10ms
3. **Determinístico:** Sempre passa ou sempre falha
4. **Claro:** Nome descreve o caso testado

### Exemplo Real: Sistema de Progressão de Aluno

```typescript
// Arquivo: domain/models/student-progress.ts
export class StudentProgress {
  private totalLessons: number;
  private completedLessons: Set<string>;
  private passedQuizzes: Map<string, number>; // lessonId -> score
  
  constructor(totalLessons: number) {
    this.totalLessons = totalLessons;
    this.completedLessons = new Set();
    this.passedQuizzes = new Map();
  }
  
  completeLesson(lessonId: string): void {
    this.completedLessons.add(lessonId);
  }
  
  recordQuizScore(lessonId: string, score: number): void {
    if (score < 0 || score > 100) {
      throw new ValidationError("Score must be 0-100");
    }
    this.passedQuizzes.set(lessonId, score);
  }
  
  getProgressPercentage(): number {
    if (this.totalLessons === 0) return 0;
    return (this.completedLessons.size / this.totalLessons) * 100;
  }
  
  getAverageQuizScore(): number {
    if (this.passedQuizzes.size === 0) return 0;
    const sum = Array.from(this.passedQuizzes.values()).reduce(
      (a, b) => a + b,
      0
    );
    return sum / this.passedQuizzes.size;
  }
  
  isModuleComplete(): boolean {
    // Completo se passou 80% das lições
    return this.getProgressPercentage() >= 80;
  }
}

// Arquivo: __tests__/student-progress.test.ts
describe("StudentProgress", () => {
  describe("Progress Tracking", () => {
    test("calculates progress percentage correctly", () => {
      const progress = new StudentProgress(10);
      
      progress.completeLesson("lesson-1");
      expect(progress.getProgressPercentage()).toBe(10);
      
      progress.completeLesson("lesson-2");
      expect(progress.getProgressPercentage()).toBe(20);
      
      for (let i = 3; i <= 10; i++) {
        progress.completeLesson(`lesson-${i}`);
      }
      expect(progress.getProgressPercentage()).toBe(100);
    });
    
    test("handles 0 total lessons", () => {
      const progress = new StudentProgress(0);
      expect(progress.getProgressPercentage()).toBe(0);
    });
  });
  
  describe("Quiz Scoring", () => {
    test("records quiz scores and calculates average", () => {
      const progress = new StudentProgress(3);
      
      progress.recordQuizScore("lesson-1", 80);
      progress.recordQuizScore("lesson-2", 90);
      progress.recordQuizScore("lesson-3", 70);
      
      expect(progress.getAverageQuizScore()).toBeCloseTo(80, 0);
    });
    
    test("throws on invalid score", () => {
      const progress = new StudentProgress(1);
      
      expect(() => {
        progress.recordQuizScore("lesson-1", 150);
      }).toThrow(ValidationError);
      
      expect(() => {
        progress.recordQuizScore("lesson-1", -10);
      }).toThrow(ValidationError);
    });
  });
  
  describe("Module Completion", () => {
    test("module is complete at 80% progress", () => {
      const progress = new StudentProgress(10);
      
      // Completa 7 lições = 70%
      for (let i = 1; i <= 7; i++) {
        progress.completeLesson(`lesson-${i}`);
      }
      expect(progress.isModuleComplete()).toBe(false);
      
      // Completa 8ª = 80%
      progress.completeLesson("lesson-8");
      expect(progress.isModuleComplete()).toBe(true);
    });
  });
});
```

### Padrão AAA: Arrange, Act, Assert

Cada test segue este padrão:

```typescript
test("example", () => {
  // Arrange: preparar dados
  const student = new StudentProgress(10);
  
  // Act: executar a ação
  student.completeLesson("lesson-1");
  
  // Assert: verificar resultado
  expect(student.getProgressPercentage()).toBe(10);
});
```

---

## Seção 4: Integration Tests - Você Precisa Deles (40 min)

### O Limite do Unit Test

Unit tests testam uma função em isolamento. Mas na vida real:

- Seu código chamará um banco de dados
- Processará resposta de uma API
- Salvará em cache
- Enviará eventos

Se testar tudo em unit tests usando mocks, acaba criando "testes que passam mas o código falha". É chamado de "mockery".

### Exemplo: Serviço de Registro de Aluno

```typescript
// Arquivo: application/services/student-registration.service.ts
export class StudentRegistrationService {
  constructor(
    private studentRepository: StudentRepository,
    private emailService: EmailService,
    private logger: Logger
  ) {}
  
  async registerStudent(
    email: string,
    name: string
  ): Promise<Student> {
    // Validação
    if (!email || !name) {
      throw new ValidationError("Email and name required");
    }
    
    // Verifica duplicata
    const existing = await this.studentRepository.findByEmail(email);
    if (existing) {
      throw new DuplicateError(`Email ${email} already registered`);
    }
    
    // Cria usuário
    const student = new Student(email, name);
    const saved = await this.studentRepository.save(student);
    
    // Envia email
    try {
      await this.emailService.sendWelcome(email, name);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${email}`, error);
      // Não falha o registro se email falhar
    }
    
    return saved;
  }
}

// ❌ ERRADO: Unit test com mocks (falsamente verde)
describe("StudentRegistrationService - WRONG", () => {
  test("registers student and sends email", async () => {
    const mockRepository = {
      findByEmail: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockResolvedValue({ id: "1", email: "test@test.com" })
    };
    
    const mockEmailService = {
      sendWelcome: jest.fn().mockResolvedValue(void 0)
    };
    
    const service = new StudentRegistrationService(
      mockRepository as any,
      mockEmailService as any,
      console as any
    );
    
    const result = await service.registerStudent("test@test.com", "Test User");
    
    // Testes passam, mas nunca validaram banco de dados de verdade
    expect(mockRepository.save).toHaveBeenCalled();
    expect(mockEmailService.sendWelcome).toHaveBeenCalled();
  });
});

// ✅ CORRETO: Integration test (valida comportamento real)
describe("StudentRegistrationService - Integration", () => {
  let service: StudentRegistrationService;
  let studentRepository: StudentRepository;
  let emailService: EmailService;
  
  beforeEach(async () => {
    // Usa banco de dados de teste real
    studentRepository = new PostgresStudentRepository(testDb);
    emailService = new MockEmailService(); // Mock apenas de serviço externo
    
    service = new StudentRegistrationService(
      studentRepository,
      emailService,
      logger
    );
  });
  
  test("successfully registers new student", async () => {
    const result = await service.registerStudent(
      "new@test.com",
      "New Student"
    );
    
    // Valida que foi salvo no banco
    expect(result.id).toBeDefined();
    
    // Valida que pode recuperar do banco
    const saved = await studentRepository.findByEmail("new@test.com");
    expect(saved).toBeDefined();
    expect(saved.name).toBe("New Student");
  });
  
  test("rejects duplicate email", async () => {
    // Registra primeira vez
    await service.registerStudent("dup@test.com", "User 1");
    
    // Tenta registrar novamente
    await expect(
      service.registerStudent("dup@test.com", "User 2")
    ).rejects.toThrow(DuplicateError);
    
    // Valida que apenas uma versão existe no banco
    const all = await studentRepository.findAllByEmail("dup@test.com");
    expect(all).toHaveLength(1);
  });
  
  test("sends welcome email after registration", async () => {
    await service.registerStudent("email@test.com", "Test");
    
    // Valida que email foi enviado
    expect(emailService.sentEmails).toContainEqual(
      expect.objectContaining({
        to: "email@test.com"
      })
    );
  });
  
  test("registers student even if email fails", async () => {
    emailService.simulateFailure = true;
    
    // Mesmo com falha, registra
    const result = await service.registerStudent("test@test.com", "Test");
    expect(result.id).toBeDefined();
    
    // Valida que foi salvo
    const saved = await studentRepository.findByEmail("test@test.com");
    expect(saved).toBeDefined();
  });
});
```

### Quando Usar Mock em Integration Tests

Restrinja mocks para:
- **APIs externas** (que você não controla)
- **Serviços pagos** (SMS, envio de emails)
- **Dependências instáveis** (que não têm test doubles)

Nunca mocke:
- Seu próprio banco de dados
- Sua própria lógica de negócio
- Cache que você controla

---

## Seção 5: E2E Tests - A Parte Cara (30 min)

### A Realidade dos E2E Tests

```
Custo de desenvolvimento   ████ (moderado)
Tempo para rodar          ███████████ (alto!)
Flakiness (variabilidade) ███████ (comum)
Valor entregue            ████ (crítico, mas limitado)
```

**E2E tests NÃO são:**
- Um substituto para unit tests
- Uma forma de testar regras de negócio complexas
- Um jeito de validar cálculos matemáticos

**E2E tests SÃO:**
- Validação de que fluxo crítico funciona ponta-a-ponta
- Teste de integração com o browser real
- Seguro contra regressões em UI

### Exemplo: Fluxo de Login

```typescript
// Arquivo: __tests__/e2e/login.e2e.test.ts
import { test, expect } from "@playwright/test";

describe("Login E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000/login");
  });
  
  test("User can login with valid credentials", async ({ page }) => {
    // Preenche formulário
    await page.fill("#email", "student@test.com");
    await page.fill("#password", "ValidPass123!");
    
    // Submete
    await page.click("#submit");
    
    // Espera redirecionamento
    await page.waitForURL("http://localhost:3000/dashboard");
    
    // Valida conteúdo
    const welcome = await page.textContent("h1");
    expect(welcome).toContain("Welcome");
  });
  
  test("Shows error on invalid credentials", async ({ page }) => {
    await page.fill("#email", "student@test.com");
    await page.fill("#password", "WrongPassword");
    await page.click("#submit");
    
    // Valida mensagem de erro
    const error = await page.textContent(".error-message");
    expect(error).toContain("Invalid credentials");
  });
  
  test("Navigates to signup from login page", async ({ page }) => {
    await page.click("a:text('Sign up')");
    await page.waitForURL("http://localhost:3000/signup");
  });
});
```

### O Que NÃO Testar em E2E

```typescript
// ❌ ERRADO: Testar validação de email via E2E
test("Email field requires valid format", async ({ page }) => {
  await page.fill("#email", "invalid-email");
  await page.click("#submit");
  // ... wait for error ...
});

// ✅ CORRETO: Testar validação via unit test
test("Email validator rejects invalid format", () => {
  expect(validateEmail("invalid-email")).toBe(false);
  expect(validateEmail("valid@test.com")).toBe(true);
});
```

---

## Seção 6: Arquitetura Testável (20 min)

### O Problema: Código Não-Testável

```typescript
// ❌ Difícil de testar
export class OrderProcessor {
  processOrder(orderId: string) {
    const db = new Database(); // Cria sua própria dependência
    const order = db.query(`SELECT * FROM orders WHERE id = ${orderId}`);
    
    const stripe = new Stripe(); // Cria sua própria dependência
    const result = stripe.charge(order.amount); // Acessa API real
    
    if (result.success) {
      db.query(`UPDATE orders SET status = 'paid'`);
      return { status: "success" };
    }
  }
}
```

Por quê é difícil testar?
- Não pode mockar banco de dados
- Não pode mockar Stripe
- Não pode testar isoladamente

### A Solução: Dependency Injection

```typescript
// ✅ Fácil de testar
export class OrderProcessor {
  constructor(
    private db: Database,
    private stripe: StripeService
  ) {}
  
  async processOrder(orderId: string): Promise<ProcessResult> {
    const order = await this.db.findOrderById(orderId);
    const result = await this.stripe.charge(order.amount);
    
    if (result.success) {
      await this.db.updateOrderStatus(orderId, "paid");
    }
    
    return result;
  }
}

// Teste unitário
const mockDb = {
  findOrderById: jest.fn().mockResolvedValue({ amount: 100 }),
  updateOrderStatus: jest.fn()
};

const mockStripe = {
  charge: jest.fn().mockResolvedValue({ success: true })
};

const processor = new OrderProcessor(mockDb as any, mockStripe as any);

test("processes order successfully", async () => {
  const result = await processor.processOrder("order-1");
  
  expect(result.success).toBe(true);
  expect(mockDb.updateOrderStatus).toHaveBeenCalledWith("order-1", "paid");
});
```

---

## Quiz & Exercício Prático

### Questão 1: Conceitual (Escolha Múltipla)
Qual é a proposta principal da Pirâmide de Testes?

a) Ter 100% de cobertura de código  
b) Priorizar testes de unidade, depois integração, depois E2E  
c) Testar tudo via E2E para máxima confiança  
d) Não precisa testar, confia em QA manual  

**Resposta:** b)

---

### Questão 2: Análise de Código
Você recebe este teste. O que está errado?

```typescript
test("calculates total price correctly", async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto("https://shop.com");
  await page.fill("#item-count", "5");
  await page.click("#add-to-cart");
  
  const total = await page.textContent("#total-price");
  expect(total).toContain("$50");
});
```

**Resposta:** Testa lógica de cálculo via E2E. Deveria ter:
1. Unit test para função de cálculo (rápido, isolado)
2. E2E test apenas para verificar que UI mostra resultado (não calcula)

---

### Questão 3: Verdadeiro/Falso
"Se meus unit tests passam 100%, posso garantir que código funciona em produção."

**Resposta:** Falso. Unit tests não validam:
- Integrações com banco de dados
- Fluxos reais do usuário
- Problemas de timing ou concorrência

---

### Questão 4: Aplicação Prática
Você tem uma função que calcula desconto em carrinho de compras:

```typescript
function calculateDiscount(items: Item[], coupon: Coupon): number {
  // ... cálculo complexo ...
  return discountAmount;
}
```

Como você testaria isso?

**Resposta:** Via unit test:
- Teste casos normais (desconto válido)
- Teste edge cases (desconto 0%, desconto máximo)
- Teste erros (cupom expirado, inválido)
- Teste combinações (múltiplos itens, múltiplos cupons)

---

### Questão 5: Cenário Real
Seu time está tendo problemas com testes flaky (intermitentes). Qual é a causa mais comum?

a) Não há bastantes E2E tests  
b) Testes dependem de timing, estado compartilhado ou ordem de execução  
c) Precisa usar mais mocks  
d) Precisa aumentar cobertura para 100%  

**Resposta:** b) - Testes flaky geralmente dependem de estado compartilhado. Solução: isolamento, fixtures limpas, sem dependências de timing.

---

### Exercício Prático: Arquitetura Testável

**Objetivo:** Refatorar código não-testável para testável

**Código Inicial (Não-Testável):**

```typescript
export class LessonCompletionHandler {
  completeLesson(userId: string, lessonId: string) {
    // Cria suas próprias dependências
    const db = new Database();
    const logger = console;
    
    const lesson = db.query(
      `SELECT * FROM lessons WHERE id = '${lessonId}'`
    );
    const user = db.query(`SELECT * FROM users WHERE id = '${userId}'`);
    
    // Validação misturada com lógica
    if (!user) {
      logger.error("User not found");
      return { error: "User not found" };
    }
    
    // Atualização misturada com business logic
    db.query(
      `INSERT INTO completion (user_id, lesson_id) VALUES ('${userId}', '${lessonId}')`
    );
    
    // Cálculo de progresso
    const total = db.query("SELECT COUNT(*) FROM lessons").count;
    const completed = db.query(
      `SELECT COUNT(*) FROM completion WHERE user_id = '${userId}'`
    ).count;
    
    const percentage = (completed / total) * 100;
    
    db.query(
      `UPDATE users SET progress = ${percentage} WHERE id = '${userId}'`
    );
    
    return { status: "success", progress: percentage };
  }
}
```

**Seu Desafio:**

1. Separe Business Logic em domínio (classes com regras de negócio puro)
2. Separe Application Logic em serviço (orquestra dependências)
3. Use Dependency Injection
4. Escreva testes para cada camada

**Estrutura Esperada:**

```typescript
// domain/models/lesson-completion.ts
export class LessonCompletion {
  // lógica pura de negócio
}

// application/services/lesson-completion.service.ts
export class LessonCompletionService {
  constructor(private db: Database, private logger: Logger) {}
  // orquestra repositórios
}

// __tests__/domain/lesson-completion.test.ts
// unit tests sem banco de dados

// __tests__/application/lesson-completion.integration.test.ts
// integration tests com banco
```

**Resultado Esperado após refatoração:**
- Unit tests rodam em < 100ms
- Sem SQL injection vulnerabilities
- Lógica de negócio pode ser testada sem banco de dados
- Fácil adicionar novos requisitos

---

**Tempo Total:** 200 minutos  
**Próxima Lição:** 6.2 - Jest Unit Testing (Prático)
