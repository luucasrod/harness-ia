# LIÇÃO 6.3: Integration Testing - O Meio Termo

**Duração:** 200 minutos (3h 20min)  
**Nível:** Intermediário-Avançado  
**Foco:** Testar integrações reais sem depender de sistemas externos  
**Público-alvo:** Engenheiros que precisam validar comportamento entre componentes

---

## ÍNDICE
1. [Quando Unit Tests Não Bastam](#seção-1-quando-unit-tests-não-bastam-20-min)
2. [Setup de Bancos de Teste](#seção-2-setup-de-bancos-de-teste-30-min)
3. [Test Containers e Fixtures](#seção-3-test-containers-e-fixtures-40-min)
4. [Testando com Banco Real](#seção-4-testando-com-banco-real-40-min)
5. [Transações e Isolamento](#seção-5-transações-e-isolamento-30-min)
6. [Testando Fluxos Completos](#seção-6-testando-fluxos-completos-20-min)
7. [Quiz & Exercício Prático](#quiz--exercício-prático)

---

## Seção 1: Quando Unit Tests Não Bastam (20 min)

### O Problema do "Mockery"

```typescript
// ❌ PROBLEMA: Unit test com mocks não valida integração real
export class CourseRepository {
  async findById(courseId: string): Promise<Course> {
    // No test com mock, isso sempre funciona
    // Na vida real, query SQL tem bug de join
  }
}

describe("CourseRepository - MOCKED", () => {
  test("finds course by id", async () => {
    const mockDb = {
      query: jest.fn().mockResolvedValue({
        id: "1",
        title: "Engineering 101"
      })
    };
    
    const repo = new CourseRepository(mockDb as any);
    const course = await repo.findById("1");
    
    expect(course.title).toBe("Engineering 101");
    // ✅ Teste passa
    // ❌ Mas no banco real, query falha!
  });
});
```

### Quando Integração Imports

**Integração com banco de dados:**
- Seu ORM traduz queries corretamente?
- Constraints funcionam?
- Índices funcionam?

**Integração entre serviços:**
- Transações são atômicas?
- Ordem de operações é correta?
- Erro em um serviço não corrói os outros?

**Integração com APIs externas:**
- Retry logic funciona?
- Timeout é respeitado?
- Payload está formatado corretamente?

---

## Seção 2: Setup de Bancos de Teste (30 min)

### PostgreSQL em Docker para Testes

```bash
# docker-compose.test.yml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
      POSTGRES_DB: test_db
    ports:
      - "5433:5432"
    command: >
      -c log_statement=all
      -c log_duration=on
```

```bash
# package.json
{
  "scripts": {
    "test:integration": "docker-compose -f docker-compose.test.yml up -d && npm run test:int:run && docker-compose -f docker-compose.test.yml down",
    "test:int:run": "jest --testPathPattern='.integration.test.ts$' --runInBand",
    "test:int:watch": "docker-compose -f docker-compose.test.yml up -d && jest --testPathPattern='.integration.test.ts$' --watch"
  }
}
```

### Setup/Teardown de Dados

```typescript
// __tests__/integration/setup.ts
import { Pool } from "pg";

let pool: Pool;

export async function setupTestDatabase() {
  pool = new Pool({
    user: "test",
    password: "test",
    host: "localhost",
    port: 5433,
    database: "test_db"
  });
  
  // Cria tabelas
  await pool.query(`
    CREATE TABLE IF NOT EXISTS students (
      id UUID PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      progress_percentage INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS lessons (
      id UUID PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      difficulty VARCHAR(50),
      module_id VARCHAR(50)
    );
  `);
}

export async function cleanupTestDatabase() {
  await pool.query("DELETE FROM lessons;");
  await pool.query("DELETE FROM students;");
  await pool.end();
}

export function getPool(): Pool {
  return pool;
}

// jest.config.js
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testPathIgnorePatterns: [
    "/node_modules/",
    "/setup.ts"
  ],
  setupFilesAfterEnv: ["<rootDir>/__tests__/integration/setup.ts"],
  globalSetup: "<rootDir>/__tests__/integration/global-setup.ts",
  globalTeardown: "<rootDir>/__tests__/integration/global-teardown.ts"
};

// __tests__/integration/global-setup.ts
import { setupTestDatabase } from "./setup";

module.exports = async () => {
  await setupTestDatabase();
};

// __tests__/integration/global-teardown.ts
import { cleanupTestDatabase } from "./setup";

module.exports = async () => {
  await cleanupTestDatabase();
};
```

---

## Seção 3: Test Containers e Fixtures (40 min)

### Testcontainers: Spin Up de DB Automático

```typescript
// __tests__/integration/student.repository.integration.test.ts
import { GenericContainer } from "testcontainers";
import { Pool } from "pg";

describe("StudentRepository - Integration", () => {
  let container: any;
  let pool: Pool;
  let repository: StudentRepository;
  
  beforeAll(async () => {
    // Inicia container PostgreSQL
    container = await new GenericContainer("postgres:15-alpine")
      .withEnvironment("POSTGRES_USER", "test")
      .withEnvironment("POSTGRES_PASSWORD", "test")
      .withEnvironment("POSTGRES_DB", "test_db")
      .withExposedPorts(5432)
      .start();
    
    const host = container.getHost();
    const port = container.getMappedPort(5432);
    
    pool = new Pool({
      user: "test",
      password: "test",
      host,
      port,
      database: "test_db"
    });
    
    // Cria tabelas
    await pool.query(`
      CREATE TABLE students (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        progress_percentage INTEGER DEFAULT 0
      );
    `);
    
    repository = new StudentRepository(pool);
  }, 60000); // 60 segundos de timeout
  
  afterAll(async () => {
    await pool.end();
    await container.stop();
  });
  
  beforeEach(async () => {
    // Limpa dados antes de cada teste
    await pool.query("TRUNCATE TABLE students CASCADE;");
  });
  
  test("saves and retrieves student", async () => {
    const student = new Student("alice@test.com", "Alice");
    
    const saved = await repository.save(student);
    const retrieved = await repository.findByEmail("alice@test.com");
    
    expect(retrieved).toMatchObject({
      email: "alice@test.com",
      name: "Alice"
    });
  });
});
```

### Fixtures Reutilizáveis

```typescript
// __tests__/integration/fixtures/students.fixture.ts
import { Pool } from "pg";

export async function createTestStudent(
  pool: Pool,
  overrides = {}
) {
  const student = {
    email: `test-${Date.now()}@test.com`,
    name: "Test Student",
    progress_percentage: 0,
    ...overrides
  };
  
  const result = await pool.query(
    `INSERT INTO students (email, name, progress_percentage)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [student.email, student.name, student.progress_percentage]
  );
  
  return result.rows[0];
}

export async function createMultipleStudents(
  pool: Pool,
  count: number
) {
  const students = [];
  for (let i = 0; i < count; i++) {
    students.push(await createTestStudent(pool, {
      name: `Student ${i + 1}`
    }));
  }
  return students;
}

// Uso em testes
describe("StudentRepository", () => {
  test("finds students by progress range", async () => {
    // Cria 5 estudantes com progresso diferente
    for (let i = 0; i < 5; i++) {
      await createTestStudent(pool, {
        progress_percentage: i * 20
      });
    }
    
    const advanced = await repository.findByProgressRange(60, 100);
    expect(advanced).toHaveLength(2); // 60% e 80%
  });
});
```

---

## Seção 4: Testando com Banco Real (40 min)

### Exemplo Real: Enrollment Service

```typescript
// src/domain/models/enrollment.ts
export class Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  enrolledAt: Date;
  completionPercentage: number;
  
  constructor(
    studentId: string,
    courseId: string,
    completionPercentage = 0
  ) {
    this.id = randomUUID();
    this.studentId = studentId;
    this.courseId = courseId;
    this.enrolledAt = new Date();
    this.completionPercentage = completionPercentage;
  }
}

// src/application/services/enrollment.service.ts
export class EnrollmentService {
  constructor(
    private enrollmentRepository: EnrollmentRepository,
    private studentRepository: StudentRepository,
    private courseRepository: CourseRepository,
    private emailService: EmailService,
    private logger: Logger
  ) {}
  
  async enrollStudent(
    studentId: string,
    courseId: string
  ): Promise<Enrollment> {
    // Valida que estudante existe
    const student = await this.studentRepository.findById(studentId);
    if (!student) {
      throw new NotFoundError("Student not found");
    }
    
    // Valida que curso existe
    const course = await this.courseRepository.findById(courseId);
    if (!course) {
      throw new NotFoundError("Course not found");
    }
    
    // Verifica se já está enrolado
    const existing = await this.enrollmentRepository.findByStudentAndCourse(
      studentId,
      courseId
    );
    if (existing) {
      throw new DuplicateError("Already enrolled");
    }
    
    // Cria enrollment
    const enrollment = new Enrollment(studentId, courseId);
    const saved = await this.enrollmentRepository.save(enrollment);
    
    // Envia email
    try {
      await this.emailService.sendEnrollmentConfirmation(
        student.email,
        course.title
      );
    } catch (error) {
      this.logger.error(
        `Failed to send enrollment email for ${studentId}`,
        error
      );
      // Não falha se email falhar
    }
    
    return saved;
  }
  
  async completeLesson(
    enrollmentId: string,
    lessonId: string
  ): Promise<Enrollment> {
    const enrollment = await this.enrollmentRepository.findById(
      enrollmentId
    );
    if (!enrollment) {
      throw new NotFoundError("Enrollment not found");
    }
    
    // Registra conclusão
    await this.enrollmentRepository.recordLessonCompletion(
      enrollmentId,
      lessonId
    );
    
    // Recalcula progresso
    const totalLessons = await this.enrollmentRepository
      .countLessonsInCourse(enrollment.courseId);
    const completedLessons = await this.enrollmentRepository
      .countCompletedLessons(enrollmentId);
    
    enrollment.completionPercentage = 
      (completedLessons / totalLessons) * 100;
    
    return await this.enrollmentRepository.save(enrollment);
  }
}

// __tests__/integration/enrollment.service.integration.test.ts
describe("EnrollmentService - Integration", () => {
  let service: EnrollmentService;
  let pool: Pool;
  let studentRepo: PostgresStudentRepository;
  let courseRepo: PostgresCourseRepository;
  let enrollmentRepo: PostgresEnrollmentRepository;
  let mockEmailService: jest.Mocked<EmailService>;
  let mockLogger: jest.Mocked<Logger>;
  
  beforeAll(async () => {
    // Setup testcontainers
    container = await new GenericContainer("postgres:15-alpine")
      .withEnvironment("POSTGRES_USER", "test")
      .withEnvironment("POSTGRES_PASSWORD", "test")
      .withEnvironment("POSTGRES_DB", "test_db")
      .withExposedPorts(5432)
      .start();
    
    pool = new Pool({
      user: "test",
      password: "test",
      host: container.getHost(),
      port: container.getMappedPort(5432),
      database: "test_db"
    });
    
    // Cria schema
    await pool.query(`
      CREATE TABLE students (
        id UUID PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL
      );
      
      CREATE TABLE courses (
        id UUID PRIMARY KEY,
        title VARCHAR(255) NOT NULL
      );
      
      CREATE TABLE enrollments (
        id UUID PRIMARY KEY,
        student_id UUID REFERENCES students(id),
        course_id UUID REFERENCES courses(id),
        enrolled_at TIMESTAMP,
        completion_percentage INTEGER DEFAULT 0,
        UNIQUE(student_id, course_id)
      );
      
      CREATE TABLE lesson_completions (
        id UUID PRIMARY KEY,
        enrollment_id UUID REFERENCES enrollments(id),
        lesson_id UUID,
        completed_at TIMESTAMP
      );
    `);
    
    // Instancia repositórios reais
    studentRepo = new PostgresStudentRepository(pool);
    courseRepo = new PostgresCourseRepository(pool);
    enrollmentRepo = new PostgresEnrollmentRepository(pool);
    
    // Mocks apenas para serviços externos
    mockEmailService = {
      sendEnrollmentConfirmation: jest.fn().mockResolvedValue(void 0)
    };
    mockLogger = {
      error: jest.fn()
    };
    
    service = new EnrollmentService(
      enrollmentRepo,
      studentRepo,
      courseRepo,
      mockEmailService,
      mockLogger
    );
  }, 60000);
  
  afterAll(async () => {
    await pool.end();
    await container.stop();
  });
  
  beforeEach(async () => {
    // Limpa dados
    await pool.query("TRUNCATE TABLE lesson_completions CASCADE;");
    await pool.query("TRUNCATE TABLE enrollments CASCADE;");
    await pool.query("TRUNCATE TABLE students CASCADE;");
    await pool.query("TRUNCATE TABLE courses CASCADE;");
  });
  
  describe("enrollStudent", () => {
    test("successfully enrolls student in course", async () => {
      // Cria dados de teste
      const student = await studentRepo.save(
        new Student("alice@test.com", "Alice")
      );
      const course = await courseRepo.save(
        new Course("Engineering 101")
      );
      
      // Realiza ação
      const enrollment = await service.enrollStudent(
        student.id,
        course.id
      );
      
      // Valida resultado
      expect(enrollment).toMatchObject({
        studentId: student.id,
        courseId: course.id,
        completionPercentage: 0
      });
      
      // Valida que foi salvo no banco
      const saved = await enrollmentRepo.findById(enrollment.id);
      expect(saved).toBeDefined();
      
      // Valida que email foi enviado
      expect(mockEmailService.sendEnrollmentConfirmation)
        .toHaveBeenCalledWith("alice@test.com", "Engineering 101");
    });
    
    test("throws on duplicate enrollment", async () => {
      const student = await studentRepo.save(
        new Student("bob@test.com", "Bob")
      );
      const course = await courseRepo.save(
        new Course("Advanced TypeScript")
      );
      
      // Enrola primeira vez
      await service.enrollStudent(student.id, course.id);
      
      // Tenta enrolar novamente
      await expect(
        service.enrollStudent(student.id, course.id)
      ).rejects.toThrow(DuplicateError);
    });
    
    test("sends email even if student not in DB initially", async () => {
      // Student existe em outro sistema
      const studentId = randomUUID();
      const course = await courseRepo.save(new Course("Course"));
      
      // Primeiro falha
      await expect(
        service.enrollStudent(studentId, course.id)
      ).rejects.toThrow(NotFoundError);
    });
  });
  
  describe("completeLesson", () => {
    test("updates completion percentage correctly", async () => {
      // Setup: cria student, course, enrollment com 3 lições
      const student = await studentRepo.save(new Student("test@test.com", "Test"));
      const course = await courseRepo.save(new Course("3-Lesson Course"));
      
      const enrollment = await enrollmentRepo.save(
        new Enrollment(student.id, course.id)
      );
      
      // Cria 3 lições no curso
      for (let i = 1; i <= 3; i++) {
        await pool.query(
          `INSERT INTO lessons (id, course_id, title)
           VALUES ($1, $2, $3)`,
          [randomUUID(), course.id, `Lesson ${i}`]
        );
      }
      
      // Completa 1ª lição
      await service.completeLesson(enrollment.id, "lesson-1");
      let updated = await enrollmentRepo.findById(enrollment.id);
      expect(updated.completionPercentage).toBeCloseTo(33.33, 0);
      
      // Completa 2ª lição
      await service.completeLesson(enrollment.id, "lesson-2");
      updated = await enrollmentRepo.findById(enrollment.id);
      expect(updated.completionPercentage).toBeCloseTo(66.67, 0);
      
      // Completa 3ª lição
      await service.completeLesson(enrollment.id, "lesson-3");
      updated = await enrollmentRepo.findById(enrollment.id);
      expect(updated.completionPercentage).toBe(100);
    });
  });
});
```

---

## Seção 5: Transações e Isolamento (30 min)

### O Problema: Race Conditions

```typescript
// ❌ PROBLEMA: Sem transação, race condition pode acontecer
export class PaymentService {
  async processRefund(orderId: string, amount: number) {
    // T1: Lê saldo
    const account = await this.db.findAccount(orderId);
    const currentBalance = account.balance;
    
    // T2: Thread 2 pode modificar saldo aqui!
    
    // Escreve novo saldo
    await this.db.updateBalance(orderId, currentBalance + amount);
  }
}

// Se dois threads chamar processRefund simultaneamente:
// T1: saldo = 100, refund = 50
// T2: saldo = 100, refund = 30
// Resultado esperado: 180
// Resultado real: 130 (uma transação foi perdida!)
```

### Transações no PostgreSQL

```typescript
// ✅ CORRETO: Com transação
export class PaymentService {
  async processRefund(orderId: string, amount: number) {
    const client = await this.pool.connect();
    
    try {
      await client.query("BEGIN");
      
      // Lê com lock
      const result = await client.query(
        "SELECT balance FROM accounts WHERE id = $1 FOR UPDATE",
        [orderId]
      );
      
      const currentBalance = result.rows[0].balance;
      
      // Escreve
      await client.query(
        "UPDATE accounts SET balance = $1 WHERE id = $2",
        [currentBalance + amount, orderId]
      );
      
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

// Teste com múltiplos threads
describe("PaymentService - Concurrency", () => {
  test("handles concurrent refunds correctly", async () => {
    // Setup
    const orderId = randomUUID();
    await pool.query(
      "INSERT INTO accounts (id, balance) VALUES ($1, $2)",
      [orderId, 1000]
    );
    
    // Executa 10 refunds simultâneos de 50 cada
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(service.processRefund(orderId, 50));
    }
    
    await Promise.all(promises);
    
    // Valida saldo final
    const result = await pool.query(
      "SELECT balance FROM accounts WHERE id = $1",
      [orderId]
    );
    
    expect(result.rows[0].balance).toBe(1500); // 1000 + (10 * 50)
  });
});
```

### Níveis de Isolamento

```typescript
// PostgreSQL oferece 4 níveis:

// 1. READ UNCOMMITTED (menos rigoroso)
// - Permite dirty reads (ler dados não commitados)
// - Rápido mas perigoso

// 2. READ COMMITTED (default)
// - Não permite dirty reads
// - Simples para maioria dos casos

// 3. REPEATABLE READ
// - Snapshot isolation
// - Mesmos dados em toda transação

// 4. SERIALIZABLE (mais rigoroso)
// - Garante linearizabilidade
// - Lento, mas máxima segurança

// Exemplo de transação rigorosa:
async function transferMoney(fromId: string, toId: string, amount: number) {
  const client = await this.pool.connect();
  
  try {
    await client.query("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE");
    await client.query("BEGIN");
    
    // Deduz de conta origem
    await client.query(
      "UPDATE accounts SET balance = balance - $1 WHERE id = $2",
      [amount, fromId]
    );
    
    // Adiciona em conta destino
    await client.query(
      "UPDATE accounts SET balance = balance + $1 WHERE id = $2",
      [amount, toId]
    );
    
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
```

---

## Seção 6: Testando Fluxos Completos (20 min)

### Exemplo: Fluxo de Inscrição → Lição → Conclusão

```typescript
describe("Complete Course Enrollment Flow", () => {
  test("student completes entire course", async () => {
    // 1. Cria estudante
    const student = await studentRepo.save(
      new Student("flow-test@test.com", "Flow Student")
    );
    
    // 2. Cria curso com 2 lições
    const course = await courseRepo.save(new Course("Complete Course"));
    const lessons = [];
    for (let i = 1; i <= 2; i++) {
      lessons.push(
        await lessonRepo.save(
          new Lesson(`Lesson ${i}`, course.id)
        )
      );
    }
    
    // 3. Enrola estudante
    const enrollment = await service.enrollStudent(
      student.id,
      course.id
    );
    expect(enrollment.completionPercentage).toBe(0);
    
    // 4. Completa primeira lição
    await service.completeLesson(enrollment.id, lessons[0].id);
    let updated = await enrollmentRepo.findById(enrollment.id);
    expect(updated.completionPercentage).toBe(50);
    
    // 5. Completa segunda lição
    await service.completeLesson(enrollment.id, lessons[1].id);
    updated = await enrollmentRepo.findById(enrollment.id);
    expect(updated.completionPercentage).toBe(100);
    
    // 6. Valida estado final
    const finalStudent = await studentRepo.findById(student.id);
    const allEnrollments = await enrollmentRepo.findByStudent(student.id);
    expect(allEnrollments).toHaveLength(1);
    expect(allEnrollments[0].completionPercentage).toBe(100);
  });
});
```

---

## Quiz & Exercício Prático

### Questão 1: Mock vs. Real DB
Por que é importante testar com banco de dados real, não mock?

**Resposta:** 
- Mocks podem esconder bugs em queries SQL
- Constraints do banco (foreign keys, unique) não são testados
- Performance pode diferir drasticamente

---

### Questão 2: Testcontainers
Qual é a vantagem de usar Testcontainers?

**Resposta:**
- Banco isolado por teste
- Setup/teardown automático
- Não depende de sistema local configurado
- CI/CD não precisa de DB instalada

---

### Questão 3: Transações
O que a transação `FOR UPDATE` faz?

**Resposta:** Coloca lock exclusivo na linha. Outro thread que tentar ler com `FOR UPDATE` espera. Previne race conditions.

---

### Questão 4: Fixture
Qual é a melhor prática para dados em integration tests?

a) Reutilizar dados de production  
b) Criar dados isolados em cada teste  
c) Mockar tudo  
d) Contar com dados pré-carregados  

**Resposta:** b) Isolar dados garante que testes sejam independentes

---

### Questão 5: Cenário Real
Seu fluxo de checkout tem 3 passos:
1. Deduz do estoque
2. Debita cartão
3. Cria order

Se passo 2 falhar, passo 1 foi desfeito? Como você testaria isso?

**Resposta:** Use transação. Teste com mock de payment que simula falha:
```typescript
mockPayment.charge.mockRejectedValue(new Error("Declined"));
// Valida que estoque foi restaurado
```

---

### Exercício Prático: Integration Test Completo

**Objetivo:** Escrever integration test com Testcontainers

**Código Base:**

```typescript
// src/models/lesson.ts
export class Lesson {
  id: string;
  courseId: string;
  title: string;
  order: number;
  
  constructor(courseId: string, title: string, order: number) {
    this.id = randomUUID();
    this.courseId = courseId;
    this.title = title;
    this.order = order;
  }
}

// src/services/course-progress.service.ts
export class CourseProgressService {
  constructor(
    private courseRepo: CourseRepository,
    private lessonRepo: LessonRepository,
    private progressRepo: ProgressRepository
  ) {}
  
  async startCourse(studentId: string, courseId: string) {
    const course = await this.courseRepo.findById(courseId);
    if (!course) throw new NotFoundError("Course not found");
    
    return await this.progressRepo.createProgress({
      studentId,
      courseId,
      lessonsCompleted: []
    });
  }
  
  async completeLesson(
    progressId: string,
    lessonId: string
  ): Promise<CourseProgress> {
    const progress = await this.progressRepo.findById(progressId);
    progress.lessonsCompleted.push(lessonId);
    return await this.progressRepo.save(progress);
  }
  
  async getCourseCompletion(progressId: string): Promise<number> {
    const progress = await this.progressRepo.findById(progressId);
    const lessons = await this.lessonRepo.findByCourse(
      progress.courseId
    );
    
    return (progress.lessonsCompleted.length / lessons.length) * 100;
  }
}
```

**Seu Desafio:**

1. ✅ Setup Testcontainers com PostgreSQL
2. ✅ Cria fixtures para courses e lessons
3. ✅ Testa fluxo completo: start → complete lesson → check progress
4. ✅ Testa erro: completa lição de outro curso
5. ✅ Testa concorrência: dois estudantes completam mesma lição

**Dicas:**
- Use `beforeAll` para setup de container
- Use `beforeEach` para limpar dados
- Teste casos de erro com dados inválidos

---

**Tempo Total:** 200 minutos  
**Próxima Lição:** 6.4 - E2E Testing with Playwright
