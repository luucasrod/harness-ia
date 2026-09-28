# LIÇÃO 6.2: Jest Unit Testing - Da Teoria à Prática

**Duração:** 200 minutos (3h 20min)  
**Nível:** Intermediário-Avançado  
**Foco:** Jest em profundidade, padrões reais de testing  
**Público-alvo:** Engenheiros que querem escrever testes efetivos

---

## ÍNDICE
1. [Setup e Configuração](#seção-1-setup-e-configuração-20-min)
2. [Matchers e Assertions](#seção-2-matchers-e-assertions-30-min)
3. [Mocks, Stubs e Spies](#seção-3-mocks-stubs-e-spies-40-min)
4. [Estrutura AAA e Fixtures](#seção-4-estrutura-aaa-e-fixtures-30-min)
5. [Testing Async Code](#seção-5-testing-async-code-30-min)
6. [Snapshot Tests e Pitfalls](#seção-6-snapshot-tests-e-pitfalls-20-min)
7. [Quiz & Exercício Prático](#quiz--exercício-prático)

---

## Seção 1: Setup e Configuração (20 min)

### Instalação Básica

```bash
npm install --save-dev jest @types/jest ts-jest typescript
```

### Jest Config Mínima (jest.config.js)

```javascript
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts", "**/?(*.)+(spec|test).ts"],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/index.ts"
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};
```

### Primeiro Teste

```typescript
// src/math.ts
export function add(a: number, b: number): number {
  return a + b;
}

// __tests__/math.test.ts
import { add } from "../src/math";

describe("Math Operations", () => {
  test("adds two numbers", () => {
    expect(add(2, 3)).toBe(5);
  });
});
```

```bash
npm test -- --watch
```

---

## Seção 2: Matchers e Assertions (30 min)

### Matchers Comuns

```typescript
describe("Jest Matchers", () => {
  test("equality matchers", () => {
    expect(2 + 2).toBe(4);              // ===
    expect([1, 2]).toEqual([1, 2]);     // deep equality
    expect(null).toBeNull();
    expect(undefined).toBeUndefined();
    expect(true).toBeDefined();
  });
  
  test("boolean matchers", () => {
    expect(true).toBeTruthy();
    expect(false).toBeFalsy();
    expect(1).toBeTruthy();
    expect(0).toBeFalsy();
    expect("").toBeFalsy();
    expect("hello").toBeTruthy();
  });
  
  test("numeric matchers", () => {
    expect(0.1 + 0.2).toBeCloseTo(0.3);   // flutuante
    expect(4).toBeGreaterThan(3);
    expect(3).toBeGreaterThanOrEqual(3);
    expect(2).toBeLessThan(3);
    expect(3).toBeLessThanOrEqual(3);
  });
  
  test("string matchers", () => {
    expect("hello world").toContain("world");
    expect("hello@test.com").toMatch(/.*@test\.com$/);
    expect("hello world").toMatch(/world/i); // case-insensitive
  });
  
  test("array matchers", () => {
    const arr = [1, 2, 3];
    expect(arr).toContain(2);
    expect(arr).toHaveLength(3);
    expect(arr).toEqual(expect.arrayContaining([1, 3]));
  });
  
  test("object matchers", () => {
    const user = { name: "Alice", age: 30, email: "alice@test.com" };
    
    expect(user).toHaveProperty("name");
    expect(user).toHaveProperty("name", "Alice");
    expect(user).toMatchObject({ name: "Alice", age: 30 });
    expect(user).toEqual(
      expect.objectContaining({ name: "Alice" })
    );
  });
  
  test("exception matchers", () => {
    const throwError = () => {
      throw new Error("Something failed");
    };
    
    expect(throwError).toThrow();
    expect(throwError).toThrow("Something failed");
    expect(throwError).toThrow(Error);
  });
});
```

### Exemplo Real: Validação de Email

```typescript
// src/validators/email.ts
export class EmailValidator {
  static isValid(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }
  
  static getDomain(email: string): string {
    if (!this.isValid(email)) {
      throw new Error("Invalid email");
    }
    return email.split("@")[1];
  }
}

// __tests__/validators/email.test.ts
import { EmailValidator } from "../../src/validators/email";

describe("EmailValidator", () => {
  describe("isValid", () => {
    test("accepts valid email", () => {
      expect(EmailValidator.isValid("user@example.com")).toBe(true);
      expect(EmailValidator.isValid("john.doe@company.co.uk")).toBe(true);
    });
    
    test("rejects invalid email", () => {
      expect(EmailValidator.isValid("invalid-email")).toBe(false);
      expect(EmailValidator.isValid("missing@domain")).toBe(false);
      expect(EmailValidator.isValid("@example.com")).toBe(false);
      expect(EmailValidator.isValid("user@")).toBe(false);
    });
    
    test("rejects email with spaces", () => {
      expect(EmailValidator.isValid("user @example.com")).toBe(false);
      expect(EmailValidator.isValid("user@example .com")).toBe(false);
    });
  });
  
  describe("getDomain", () => {
    test("extracts domain from valid email", () => {
      expect(EmailValidator.getDomain("user@gmail.com")).toBe("gmail.com");
      expect(EmailValidator.getDomain("test@company.co.uk")).toBe("company.co.uk");
    });
    
    test("throws on invalid email", () => {
      expect(() => EmailValidator.getDomain("invalid")).toThrow("Invalid email");
    });
  });
});
```

---

## Seção 3: Mocks, Stubs e Spies (40 min)

### Diferença: Mocks vs. Stubs vs. Spies

| Tipo | O que faz | Quando usar |
|------|----------|-----------|
| **Stub** | Retorna dados pré-configurados | Simular resposta de API/BD |
| **Mock** | Verifica que função foi chamada corretamente | Validar comportamento |
| **Spy** | Monitora chamadas mas mantém comportamento real | Verificar chamadas sem quebrar função |

### Exemplo: Serviço de Envio de Email

```typescript
// src/services/email.ts
export interface EmailService {
  send(to: string, subject: string, body: string): Promise<boolean>;
}

export class NotificationService {
  constructor(private emailService: EmailService) {}
  
  async notifyUserOfCompletion(userId: string, lessonName: string) {
    const subject = `Parabéns! Você completou ${lessonName}`;
    const body = `Você progrediu! Continue assim.`;
    
    const success = await this.emailService.send(
      `user-${userId}@example.com`,
      subject,
      body
    );
    
    if (!success) {
      throw new Error("Failed to send notification");
    }
  }
}

// ❌ ERRADO: Testar com mock inline
describe("NotificationService - WRONG", () => {
  test("sends congratulation email", async () => {
    const mockEmailService = {
      send: jest.fn().mockResolvedValue(true)
    };
    
    const service = new NotificationService(mockEmailService as any);
    
    await service.notifyUserOfCompletion("user-1", "Lesson 1");
    
    // Teste passa, mas pouco específico
    expect(mockEmailService.send).toHaveBeenCalled();
  });
});

// ✅ CORRETO: Testes específicos
describe("NotificationService - CORRECT", () => {
  let emailServiceMock: jest.Mocked<EmailService>;
  let service: NotificationService;
  
  beforeEach(() => {
    emailServiceMock = {
      send: jest.fn()
    };
    service = new NotificationService(emailServiceMock);
  });
  
  test("sends email with correct parameters", async () => {
    emailServiceMock.send.mockResolvedValue(true);
    
    await service.notifyUserOfCompletion("user-123", "Module 1");
    
    expect(emailServiceMock.send).toHaveBeenCalledWith(
      "user-user-123@example.com",
      expect.stringContaining("Module 1"),
      expect.any(String)
    );
    expect(emailServiceMock.send).toHaveBeenCalledTimes(1);
  });
  
  test("throws when email service fails", async () => {
    emailServiceMock.send.mockResolvedValue(false);
    
    await expect(
      service.notifyUserOfCompletion("user-1", "Lesson")
    ).rejects.toThrow("Failed to send notification");
  });
  
  test("handles email service exception", async () => {
    emailServiceMock.send.mockRejectedValue(
      new Error("SMTP connection failed")
    );
    
    await expect(
      service.notifyUserOfCompletion("user-1", "Lesson")
    ).rejects.toThrow("SMTP connection failed");
  });
});
```

### Spy: Monitorar sem Mockar

```typescript
// src/logger.ts
export class Logger {
  log(message: string) {
    console.log(`[LOG] ${message}`);
  }
  
  error(message: string) {
    console.error(`[ERROR] ${message}`);
  }
}

// Exemplo de código que usa Logger
export class OrderService {
  constructor(private logger: Logger) {}
  
  processOrder(orderId: string) {
    this.logger.log(`Processing order ${orderId}`);
    // ... lógica ...
    this.logger.log(`Order processed`);
  }
}

// Teste com Spy
describe("OrderService with Spy", () => {
  test("logs order processing", () => {
    const logger = new Logger();
    
    // Cria spy que monitora mas mantém função real
    const logSpy = jest.spyOn(logger, "log");
    
    const service = new OrderService(logger);
    service.processOrder("order-123");
    
    // Valida que foi chamado
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining("Processing order")
    );
    
    // Limpa spy
    logSpy.mockRestore();
  });
});
```

---

## Seção 4: Estrutura AAA e Fixtures (30 min)

### Padrão AAA: Arrange, Act, Assert

```typescript
describe("Calculator", () => {
  test("subtracts two numbers", () => {
    // ARRANGE: preparar dados
    const a = 10;
    const b = 3;
    
    // ACT: executar ação
    const result = subtract(a, b);
    
    // ASSERT: verificar resultado
    expect(result).toBe(7);
  });
});
```

### Usando beforeEach e afterEach

```typescript
// src/database.ts
export class Database {
  private connected = false;
  
  connect() {
    console.log("Connecting to database");
    this.connected = true;
  }
  
  disconnect() {
    console.log("Disconnecting from database");
    this.connected = false;
  }
  
  isConnected(): boolean {
    return this.connected;
  }
}

// __tests__/database.test.ts
describe("Database", () => {
  let db: Database;
  
  // Roda ANTES de cada teste
  beforeEach(() => {
    db = new Database();
    db.connect();
  });
  
  // Roda APÓS cada teste (limpeza)
  afterEach(() => {
    db.disconnect();
  });
  
  test("is connected after setup", () => {
    expect(db.isConnected()).toBe(true);
  });
  
  test("can disconnect", () => {
    db.disconnect();
    expect(db.isConnected()).toBe(false);
  });
});
```

### Fixtures: Dados Reutilizáveis

```typescript
// __tests__/fixtures/student.fixture.ts
export const createTestStudent = (overrides = {}) => ({
  id: "student-1",
  name: "John Doe",
  email: "john@test.com",
  progressPercentage: 0,
  ...overrides
});

export const createTestCourse = (overrides = {}) => ({
  id: "course-1",
  title: "Engineering 101",
  lessons: 10,
  ...overrides
});

// __tests__/services/enrollment.test.ts
import { createTestStudent, createTestCourse } from "../fixtures/student.fixture";

describe("EnrollmentService", () => {
  test("enrolls student in course", () => {
    const student = createTestStudent();
    const course = createTestCourse();
    
    const enrollment = enrollStudent(student.id, course.id);
    
    expect(enrollment).toMatchObject({
      studentId: student.id,
      courseId: course.id
    });
  });
  
  test("handles premium courses differently", () => {
    const student = createTestStudent({ type: "free" });
    const course = createTestCourse({ premium: true });
    
    expect(() => enrollStudent(student.id, course.id))
      .toThrow("Upgrade required");
  });
});
```

---

## Seção 5: Testing Async Code (30 min)

### Promises

```typescript
// ❌ ERRADO: Jest não espera promise terminar
test("fetches user data - WRONG", () => {
  fetchUser("user-1").then(user => {
    expect(user.name).toBe("Alice");
  });
  // Teste termina antes de promise resolver!
});

// ✅ CORRETO: Retorna promise
test("fetches user data - CORRECT", () => {
  return fetchUser("user-1").then(user => {
    expect(user.name).toBe("Alice");
  });
});

// ✅ MELHOR: Usa async/await
test("fetches user data - BEST", async () => {
  const user = await fetchUser("user-1");
  expect(user.name).toBe("Alice");
});
```

### Exemplo Real: Repositório de Dados

```typescript
// src/repository/student.repository.ts
export interface StudentRepository {
  findById(id: string): Promise<Student>;
  save(student: Student): Promise<Student>;
  delete(id: string): Promise<void>;
}

export class StudentService {
  constructor(private repository: StudentRepository) {}
  
  async getStudentProgress(studentId: string): Promise<number> {
    const student = await this.repository.findById(studentId);
    if (!student) {
      throw new Error("Student not found");
    }
    return student.progressPercentage;
  }
  
  async updateName(studentId: string, newName: string): Promise<void> {
    const student = await this.repository.findById(studentId);
    if (!student) {
      throw new Error("Student not found");
    }
    
    student.name = newName;
    await this.repository.save(student);
  }
}

// __tests__/services/student.service.test.ts
describe("StudentService", () => {
  let mockRepository: jest.Mocked<StudentRepository>;
  let service: StudentService;
  
  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn()
    };
    service = new StudentService(mockRepository);
  });
  
  describe("getStudentProgress", () => {
    test("returns student progress", async () => {
      mockRepository.findById.mockResolvedValue({
        id: "1",
        name: "Alice",
        progressPercentage: 75
      });
      
      const progress = await service.getStudentProgress("1");
      
      expect(progress).toBe(75);
      expect(mockRepository.findById).toHaveBeenCalledWith("1");
    });
    
    test("throws when student not found", async () => {
      mockRepository.findById.mockResolvedValue(null as any);
      
      await expect(service.getStudentProgress("999"))
        .rejects.toThrow("Student not found");
    });
    
    test("throws on repository error", async () => {
      mockRepository.findById.mockRejectedValue(
        new Error("Database connection failed")
      );
      
      await expect(service.getStudentProgress("1"))
        .rejects.toThrow("Database connection failed");
    });
  });
  
  describe("updateName", () => {
    test("updates student name", async () => {
      mockRepository.findById.mockResolvedValue({
        id: "1",
        name: "Alice",
        progressPercentage: 50
      });
      mockRepository.save.mockResolvedValue({
        id: "1",
        name: "Alicia",
        progressPercentage: 50
      });
      
      await service.updateName("1", "Alicia");
      
      expect(mockRepository.save).toHaveBeenCalled();
      const savedStudent = mockRepository.save.mock.calls[0][0];
      expect(savedStudent.name).toBe("Alicia");
    });
  });
});
```

### Testing Timeouts e Retries

```typescript
test("handles timeout", async () => {
  jest.setTimeout(5000); // 5 segundos
  
  const result = await fetchWithTimeout("url", 1000);
  expect(result).toBeDefined();
});

test("retries failed requests", async () => {
  const fetchMock = jest.fn()
    .mockRejectedValueOnce(new Error("Failed"))
    .mockRejectedValueOnce(new Error("Failed"))
    .mockResolvedValueOnce({ data: "success" });
  
  const result = await retryFetch(fetchMock, 3, 100);
  
  expect(result.data).toBe("success");
  expect(fetchMock).toHaveBeenCalledTimes(3);
});
```

---

## Seção 6: Snapshot Tests e Pitfalls (20 min)

### Quando Usar Snapshots (Cuidado!)

```typescript
// ✅ BOM: Snapshot para estrutura complexa (DOM, JSON)
export const renderLesson = (lesson: Lesson) => {
  return {
    title: lesson.title,
    sections: lesson.sections.map(s => ({
      id: s.id,
      title: s.title,
      content: s.content
    }))
  };
};

describe("renderLesson", () => {
  test("renders lesson structure", () => {
    const lesson = {
      title: "Module 1",
      sections: [
        { id: "1", title: "Intro", content: "..." }
      ]
    };
    
    const rendered = renderLesson(lesson);
    expect(rendered).toMatchSnapshot();
  });
});

// ❌ ERRADO: Snapshot para valores que mudam (timestamps, IDs gerados)
test("generates unique ID - BAD", () => {
  const id = generateId(); // Cada vez diferente!
  expect(id).toMatchSnapshot(); // Vai falhar sempre
});

// ✅ CORRETO: Validar formato, não valor
test("generates valid ID - GOOD", () => {
  const id = generateId();
  expect(id).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-/); // formato UUID
});
```

### Mantendo Snapshots

```bash
# Primeira vez: cria snapshot
npm test -- --updateSnapshot

# Próximas vezes: valida contra snapshot
npm test

# Se mudança é intencional:
npm test -- --updateSnapshot
```

### Pitfalls Comuns

```typescript
// ❌ ERRO 1: Não isolar testes
let globalState = 0;

test("modifies global state", () => {
  globalState++;
  expect(globalState).toBe(1);
});

test("global state is 1 from previous test", () => {
  expect(globalState).toBe(1); // Depende do teste anterior!
});

// ✅ CORRETO: Usar beforeEach
describe("Isolated Tests", () => {
  let state: number;
  
  beforeEach(() => {
    state = 0;
  });
  
  test("increments state", () => {
    state++;
    expect(state).toBe(1);
  });
  
  test("state is clean", () => {
    expect(state).toBe(0); // Sempre true
  });
});

// ❌ ERRO 2: Não mockar tempo
test("waits 1 second - WRONG", () => {
  const start = Date.now();
  sleepSync(1000); // Teste leva 1 segundo!
  expect(Date.now() - start).toBeGreaterThan(999);
});

// ✅ CORRETO: Usar jest.useFakeTimers()
test("waits 1 second - CORRECT", () => {
  jest.useFakeTimers();
  const callback = jest.fn();
  
  setTimeout(callback, 1000);
  jest.runAllTimers();
  
  expect(callback).toHaveBeenCalled();
  jest.useRealTimers();
});

// ❌ ERRO 3: Testes muito específicos
test("returns object with specific structure - TOO SPECIFIC", () => {
  const user = createUser("Alice", 30);
  expect(user).toEqual({
    id: expect.any(String),
    name: "Alice",
    age: 30,
    email: expect.stringContaining("alice"),
    createdAt: expect.any(Date),
    roles: ["user"],
    settings: { theme: "light" }
  });
});

// ✅ MELHOR: Testar apenas o importante
test("creates user with name and age", () => {
  const user = createUser("Alice", 30);
  expect(user).toMatchObject({ name: "Alice", age: 30 });
});
```

---

## Quiz & Exercício Prático

### Questão 1: Padrão AAA
Qual é a ordem correta no padrão AAA?

a) Act, Assert, Arrange  
b) Arrange, Act, Assert  
c) Assert, Arrange, Act  
d) Arrange, Assert, Act  

**Resposta:** b) Arrange, Act, Assert

---

### Questão 2: Mock vs. Spy
Qual é a diferença principal?

**Resposta:** 
- **Mock**: substitui a função, controla completamente comportamento
- **Spy**: monitora chamadas mas mantém comportamento original

---

### Questão 3: Async Testing
O que está errado neste teste?

```typescript
test("fetches data", () => {
  fetchData().then(data => {
    expect(data).toBeDefined();
  });
});
```

**Resposta:** Não retorna a promise. Jest não espera `.then()` terminar. Solução: adicionar `return` ou usar `async/await`.

---

### Questão 4: Fixtures
Qual é a vantagem de usar fixtures?

**Resposta:** 
- Dados reutilizáveis entre testes
- Evita duplicação
- Mudanças centralizadas
- Testes mais legíveis

---

### Questão 5: Cenário Real
Você recebe este serviço com erro:

```typescript
export class PaymentService {
  async processPayment(userId: string, amount: number) {
    const user = await this.db.find(userId);
    await this.stripe.charge(amount);
    await this.db.update(userId, { paid: true });
  }
}
```

Como você testaria para garantir que se `stripe.charge()` falhar, `db.update()` NÃO é chamado?

**Resposta:** 
```typescript
test("does not update status if payment fails", async () => {
  mockStripe.charge.mockRejectedValue(new Error("Declined"));
  
  await expect(service.processPayment("user-1", 100))
    .rejects.toThrow("Declined");
  
  expect(mockDb.update).not.toHaveBeenCalled();
});
```

---

### Exercício Prático: Testar Serviço Real

**Objetivo:** Escrever testes completos para um serviço

**Código a Testar:**

```typescript
// src/services/lesson-progress.service.ts
export interface Lesson {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface StudentProgress {
  studentId: string;
  completedLessons: string[];
  quizScores: Map<string, number>;
}

export class LessonProgressService {
  constructor(
    private progressRepository: ProgressRepository,
    private lessonRepository: LessonRepository
  ) {}
  
  async completeLesson(
    studentId: string,
    lessonId: string,
    quizScore: number
  ): Promise<StudentProgress> {
    if (quizScore < 0 || quizScore > 100) {
      throw new Error("Invalid score");
    }
    
    const progress = await this.progressRepository.get(studentId);
    if (progress.completedLessons.includes(lessonId)) {
      throw new Error("Lesson already completed");
    }
    
    progress.completedLessons.push(lessonId);
    progress.quizScores.set(lessonId, quizScore);
    
    return await this.progressRepository.save(progress);
  }
  
  async getProgressPercentage(studentId: string): Promise<number> {
    const progress = await this.progressRepository.get(studentId);
    const totalLessons = await this.lessonRepository.count();
    
    if (totalLessons === 0) return 0;
    return (progress.completedLessons.length / totalLessons) * 100;
  }
}
```

**Seus Testes Devem:**

1. ✅ Validar completar uma lição com sucesso
2. ✅ Rejeitar score inválido (< 0 ou > 100)
3. ✅ Rejeitar lição já completa
4. ✅ Calcular progresso corretamente (0%, 50%, 100%)
5. ✅ Lidar com repositório que falha
6. ✅ Lidar com conflito de concorrência

**Estrutura Esperada:**

```typescript
describe("LessonProgressService", () => {
  let service: LessonProgressService;
  let mockProgressRepository: jest.Mocked<ProgressRepository>;
  let mockLessonRepository: jest.Mocked<LessonRepository>;
  
  beforeEach(() => {
    // setup mocks e serviço
  });
  
  describe("completeLesson", () => {
    test("completes lesson with valid score", async () => {
      // seu teste aqui
    });
    
    test("rejects invalid scores", async () => {
      // seu teste aqui
    });
    
    // ... mais testes ...
  });
  
  describe("getProgressPercentage", () => {
    test("calculates progress correctly", async () => {
      // seu teste aqui
    });
    
    // ... mais testes ...
  });
});
```

**Dicas:**
- Use `beforeEach()` para setup compartilhado
- Teste casos happy path + error cases
- Valide chamadas a dependências com `toHaveBeenCalledWith()`
- Use `mockRejectedValue()` para simular erros

---

**Tempo Total:** 200 minutos  
**Próxima Lição:** 6.3 - Integration Testing
