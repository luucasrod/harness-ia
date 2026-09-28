# LIÇÃO 7.1: SOLID - Single Responsibility Principle (SRP)

## SEÇÃO 1: INTRODUÇÃO (15 minutos)

### O Problema Real

Você herda uma classe chamada `UserManager`. Ela cria usuários, valida dados, salva no banco, envia e-mails, processa pagamentos, gera logs e rastreia analíticos. Você precisa adicionar suporte a dois provedores de e-mail em vez de um.

Uma mudança simples se torna um pesadelo:
- Modificar `UserManager` para adicionar `EmailProvider` pode quebrar salvamento de usuário.
- Testes agora precisam mockar banco, e-mail, pagamento e analytics simultaneamente.
- Quando o requisito muda (ex: e-mail agora é assíncrono), você toca em uma classe que também é responsável por validar dados.

Isso é um **sintoma de violação de SRP**. A classe tem múltiplas responsabilidades e, portanto, múltiplas razões para mudar.

### Por Que SRP Importa

SRP não é purismo. É pragmatismo. Uma classe com uma única responsabilidade:
- É **mais fácil de testar**: teste a responsabilidade isoladamente.
- É **mais fácil de entender**: o nome diz exatamente o que faz.
- É **mais fácil de modificar**: mudança em uma responsabilidade não afeta outras.
- É **mais fácil de reutilizar**: se você só precisa de validação, usa `UserValidator`, não `UserManager`.

Em sistemas que escalam, essa simplicidade se transforma em diferença de semanas vs. meses no tempo de mudança.

### Objetivo da Lição

Nesta aula, você vai:
- Entender o que significa "responsabilidade única".
- Reconhecer violações de SRP em código real.
- Refatorar código acoplado em componentes especializados.
- Aplicar SRP em um contexto real: sistema de progresso educacional.
- Entender trade-offs: quando separar e quando manter junto.

---

## SEÇÃO 2: DEFINIÇÃO RIGOROSA DE SRP (20 minutos)

### A Definição Original (Bob Martin, 2002)

**"A class should have one and only one reason to change."**

Tradução: Uma classe deveria ter uma única razão para mudar.

Isso significa: se você precisa modificar duas comportamentos diferentes da classe, esses comportamentos deveriam estar em classes diferentes.

### O Que É Uma "Razão Para Mudar"?

Uma razão para mudar é uma **necessidade de negócio ou técnica** que força você a editar a classe.

Exemplos de razões para mudar:

#### 1. Mudança na Regra de Negócio
- Usuários agora precisam de dois níveis de autorização → `AuthorizationService` muda.
- Pontuação é calculada diferentemente → `ScoringService` muda.

#### 2. Mudança na Integração Externa
- Trocar de e-mail SMTP para SendGrid → `EmailService` muda.
- Integrar com novo provedor de IA → `AiService` muda.

#### 3. Mudança na Estrutura de Dados
- Usuário agora tem novo campo "timezone" → `UserRepository` muda.
- Lição agora pode ter múltiplos autores → `LessonRepository` muda.

#### 4. Mudança na Apresentação
- API JSON precisa retornar um campo diferente → `UserResponseMapper` muda.

### Responsabilidade vs. Funcionalidade

**Importante:** responsabilidade ≠ funcionalidade. Uma classe pode fazer várias coisas, mas ter uma única responsabilidade.

```typescript
// ERRO: Confundir "múltiplas funções" com "múltiplas responsabilidades"
class PaymentProcessor {
  processPayment(order: Order): boolean {
    // Validar ordem
    if (!order.items.length) return false;
    if (order.total < 0) return false;
    
    // Calcular taxa
    const fee = order.total * 0.029;
    
    // Cobrar cartão
    const chargeResult = this.stripeAPI.charge(order.total + fee, order.cardToken);
    
    // Registrar na auditoria
    this.auditLog.record(`Payment processed for order ${order.id}`);
    
    // Enviar confirmação
    this.emailService.sendConfirmation(order.user, order.total + fee);
    
    return chargeResult.success;
  }
}
```

Essa classe tem **uma única responsabilidade: processar pagamento**. Mas ela faz múltiplas coisas:
- Validação
- Cálculo
- Integração com Stripe
- Auditoria
- E-mail

A questão é: **quantas razões diferentes essa classe tem para mudar?**

1. Regras de validação mudam → muda.
2. Fórmula de taxa muda → muda.
3. Integração com Stripe muda (novo provedor) → muda.
4. Auditoria precisa de novo formato → muda.
5. Template de e-mail muda → muda.

**Resposta: Cinco razões para mudar!** Logo, isso viola SRP.

---

## SEÇÃO 3: IDENTIFICANDO VIOLAÇÕES DE SRP (25 minutos)

### Sinais de Alerta (Red Flags)

#### 1. Nome da Classe É um "Manager" ou "Processor"
- `UserManager` → faz tudo com usuários.
- `OrderProcessor` → faz tudo com pedidos.
- `DataHandler` → faz tudo com dados.

Esses nomes sugerem múltiplas responsabilidades.

#### 2. Métodos Não Relacionados Semanticamente
```typescript
class User {
  changePassword() { /* ... */ }
  sendForgotPasswordEmail() { /* ... */ }
  subscribeToNewsletter() { /* ... */ }
  updateBillingAddress() { /* ... */ }
  generateReport() { /* ... */ }
}
```

Se alguém pergunta "o que faz um User?", a resposta é "tudo". Melhor seria:
- `User`: modelo de domínio.
- `AuthenticationService`: muda senha.
- `EmailService`: envia e-mails.
- `UserPreferencesService`: gerencia preferências.
- `BillingService`: endereço de cobrança.
- `ReportGenerator`: relatórios.

#### 3. Testes Precisam de Muitos Mocks
```typescript
// Se seu teste fica assim:
it('should create user', () => {
  const mockDB = mock(Database);
  const mockEmail = mock(EmailService);
  const mockPayment = mock(PaymentService);
  const mockAnalytics = mock(AnalyticsService);
  const mockLogger = mock(Logger);
  
  const userManager = new UserManager(
    mockDB, mockEmail, mockPayment, mockAnalytics, mockLogger
  );
  
  userManager.createUser(data);
  
  expect(mockDB.save).toHaveBeenCalled();
  expect(mockEmail.send).toHaveBeenCalled();
  expect(mockPayment.process).toHaveBeenCalled();
  // ...
});
```

Você está testando múltiplas responsabilidades em um teste. Isso é um sinal.

#### 4. Documentação Fica Vaga ou Genérica
Se você escreve:
- "Handles all user operations"
- "Manages X"
- "Processes Y"

Em vez de:
- "Authenticates users and manages passwords"
- "Persists users to database"
- "Validates user input"

Provavelmente há múltiplas responsabilidades.

### Exemplo: Violação em Lições (Sistema Educacional)

```typescript
class LessonManager {
  // Responsabilidade 1: Gerenciar dados da lição
  async getLessonById(id: string) {
    return await db.query('SELECT * FROM lessons WHERE id = ?', id);
  }
  
  // Responsabilidade 2: Renderizar para diferentes formatos
  renderAsHTML(lesson: Lesson): string {
    return `<div class="lesson">
      <h1>${lesson.title}</h1>
      <p>${lesson.content}</p>
    </div>`;
  }
  
  renderAsJSON(lesson: Lesson): string {
    return JSON.stringify(lesson);
  }
  
  // Responsabilidade 3: Validar progresso do aluno
  canStudentAccess(student: Student, lesson: Lesson): boolean {
    return student.completedLessons.includes(lesson.prerequisite);
  }
  
  // Responsabilidade 4: Rastrear visualização
  trackLessonView(studentId: string, lessonId: string) {
    this.analytics.log('lesson_viewed', { studentId, lessonId });
  }
  
  // Responsabilidade 5: Gerar certificado
  generateCertificate(student: Student, lesson: Lesson): PDF {
    return new PDFGenerator().create({ student, lesson });
  }
}
```

**Razões para mudar:**
1. Estrutura de dados da lição → muda banco.
2. Designer quer novo layout HTML → muda renderização.
3. JSON agora precisa incluir metadados → muda JSON.
4. Pré-requisito agora é mais complexo → muda controle de acesso.
5. Analytics muda de ferramenta → muda rastreamento.
6. Certificado agora é no formato digital → muda geração.

**Refatoração:**

```typescript
// Responsabilidade 1: Fornecer dados da lição
class LessonRepository {
  async getById(id: string): Promise<Lesson> {
    return await db.query('SELECT * FROM lessons WHERE id = ?', id);
  }
}

// Responsabilidade 2: Renderizar para apresentação
class LessonHTMLRenderer {
  render(lesson: Lesson): string {
    return `<div class="lesson">...</div>`;
  }
}

class LessonJSONRenderer {
  render(lesson: Lesson): string {
    return JSON.stringify(lesson);
  }
}

// Responsabilidade 3: Verificar acesso
class LessonAccessControl {
  canStudentAccess(student: Student, lesson: Lesson): boolean {
    return student.completedLessons.includes(lesson.prerequisite);
  }
}

// Responsabilidade 4: Rastrear eventos
class LessonAnalyticsService {
  trackView(studentId: string, lessonId: string) {
    this.analytics.log('lesson_viewed', { studentId, lessonId });
  }
}

// Responsabilidade 5: Gerar certificado
class CertificateGenerator {
  generate(student: Student, lesson: Lesson): PDF {
    return new PDFGenerator().create({ student, lesson });
  }
}
```

Agora, cada classe tem **uma razão para mudar**. Se designer quer novo HTML, só `LessonHTMLRenderer` muda. Se analytics muda de ferramenta, só `LessonAnalyticsService` muda.

---

## SEÇÃO 4: APPLYING SRP (20 minutos)

### Padrão de Refatoração

#### Passo 1: Identificar Responsabilidades Implícitas

Para `UserManager`:
```typescript
class UserManager {
  createUser(email, password, name) {
    // 1. Validar
    if (!email.includes('@')) throw new Error('Invalid email');
    
    // 2. Hash senha
    const hashedPassword = bcrypt.hash(password);
    
    // 3. Persistir
    const user = { email, hashedPassword, name };
    db.insert('users', user);
    
    // 4. Notificar
    emailService.send(email, 'Welcome!');
    
    return user;
  }
}
```

Responsabilidades identificadas:
1. **Validação de dados** → `UserValidator`
2. **Criptografia** → `PasswordHasher`
3. **Persistência** → `UserRepository`
4. **Notificação** → `WelcomeEmailService`

#### Passo 2: Extrair Cada Responsabilidade

```typescript
// 1. Validação
class UserValidator {
  validate(data: CreateUserDTO): ValidationResult {
    const errors: string[] = [];
    if (!data.email.includes('@')) errors.push('Invalid email');
    if (data.password.length < 8) errors.push('Password too short');
    if (!data.name) errors.push('Name required');
    return { isValid: errors.length === 0, errors };
  }
}

// 2. Criptografia
class PasswordHasher {
  hash(password: string): string {
    return bcrypt.hashSync(password, 10);
  }
  
  verify(password: string, hash: string): boolean {
    return bcrypt.compareSync(password, hash);
  }
}

// 3. Persistência
class UserRepository {
  async create(user: User): Promise<User> {
    return await db.insert('users', user);
  }
  
  async findByEmail(email: string): Promise<User | null> {
    return await db.findOne('users', { email });
  }
}

// 4. Notificação
class WelcomeEmailService {
  async sendWelcomeEmail(user: User): Promise<void> {
    await emailService.send(user.email, {
      subject: 'Welcome!',
      template: 'welcome',
      data: { name: user.name }
    });
  }
}
```

#### Passo 3: Coordenar com um Serviço de Orquestração

```typescript
class UserService {
  constructor(
    private validator: UserValidator,
    private passwordHasher: PasswordHasher,
    private userRepository: UserRepository,
    private emailService: WelcomeEmailService
  ) {}
  
  async createUser(data: CreateUserDTO): Promise<User> {
    // 1. Validar
    const validation = this.validator.validate(data);
    if (!validation.isValid) {
      throw new ValidationError(validation.errors);
    }
    
    // 2. Hash senha
    const hashedPassword = this.passwordHasher.hash(data.password);
    
    // 3. Persistir
    const user = await this.userRepository.create({
      email: data.email,
      password: hashedPassword,
      name: data.name
    });
    
    // 4. Notificar (assincronamente, não bloqueia)
    this.emailService.sendWelcomeEmail(user).catch(error => {
      logger.error('Failed to send welcome email', { userId: user.id, error });
    });
    
    return user;
  }
}
```

### Benefícios Imediatos

**Testabilidade:**
```typescript
// Testar validação sozinha
it('should validate email format', () => {
  const validator = new UserValidator();
  const result = validator.validate({ email: 'invalid', ... });
  expect(result.isValid).toBe(false);
});

// Testar hashing sozinho
it('should hash password correctly', () => {
  const hasher = new PasswordHasher();
  const hash = hasher.hash('password123');
  expect(hasher.verify('password123', hash)).toBe(true);
});

// Testar serviço com mocks
it('should create user and send email', async () => {
  const mockRepository = mock(UserRepository);
  const mockEmailService = mock(WelcomeEmailService);
  
  const service = new UserService(
    new UserValidator(),
    new PasswordHasher(),
    mockRepository,
    mockEmailService
  );
  
  await service.createUser({ email: 'test@test.com', ... });
  
  expect(mockRepository.create).toHaveBeenCalled();
  expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalled();
});
```

**Modificabilidade:**
- Trocar de bcrypt para Argon2? Só muda `PasswordHasher`.
- Trocar de SendGrid para Mailgun? Só muda `WelcomeEmailService`.
- Mudar validação? Só muda `UserValidator`.

---

## SEÇÃO 5: TRADE-OFFS E CONTEXTO (15 minutos)

### Quando Não Separar

SRP não significa "uma classe por função". Há casos onde manter junto faz sentido:

#### 1. Protótipos e Prototipagem Rápida
```typescript
// Na prototipagem, está OK ter tudo junto:
class QuickLessonAPI {
  async handleGetLesson(req, res) {
    const lessonData = await db.query('SELECT * FROM lessons WHERE id = ?', req.params.id);
    const html = `<div>${lessonData.content}</div>`;
    res.send(html);
  }
}

// Quando protótipo vira produção, refatore.
```

#### 2. Classes Muito Pequenas
```typescript
// Essa classe é tão pequena que separar é overhead:
class Email {
  to: string;
  subject: string;
  body: string;
  
  validate(): boolean {
    return this.to.includes('@') && this.subject && this.body;
  }
}

// "Email" tem uma responsabilidade: representar um e-mail validado.
// Validação é parte integral da representação.
// Separar em EmailValidator seria overengineering.
```

#### 3. Conceitos Muito Acoplados por Natureza
```typescript
// Login: autenticação + sessão estão intrinsecamente ligadas
class AuthenticationService {
  authenticate(email, password): Session {
    const user = this.findUser(email);
    if (!this.passwordHasher.verify(password, user.passwordHash)) {
      throw new AuthenticationError();
    }
    return this.sessionService.createSession(user);
  }
}

// Separar em PasswordVerifier e SessionCreator adiciona complexidade
// sem valor real. Juntas, elas têm uma razão para mudar:
// "autenticação falhou e agora precisa fazer X"
```

### O Teste de SRP

**Pergunta de teste:** "Se eu só quiser usar Y da classe, posso remover X sem quebrar Y?"

**Exemplo 1: UserValidator**
- Pergunta: "Se só quero validação, posso remover password hashing?"
- Resposta: "Sim, são independentes."
- Conclusão: **SRP está OK.**

**Exemplo 2: UserManager Original**
- Pergunta: "Se só quero criar usuário, posso remover envio de e-mail?"
- Resposta: "Não, porque createUser() chama emailService.send()."
- Conclusão: **Viola SRP.**

### Coesão vs. Acoplamento

SRP melhora:
- **Coesão interna** (métodos da classe trabalham juntos).
- **Baixo acoplamento** (a classe não depende de muitas outras).

```typescript
// Alto acoplamento (viola SRP):
class UserManager {
  // Depende de: DB, Email, Payment, Analytics, Logger
  // Baixa coesão: métodos não trabalham bem juntos
}

// Baixo acoplamento (segue SRP):
class UserRepository {
  // Depende apenas de: DB
  // Alta coesão: todos os métodos lidam com persistência
}
```

---

## SEÇÃO 6: SÍNTESE E PADRÕES PRÁTICOS (20 minutos)

### Padrões Que Emerem de SRP

#### 1. Repository Pattern
```typescript
class UserRepository {
  async create(user: User): Promise<User> { /* ... */ }
  async findById(id: string): Promise<User> { /* ... */ }
  async update(user: User): Promise<void> { /* ... */ }
  async delete(id: string): Promise<void> { /* ... */ }
}
```

**Responsabilidade:** Abstrair persistência.

#### 2. Service Pattern
```typescript
class UserService {
  constructor(
    private repository: UserRepository,
    private validator: UserValidator,
    private notificationService: NotificationService
  ) {}
  
  async createUser(data: CreateUserDTO): Promise<User> {
    // Orquestra validação, persistência, notificação
  }
}
```

**Responsabilidade:** Coordenar lógica de negócio.

#### 3. Validator Pattern
```typescript
class UserValidator {
  validate(data: CreateUserDTO): ValidationResult { /* ... */ }
}
```

**Responsabilidade:** Validar dados.

#### 4. Mapper/DTO Pattern
```typescript
class UserResponseMapper {
  toResponse(user: User): UserResponse {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      // Oculta passwordHash, timestamps internos, etc.
    };
  }
}
```

**Responsabilidade:** Transformar domínio em resposta API.

### Checklist de Refatoração

Quando você tem uma classe grande:

```
[ ] Identifiquei cada "razão para mudar"?
[ ] Cada razão pode ser extraída em uma classe separada?
[ ] A nova classe tem apenas essa responsabilidade?
[ ] Posso testar cada classe independentemente?
[ ] Os nomes das classes descrevem claramente sua responsabilidade?
[ ] Uma mudança em uma classe não afeta as outras?
[ ] A composição das classes no serviço de orquestração faz sentido?
```

---

## RESUMO EXECUTIVO

**SRP em Uma Frase:**
Uma classe deve ter uma razão para mudar. Se tem múltiplas razões, tem múltiplas responsabilidades, e deveria ser dividida.

**Sintomas de Violação:**
- Múltiplos métodos não relacionados.
- Nome genérico ("Manager", "Processor").
- Testes precisam de muitos mocks.
- Mudança simples afeta múltiplas funcionalidades.

**Refatoração:**
1. Identificar cada responsabilidade.
2. Extrair em classes separadas.
3. Coordenar com um serviço.
4. Testar isoladamente.

**Benefícios:**
- Código mais testável.
- Mais fácil de modificar.
- Mais fácil de entender.
- Reutilizável em novos contextos.

**Trade-offs:**
- Mais classes = mais complexidade estrutural (temporária).
- Prototipagem pode sofrer (intencionalmente).
- Nem sempre vale a pena separar (classes muitíssimo pequenas).

**Próximo:** Outros princípios SOLID (Open/Closed, Liskov, Interface Segregation, Dependency Inversion) multiplicam esses benefícios.
