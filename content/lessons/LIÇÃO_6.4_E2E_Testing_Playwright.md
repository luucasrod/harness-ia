# LIÇÃO 6.4: E2E Testing with Playwright - Do Browser ao Código

**Duração:** 200 minutos (3h 20min)  
**Nível:** Intermediário-Avançado  
**Foco:** Testar aplicação do ponto de vista do usuário  
**Público-alvo:** Engenheiros que precisam validar fluxos reais do browser

---

## ÍNDICE
1. [Setup Playwright](#seção-1-setup-playwright-20-min)
2. [Locating Elements](#seção-2-locating-elements-30-min)
3. [Interactions e Assertions](#seção-3-interactions-e-assertions-40-min)
4. [Esperar Elementos e Redes](#seção-4-esperar-elementos-e-redes-30-min)
5. [Authentication e Fixtures](#seção-5-authentication-e-fixtures-30-min)
6. [Anti-patterns e Best Practices](#seção-6-anti-patterns-e-best-practices-20-min)
7. [Quiz & Exercício Prático](#quiz--exercício-prático)

---

## Seção 1: Setup Playwright (20 min)

### Instalação

```bash
npm install -D @playwright/test

# Gera exemplo de config
npx playwright install
```

### Configuração Básica (playwright.config.ts)

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry", // Captura trace de falhas
    screenshot: "only-on-failure", // Screenshot em falhas
    video: "retain-on-failure", // Video da falha
  },
  
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
  
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
  ],
});
```

### Primeiro Teste

```typescript
// e2e/login.spec.ts
import { test, expect } from "@playwright/test";

test("user can login", async ({ page }) => {
  await page.goto("/login");
  
  await page.fill('input[name="email"]', "user@test.com");
  await page.fill('input[name="password"]', "password123");
  await page.click('button[type="submit"]');
  
  await expect(page).toHaveURL("/dashboard");
  await expect(page.locator("h1")).toContainText("Welcome");
});

// Rodar:
// npx playwright test
// npx playwright test --debug (com debugger)
// npx playwright test --headed (com browser visível)
```

---

## Seção 2: Locating Elements (30 min)

### Estratégias de Locator

```typescript
test("different locator strategies", async ({ page }) => {
  // CSS Selector (menos estável, pode quebrar com redesign)
  await page.click("button.submit-btn");
  
  // XPath (poderoso mas complexo)
  await page.click("//button[@class='submit-btn']");
  
  // Text (mais robusto, usa o que o usuário vê)
  await page.click('text="Sign In"');
  
  // Atributo (estável se bem designado)
  await page.click('[data-testid="submit"]');
  
  // Combinações
  await page.click("button:has-text('Next')");
  await page.click("div.form >> input");
});
```

### Locators de Teste (Recomendado)

```typescript
// ✅ NO CÓDIGO (src/components/LoginForm.tsx):
export function LoginForm() {
  return (
    <form>
      <input
        type="email"
        data-testid="email-input"
        placeholder="Email"
      />
      <input
        type="password"
        data-testid="password-input"
        placeholder="Password"
      />
      <button data-testid="login-button" type="submit">
        Sign In
      </button>
    </form>
  );
}

// ✅ NO TESTE:
test("login form", async ({ page }) => {
  await page.fill('[data-testid="email-input"]', "test@test.com");
  await page.fill('[data-testid="password-input"]', "pass");
  await page.click('[data-testid="login-button"]');
});

// Usar getByTestId para sintaxe mais limpa:
test("login with getByTestId", async ({ page }) => {
  await page.getByTestId("email-input").fill("test@test.com");
  await page.getByTestId("password-input").fill("pass");
  await page.getByTestId("login-button").click();
});
```

### Locators com Role (Acessibilidade)

```typescript
test("using ARIA roles", async ({ page }) => {
  // Mais semântico, melhora acessibilidade
  await page.getByRole("textbox", { name: "Email" }).fill("test@test.com");
  await page.getByRole("button", { name: "Sign In" }).click();
  
  // Validar estrutura:
  const main = page.getByRole("main");
  const heading = main.getByRole("heading");
  await expect(heading).toHaveText("Dashboard");
});
```

### Escopo de Locators

```typescript
test("locating within elements", async ({ page }) => {
  // Procura em toda página
  const emailInput = page.locator('input[type="email"]');
  
  // Procura dentro de elemento específico
  const form = page.locator("form.login-form");
  const emailInForm = form.locator('input[type="email"]');
  
  // Encadeamento com getBy*
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Close" }).click();
});
```

---

## Seção 3: Interactions e Assertions (40 min)

### Preenchimento de Formulário

```typescript
test("form interactions", async ({ page }) => {
  const emailField = page.getByTestId("email-input");
  
  // Focar
  await emailField.focus();
  
  // Digitar (caractere por caractere, como usuário)
  await emailField.type("john@example.com");
  
  // Preencher (substitui conteúdo)
  await emailField.fill("jane@example.com");
  
  // Clear
  await emailField.clear();
  
  // Pressionar tecla
  await emailField.press("Tab"); // Move para próximo campo
  
  // Pressionar múltiplas teclas
  await page.keyboard.press("Control+A"); // Seleciona tudo
  await page.keyboard.press("Delete"); // Delete seleção
});
```

### Seleção e Checkboxes

```typescript
test("select and checkbox interactions", async ({ page }) => {
  // Select dropdown
  await page.selectOption('select[name="difficulty"]', "easy");
  await page.selectOption('select[name="difficulty"]', { label: "Easy" });
  
  // Checkbox
  await page.check('input[type="checkbox"]');
  await page.uncheck('input[type="checkbox"]');
  await page.isChecked('input[type="checkbox"]'); // Boolean
  
  // Radio button
  await page.click('input[type="radio"][value="option-1"]');
});
```

### Assertions

```typescript
test("assertions", async ({ page }) => {
  const button = page.getByTestId("submit");
  
  // Visibilidade
  await expect(button).toBeVisible();
  await expect(button).toBeHidden();
  
  // Habilitação
  await expect(button).toBeEnabled();
  await expect(button).toBeDisabled();
  
  // Conteúdo
  await expect(button).toHaveText("Submit");
  await expect(button).toContainText("mit");
  
  // Atributos
  await expect(button).toHaveAttribute("type", "submit");
  
  // Valor de input
  const input = page.getByTestId("email-input");
  await expect(input).toHaveValue("test@test.com");
  
  // Classes CSS
  await expect(button).toHaveClass("btn-primary");
  
  // URL e título
  await expect(page).toHaveURL("/dashboard");
  await expect(page).toHaveTitle("Dashboard - My App");
  
  // Contagem
  const items = page.locator(".lesson-item");
  await expect(items).toHaveCount(5);
});
```

### Exemplo Real: Fluxo de Conclusão de Lição

```typescript
test("student completes lesson and sees updated progress", async ({ page }) => {
  // Faz login
  await page.goto("/login");
  await page.getByTestId("email-input").fill("student@test.com");
  await page.getByTestId("password-input").fill("password");
  await page.getByTestId("login-button").click();
  
  // Espera dashboard carregar
  await expect(page).toHaveURL("/dashboard");
  
  // Clica em lição
  await page.getByRole("link", { name: /Module 1/ }).click();
  
  // Espera conteúdo da lição carregar
  await expect(page.getByRole("heading")).toContainText("Module 1");
  
  // Scrolls para ver quiz
  await page.locator("[data-testid='quiz-section']").scrollIntoViewIfNeeded();
  
  // Preenche quiz
  await page.getByRole("radio", { name: "Option A" }).click();
  await page.getByRole("radio", { name: "Option B" }).click(); // Segunda questão
  
  // Submete quiz
  await page.getByRole("button", { name: "Submit Quiz" }).click();
  
  // Espera feedback
  await expect(page.locator(".success-message"))
    .toContainText("Great job!");
  
  // Valida progresso foi atualizado
  const progress = page.locator("[data-testid='progress-bar']");
  await expect(progress).toHaveAttribute("aria-valuenow", "20"); // 1 de 5 lições
  
  // Volta ao dashboard
  await page.getByRole("link", { name: "Dashboard" }).click();
  
  // Valida que lição aparece como completa
  const completedLesson = page.locator(
    "[data-testid='lesson-item'][data-lesson-id='module-1']"
  );
  await expect(completedLesson).toHaveClass(/completed/);
});
```

---

## Seção 4: Esperar Elementos e Redes (30 min)

### Waits Implícitos (Recomendado)

```typescript
// ✅ MELHOR: Playwright espera automaticamente
test("implicit waits", async ({ page }) => {
  // Espera até 30 segundos por elemento aparecer
  const element = page.getByTestId("results");
  await element.click(); // Espera estar visível
  
  // Espera URL mudar
  await page.click('a[href="/next-page"]');
  await expect(page).toHaveURL("/next-page"); // Espera implicitamente
  
  // Espera elemento desaparecer
  const spinner = page.locator(".spinner");
  await expect(spinner).not.toBeVisible(); // Espera desaparecer
});
```

### Waits Explícitos

```typescript
test("explicit waits for specific conditions", async ({ page }) => {
  // Esperar elemento estar visível
  await page.waitForSelector("[data-testid='results']", { 
    timeout: 10000 
  });
  
  // Esperar função retornar true
  await page.waitForFunction(() => {
    return document.querySelectorAll(".item").length > 0;
  });
  
  // Esperar navegação
  await page.waitForNavigation();
  
  // Esperar elemento desaparecer
  await page.waitForSelector("[data-testid='loader']", {
    state: "hidden"
  });
  
  // Esperar request específico
  const responsePromise = page.waitForResponse(/api\/lessons/);
  await page.click("[data-testid='load-lessons']");
  const response = await responsePromise;
  expect(response.status()).toBe(200);
});
```

### Monitorando Network

```typescript
test("intercepts and validates API calls", async ({ page }) => {
  // Monitora requisição
  const requestPromise = page.waitForRequest("/api/student/progress");
  
  // Faz ação que dispara requisição
  await page.goto("/dashboard");
  
  // Valida requisição
  const request = await requestPromise;
  expect(request.method()).toBe("GET");
  expect(request.url()).toContain("student-id");
});

test("mocks API response", async ({ page }) => {
  // Intercepta e retorna resposta fake
  await page.route("/api/lessons", route => {
    route.abort("failed"); // Simula erro de rede
  });
  
  await page.goto("/lessons");
  
  // Valida que erro foi exibido
  await expect(page.locator(".error-message"))
    .toContainText("Failed to load lessons");
});

test("modifies response", async ({ page }) => {
  await page.route("/api/student/progress", async route => {
    const response = await route.fetch();
    const json = await response.json();
    
    // Modifica resposta
    json.progressPercentage = 100;
    
    await route.fulfill({ response, body: JSON.stringify(json) });
  });
  
  await page.goto("/dashboard");
  
  // Valida que progresso foi modificado
  await expect(page.locator(".progress-label"))
    .toContainText("100%");
});
```

### Exemplo: Fluxo com Espera de Dados

```typescript
test("load and display course modules", async ({ page }) => {
  // Espera request de módulos
  const modulesResponse = page.waitForResponse(/api\/courses\/\d+\/modules/);
  
  await page.goto("/courses/1");
  
  // Espera spinner desaparecer
  await expect(page.locator(".spinner")).not.toBeVisible();
  
  // Valida que dados foram carregados
  const response = await modulesResponse;
  expect(response.status()).toBe(200);
  
  // Valida que módulos aparecem
  const modules = page.locator("[data-testid='module-item']");
  await expect(modules).toHaveCount(3);
});
```

---

## Seção 5: Authentication e Fixtures (30 min)

### Login Compartilhado com Fixtures

```typescript
// e2e/auth.setup.ts
import { test as setup } from "@playwright/test";

const authFile = "playwright/.auth/user.json";

setup("authenticate", async ({ page }) => {
  // Faz login
  await page.goto("/login");
  await page.getByTestId("email-input").fill("user@test.com");
  await page.getByTestId("password-input").fill("password123");
  await page.getByTestId("login-button").click();
  
  // Espera redirecionamento
  await page.waitForURL("/dashboard");
  
  // Salva cookies/session
  await page.context().storageState({ path: authFile });
});

// playwright.config.ts
export default defineConfig({
  use: {
    // Usa cookies/session salvos
    storageState: authFile,
  },
  webServer: { /* ... */ },
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup/,
    },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
  ],
});

// e2e/dashboard.spec.ts
test("shows user dashboard", async ({ page }) => {
  // Já logado (via fixture)
  await page.goto("/dashboard");
  
  // Testa o que queremos
  await expect(page.getByRole("heading"))
    .toContainText("Welcome, User!");
});
```

### Fixtures Reutilizáveis

```typescript
// e2e/fixtures.ts
import { test as base } from "@playwright/test";

type TestFixtures = {
  enrolledStudent: void;
  completedCourse: void;
};

export const test = base.extend<TestFixtures>({
  enrolledStudent: async ({ page }, use) => {
    // Setup: cria estudante e enrola em curso
    await page.goto("/api/test/setup", {
      waitUntil: "networkidle"
    });
    
    const response = await page.evaluate(() =>
      fetch("/api/test/create-student", {
        method: "POST",
        body: JSON.stringify({
          email: "test@test.com",
          name: "Test Student"
        })
      }).then(r => r.json())
    );
    
    const studentId = response.id;
    
    // Use fixture
    await use();
    
    // Cleanup
    await page.evaluate((id) =>
      fetch(`/api/test/cleanup/${id}`, { method: "DELETE" }),
      studentId
    );
  },
  
  completedCourse: async ({ page, enrolledStudent }, use) => {
    // Build on previous fixture
    await page.goto("/courses/1");
    
    // Completa todas as lições
    const lessons = page.locator("[data-testid='lesson-item']");
    const count = await lessons.count();
    
    for (let i = 0; i < count; i++) {
      await lessons.nth(i).click();
      await page.getByTestId("complete-button").click();
    }
    
    await use();
  }
});

export { expect } from "@playwright/test";

// e2e/course.spec.ts
import { test, expect } from "./fixtures";

test("shows certificate for completed course", async ({
  page,
  completedCourse
}) => {
  await page.goto("/dashboard");
  
  const certificate = page.locator("[data-testid='certificate']");
  await expect(certificate).toBeVisible();
  await expect(certificate).toContainText("Course Completed");
});
```

---

## Seção 6: Anti-patterns e Best Practices (20 min)

### Anti-patterns Comuns

```typescript
// ❌ ERRADO 1: Hard-coded sleeps
test("bad wait", async ({ page }) => {
  await page.click("button");
  await page.waitForTimeout(2000); // ❌ Sempre espera 2s!
  
  const result = page.locator(".result");
  await expect(result).toBeVisible();
});

// ✅ CORRETO: Aguardar elemento
test("good wait", async ({ page }) => {
  await page.click("button");
  
  const result = page.locator(".result");
  await expect(result).toBeVisible(); // Espera até aparecer
});

// ❌ ERRADO 2: Testes interdependentes
let globalUserId: string;

test("create user", async ({ page }) => {
  await page.goto("/admin/users/create");
  // ...
  globalUserId = extractedId;
});

test("edit user", async ({ page }) => {
  // Depende do teste anterior!
  await page.goto(`/admin/users/${globalUserId}/edit`);
});

// ✅ CORRETO: Testes independentes
test("can create and edit user", async ({ page }) => {
  // Create
  await page.goto("/admin/users/create");
  await page.getByTestId("name-input").fill("John");
  await page.getByTestId("submit").click();
  
  // Extract ID
  const userId = await page.evaluate(() =>
    new URL(window.location.href).searchParams.get("id")
  );
  
  // Edit
  await page.goto(`/admin/users/${userId}/edit`);
  await page.getByTestId("name-input").fill("Jane");
  await page.getByTestId("submit").click();
  
  // Validate
  await expect(page.locator(".success-message"))
    .toContainText("Updated");
});

// ❌ ERRADO 3: Testar tudo via E2E
test("all course features", async ({ page }) => {
  // Testa: signup, login, enrollment, quiz, completion
  // Muito lento, frágil, difícil debugar
});

// ✅ CORRETO: E2E testa só fluxo crítico
test("student can complete lesson", async ({ page }) => {
  // Setup: já logado via fixture
  // Testa apenas: navigate → complete
  
  await page.goto("/lessons/1");
  await page.getByTestId("complete-button").click();
  await expect(page).toHaveURL("/lessons/2");
});

// Testa regras de negócio em unit tests
test("quiz requires 70% to pass", () => {
  expect(passesQuiz(65)).toBe(false);
  expect(passesQuiz(70)).toBe(true);
});
```

### Best Practices

```typescript
// ✅ BOM 1: Usar data-testid para estabilidade
test("submit form", async ({ page }) => {
  // Sobrevive mudanças de CSS/HTML
  await page.getByTestId("email-input").fill("test@test.com");
  await page.getByTestId("submit-button").click();
});

// ✅ BOM 2: Testar comportamento, não implementação
test("shows error for invalid email", async ({ page }) => {
  await page.getByTestId("email-input").fill("invalid");
  await page.getByTestId("submit-button").click();
  
  // Testa o que usuário vê, não como funciona
  await expect(page.getByRole("alert"))
    .toContainText("Invalid email");
});

// ✅ BOM 3: Usar roles para acessibilidade
test("can navigate with keyboard", async ({ page }) => {
  await page.goto("/form");
  
  // Tab: foco no email
  await page.keyboard.press("Tab");
  await page.keyboard.type("test@test.com");
  
  // Tab: foco no password
  await page.keyboard.press("Tab");
  await page.keyboard.type("password");
  
  // Enter: submete
  await page.keyboard.press("Enter");
  
  await expect(page).toHaveURL("/dashboard");
});

// ✅ BOM 4: Parallel execution
// playwright.config.ts - já paralelo por padrão
// Testes precisam ser isolados!

export default defineConfig({
  fullyParallel: true, // Todos rodam simultaneamente
  workers: 4, // 4 workers
});
```

---

## Quiz & Exercício Prático

### Questão 1: Locators
Qual locator é mais robusto a mudanças de UI?

a) CSS: `.btn.primary`  
b) XPath: `//button[@class='btn primary']`  
c) Text: `'Submit'`  
d) TestID: `[data-testid='submit']`  

**Resposta:** d) - Não quebra se CSS mudar

---

### Questão 2: Waits
O que está errado?

```typescript
test("loads data", async ({ page }) => {
  await page.click("button");
  await page.waitForTimeout(5000);
  const data = await page.textContent(".result");
});
```

**Resposta:** Hardcoded sleep é frágil. Deveria:
```typescript
const result = page.locator(".result");
await expect(result).toBeVisible(); // Espera aparecer
const data = await result.textContent();
```

---

### Questão 3: Auth
Por que usar fixtures para autenticação?

**Resposta:** 
- Não repete login em cada teste
- Reutiliza session/cookies
- Testes rodam mais rápido
- Login é testado uma vez, não 100 vezes

---

### Questão 4: Anti-pattern
Qual é o problema?

```typescript
test("creates and views user", async ({ page }) => {
  // Passo 1: cria
  // Passo 2: visualiza
  // Passo 3: edita
  // Passo 4: deleta
});
```

**Resposta:** Um teste para tudo. Se falhar no passo 3, não sabemos se passo 1 e 2 funcionam. Dividir em testes menores.

---

### Questão 5: Cenário Real
Seu teste é flaky. Às vezes passa, às vezes falha. O que pode ser?

**Resposta:**
- Race condition (elemento não está pronto)
- Ordem de testes (estado compartilhado)
- Timing (rede lenta)
- Selector frágil (HTML mudou)

Solução: usar `expect()` que espera automaticamente, isolar testes, usar data-testid.

---

### Exercício Prático: E2E Test Suite Completo

**Objetivo:** Escrever suite E2E para plataforma educacional

**Cenários para Testar:**

1. ✅ Login com credenciais corretas
2. ✅ Erro ao fazer login com credenciais inválidas
3. ✅ Visualizar lista de cursos
4. ✅ Enrolar em um curso
5. ✅ Começar uma lição
6. ✅ Responder quiz
7. ✅ Ver progresso atualizado

**Estrutura esperada:**

```typescript
// e2e/auth.setup.ts
setup("authenticate", async ({ page }) => {
  // Login de teste
});

// e2e/dashboard.spec.ts
test("shows user dashboard after login", async ({ page }) => {
  // Seu teste aqui
});

test("displays all courses", async ({ page }) => {
  // Seu teste aqui
});

// e2e/lesson.spec.ts
test("complete lesson flow", async ({ page }) => {
  // 1. Enrola em curso
  // 2. Acessa lição
  // 3. Responde quiz
  // 4. Valida progresso
});

// e2e/error-handling.spec.ts
test("shows error for invalid login", async ({ page }) => {
  // Seu teste aqui
});

test("shows error when course not found", async ({ page }) => {
  // Seu teste aqui
});
```

**Dicas:**
- Use auth.setup.ts para login
- Use data-testid para selectors
- Cada teste independente
- Use waitFor implícito (expect)
- Mocka chamadas de API quando necessário

---

**Tempo Total:** 200 minutos  
**Próxima Lição:** 6.5 - Performance Testing
