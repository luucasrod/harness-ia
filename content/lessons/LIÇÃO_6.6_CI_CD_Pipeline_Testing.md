# LIÇÃO 6.6: CI/CD Pipeline & Deployment Testing - Automação Completa

**Duração:** 200 minutos (3h 20min)  
**Nível:** Avançado  
**Foco:** Integrar testes em pipeline, deployment automático seguro  
**Público-alvo:** Engenheiros que querem qualidade garantida antes de produção

---

## ÍNDICE
1. [GitHub Actions Fundações](#seção-1-github-actions-fundações-30-min)
2. [Pipeline de Testes](#seção-2-pipeline-de-testes-40-min)
3. [Deployment Seguro com Testes](#seção-3-deployment-seguro-com-testes-35-min)
4. [Monitoramento Pós-Deployment](#seção-4-monitoramento-pós-deployment-30-min)
5. [Rollback e Recovery](#seção-5-rollback-e-recovery-25-min)
6. [Observabilidade em Testes](#seção-6-observabilidade-em-testes-20-min)
7. [Quiz & Exercício Prático](#quiz--exercício-prático)

---

## Seção 1: GitHub Actions Fundações (30 min)

### Conceitos Básicos

```yaml
# .github/workflows/test.yml
name: Test Suite

# Quando rodar
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

# Jobs executam em paralelo
jobs:
  test:
    runs-on: ubuntu-latest
    
    # Steps executam sequencialmente
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:int
      - run: npm run test:e2e
```

### Matriz de Testes (Teste em Múltiplos Contextos)

```yaml
# .github/workflows/matrix-test.yml
name: Test Matrix

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    # Testa em múltiplas versões
    strategy:
      matrix:
        node-version: [16, 18, 20]
        database: [postgres, mysql]
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
      
      - run: npm ci
      - run: npm run test
        env:
          DATABASE_URL: postgres://postgres:test@localhost:5432/test
          DATABASE_TYPE: ${{ matrix.database }}
```

### Resultado: Matriz de Testes

```
✅ Node 16 + PostgreSQL: All tests passed
✅ Node 16 + MySQL: All tests passed
❌ Node 18 + PostgreSQL: 2 tests failed (async issue)
✅ Node 18 + MySQL: All tests passed
✅ Node 20 + PostgreSQL: All tests passed
✅ Node 20 + MySQL: All tests passed

1 failure found! (Node 18 + PostgreSQL)
PR blocked until fixed
```

---

## Seção 2: Pipeline de Testes (40 min)

### Pipeline Completo: Lint → Unit → Integration → E2E

```yaml
# .github/workflows/full-pipeline.yml
name: Full Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  # Etapa 1: Lint & Format
  lint:
    name: Lint & Format
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      
      - run: npm ci
      
      - run: npm run lint
        continue-on-error: false
      
      - run: npm run format:check
      
      - name: Comment on PR if lint fails
        if: failure()
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '❌ Lint failed. Run `npm run format` to fix.'
            })
  
  # Etapa 2: Build
  build:
    name: Build
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      
      - run: npm ci
      
      - run: npm run build
      
      - uses: actions/upload-artifact@v3
        with:
          name: build-artifact
          path: dist/
  
  # Etapa 3: Unit Tests
  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      
      - run: npm ci
      
      - run: npm run test:unit -- --coverage
      
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
          flags: unittests
  
  # Etapa 4: Integration Tests
  integration-tests:
    name: Integration Tests
    runs-on: ubuntu-latest
    needs: build
    
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_DB: test_db
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      
      - run: npm ci
      
      - run: npm run test:integration
        env:
          DATABASE_URL: postgres://test:test@localhost:5432/test_db
  
  # Etapa 5: E2E Tests
  e2e-tests:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: build
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      
      - run: npm ci
      
      - run: npm run build
      
      - run: npx playwright install --with-deps
      
      - run: npm run test:e2e
      
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: e2e-artifacts
          path: e2e/results/
  
  # Etapa 6: Performance Tests (opcional)
  performance:
    name: Performance Tests
    runs-on: ubuntu-latest
    needs: build
    if: github.event_name == 'pull_request'
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      
      - run: npm ci
      
      - run: npm run build
      
      - run: npm run start &
      
      - run: npm run test:performance
      
      - name: Comment performance results
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const perf = JSON.parse(fs.readFileSync('perf-results.json', 'utf8'));
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `📊 Performance Results:\n\`\`\`\n${JSON.stringify(perf, null, 2)}\n\`\`\``
            })

# Resultado da pipeline:
# ✅ Lint passed
# ✅ Build succeeded
# ✅ Unit tests: 523 tests, 99.2% coverage
# ✅ Integration tests: 87 tests passed
# ✅ E2E tests: 12 critical paths passed
# ✅ Performance: P99 < 400ms
# 
# ✅ ALL CHECKS PASSED - Ready to merge
```

### Condições e Proteções

```yaml
# Branch protection rules (Settings → Branches)
- Require status checks to pass before merging
  └─ Lint ✓
  └─ Build ✓
  └─ Unit tests ✓
  └─ E2E tests ✓
  └─ Code review approved ✓

- Require branches to be up to date
- Dismiss stale pull request approvals
```

---

## Seção 3: Deployment Seguro com Testes (35 min)

### Deployment com Verificações

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test-and-deploy:
    runs-on: ubuntu-latest
    
    environment:
      name: production
      url: https://app.example.com
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      
      - run: npm ci
      
      # Etapa 1: Testes (gate before deploy)
      - run: npm run lint
      - run: npm run test:unit
      - run: npm run test:integration
      
      # Etapa 2: Build
      - run: npm run build
      
      # Etapa 3: Smoke tests (validar build)
      - run: npm run test:smoke
      
      # Etapa 4: Deploy
      - name: Deploy to Production
        run: |
          npm install -g vercel
          vercel deploy --prod --token=${{ secrets.VERCEL_TOKEN }}
      
      # Etapa 5: Validação pós-deploy
      - name: Run post-deployment tests
        run: npm run test:smoke -- --url https://app.example.com
      
      - name: Notify on success
        if: success()
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '🚀 Deployed to production successfully!'
            })
      
      - name: Notify on failure
        if: failure()
        run: |
          echo "❌ Deployment failed!"
          exit 1
```

### Smoke Tests (Validar Deploy)

```typescript
// test/smoke.ts
import { expect } from "@playwright/test";
import { test } from "@playwright/test";

test("website loads", async ({ page }) => {
  const baseUrl = process.env.APP_URL || "http://localhost:3000";
  
  await page.goto(baseUrl);
  await expect(page).toHaveTitle(/Dashboard|Login/);
});

test("API health check", async ({ request }) => {
  const baseUrl = process.env.API_URL || "http://localhost:3000";
  
  const response = await request.get(`${baseUrl}/health`);
  expect(response.status()).toBe(200);
  
  const json = await response.json();
  expect(json).toMatchObject({
    status: "ok",
    version: expect.any(String)
  });
});

test("database connection works", async ({ request }) => {
  const response = await request.get("http://localhost:3000/api/health/db");
  
  expect(response.status()).toBe(200);
  
  const json = await response.json();
  expect(json.database).toBe("connected");
});

test("critical endpoints respond", async ({ request }) => {
  const endpoints = [
    "/api/lessons",
    "/api/students",
    "/api/progress"
  ];
  
  for (const endpoint of endpoints) {
    const response = await request.get(
      `http://localhost:3000${endpoint}`,
      {
        headers: {
          Authorization: `Bearer test-token`
        }
      }
    );
    
    expect([200, 401, 403]).toContain(response.status());
  }
});
```

### Canary Deployment (Risco Controlado)

```yaml
# .github/workflows/canary-deploy.yml
name: Canary Deployment

on:
  workflow_run:
    workflows: ["Full Pipeline"]
    types: [completed]
    branches: [main]

jobs:
  canary:
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Canary (5% traffic)
        run: |
          kubectl set image deployment/app-canary \
            app=myapp:${{ github.sha }} \
            --record
      
      - name: Monitor canary metrics
        run: |
          sleep 60
          npm run test:smoke -- --url https://canary.example.com
      
      - name: Check error rate
        run: |
          ERROR_RATE=$(curl https://metrics.example.com/api/canary-error-rate)
          if (( $(echo "$ERROR_RATE > 5" | bc -l) )); then
            echo "❌ Error rate too high: $ERROR_RATE%"
            exit 1
          fi
      
      - name: If canary OK, deploy to production (100%)
        if: success()
        run: |
          kubectl set image deployment/app-prod \
            app=myapp:${{ github.sha }} \
            --record
      
      - name: If canary fails, rollback
        if: failure()
        run: |
          kubectl rollout undo deployment/app-canary
          echo "🔄 Canary rolled back"
```

---

## Seção 4: Monitoramento Pós-Deployment (30 min)

### Alertas e Dashboards

```yaml
# .github/workflows/post-deploy-monitor.yml
name: Post-Deployment Monitoring

on:
  workflow_run:
    workflows: ["Deploy"]
    types: [completed]
    branches: [main]

jobs:
  monitor:
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Wait for deployment to stabilize
        run: sleep 30
      
      - name: Fetch metrics
        id: metrics
        run: |
          curl -s https://metrics.example.com/api/deployment/latest > metrics.json
          ERROR_RATE=$(jq '.error_rate' metrics.json)
          P99=$(jq '.p99' metrics.json)
          
          echo "error_rate=$ERROR_RATE" >> $GITHUB_OUTPUT
          echo "p99=$P99" >> $GITHUB_OUTPUT
      
      - name: Check SLO
        run: |
          ERROR_RATE=${{ steps.metrics.outputs.error_rate }}
          P99=${{ steps.metrics.outputs.p99 }}
          
          echo "Error Rate: $ERROR_RATE%"
          echo "P99 Latency: ${P99}ms"
          
          if (( $(echo "$ERROR_RATE > 1" | bc -l) )); then
            echo "❌ Error rate exceeded SLO!"
            exit 1
          fi
          
          if (( $(echo "$P99 > 500" | bc -l) )); then
            echo "❌ Latency exceeded SLO!"
            exit 1
          fi
          
          echo "✅ All SLOs met"
      
      - name: Alert Slack on anomaly
        if: failure()
        uses: slackapi/slack-github-action@v1
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK }}
          payload: |
            {
              "text": "🚨 Post-deployment SLO violation",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Deployment Issue*\nError Rate: ${{ steps.metrics.outputs.error_rate }}%\nP99: ${{ steps.metrics.outputs.p99 }}ms"
                  }
                }
              ]
            }
```

### Trace Collection (Debug)

```typescript
// src/middleware/tracing.ts
import { trace } from "@opentelemetry/api";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";

const sdk = new NodeSDK({
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();

export const tracer = trace.getTracer("app-tracer");

export async function traceRequest(name: string, fn: () => Promise<any>) {
  const span = tracer.startSpan(name);
  
  try {
    const result = await fn();
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    span.recordException(error as Error);
    span.setStatus({ code: SpanStatusCode.ERROR });
    throw error;
  } finally {
    span.end();
  }
}

// Uso:
export async function getLessonWithTrace(lessonId: string) {
  return await traceRequest("get-lesson", async () => {
    return await db.lessons.findById(lessonId);
  });
}
```

---

## Seção 5: Rollback e Recovery (25 min)

### Rollback Automático

```yaml
# .github/workflows/auto-rollback.yml
name: Auto Rollback on SLO Breach

on:
  schedule:
    # Check every 5 minutes
    - cron: '*/5 * * * *'

jobs:
  check-and-rollback:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Check current deployment health
        id: health
        run: |
          # Busca métricas dos últimos 5 minutos
          curl -s https://metrics.example.com/api/health?window=5m > health.json
          
          ERROR_RATE=$(jq '.error_rate' health.json)
          P99=$(jq '.p99_latency' health.json)
          
          echo "error_rate=$ERROR_RATE" >> $GITHUB_OUTPUT
          echo "p99=$P99" >> $GITHUB_OUTPUT
      
      - name: Determine if rollback needed
        id: decision
        run: |
          ERROR_RATE=${{ steps.health.outputs.error_rate }}
          P99=${{ steps.health.outputs.p99 }}
          
          NEEDS_ROLLBACK=false
          
          if (( $(echo "$ERROR_RATE > 5" | bc -l) )); then
            NEEDS_ROLLBACK=true
            echo "Rollback trigger: Error rate > 5%"
          fi
          
          if (( $(echo "$P99 > 1000" | bc -l) )); then
            NEEDS_ROLLBACK=true
            echo "Rollback trigger: P99 > 1s"
          fi
          
          echo "needs_rollback=$NEEDS_ROLLBACK" >> $GITHUB_OUTPUT
      
      - name: Execute rollback
        if: steps.decision.outputs.needs_rollback == 'true'
        run: |
          PREVIOUS_VERSION=$(git rev-parse HEAD~1)
          
          echo "Rolling back to $PREVIOUS_VERSION"
          
          kubectl set image deployment/app-prod \
            app=myapp:$PREVIOUS_VERSION \
            --record
          
          kubectl rollout status deployment/app-prod --timeout=5m
      
      - name: Verify rollback
        if: steps.decision.outputs.needs_rollback == 'true'
        run: npm run test:smoke -- --url https://app.example.com
      
      - name: Notify team
        if: steps.decision.outputs.needs_rollback == 'true'
        uses: slackapi/slack-github-action@v1
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK }}
          payload: |
            {
              "text": "🔄 Automatic rollback executed",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Rolled back to*: ${{ steps.decision.outputs.previous_version }}\n*Reason*: SLO breach detected"
                  }
                }
              ]
            }
```

### Blue-Green Deployment

```yaml
# .github/workflows/blue-green-deploy.yml
name: Blue-Green Deployment

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Run tests
        run: npm run test
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Green environment
        run: |
          # Deploy nova versão para "Green"
          kubectl apply -f k8s/deployment-green.yml \
            -o jsonpath='{.spec.template.spec.containers[0].image}'=myapp:${{ github.sha }}
          
          # Wait for green to be ready
          kubectl rollout status deployment/app-green --timeout=5m
      
      - name: Run smoke tests against Green
        run: npm run test:smoke -- --url https://green.example.com
      
      - name: Switch traffic from Blue to Green
        if: success()
        run: |
          kubectl patch service app -p '{"spec":{"selector":{"version":"green"}}}'
          echo "✅ Switched to Green"
      
      - name: Monitor Green
        run: sleep 120
      
      - name: If problems, switch back to Blue
        if: failure()
        run: |
          kubectl patch service app -p '{"spec":{"selector":{"version":"blue"}}}'
          echo "🔄 Switched back to Blue"
      
      - name: After stability, swap Blue/Green
        if: success()
        run: |
          kubectl patch deployment app-blue -p '{"spec":{"selector":{"version":"blue"}}}'
          echo "✅ Blue is now previous Green"
```

---

## Seção 6: Observabilidade em Testes (20 min)

### Test Reports

```yaml
# package.json
{
  "scripts": {
    "test:report": "jest --coverage --coverageReporters=json-summary --coverageReporters=text",
    "test:junit": "jest --reporters=default --reporters=jest-junit",
    "test:html": "jest --reporters=default --reporters=jest-html-reporters"
  }
}

# .github/workflows/report.yml
- name: Publish test results
  uses: EnricoMi/publish-unit-test-result-action@v2
  if: always()
  with:
    files: test-results.xml
    
- name: Publish coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/coverage-final.json
    flags: test-coverage
```

### Custom Dashboards

```typescript
// scripts/generate-metrics.ts
import fs from "fs";

async function collectMetrics() {
  const metrics = {
    timestamp: new Date().toISOString(),
    tests: {
      unit: await getUnitTestMetrics(),
      integration: await getIntegrationTestMetrics(),
      e2e: await getE2eTestMetrics(),
    },
    coverage: {
      statements: 92.5,
      branches: 88.3,
      functions: 90.1,
      lines: 92.0,
    },
    performance: {
      p50: 45,
      p95: 180,
      p99: 450,
    },
  };
  
  fs.writeFileSync(
    "metrics-dashboard.json",
    JSON.stringify(metrics, null, 2)
  );
  
  console.log(`✅ Metrics collected at ${metrics.timestamp}`);
}

collectMetrics().catch(console.error);
```

---

## Quiz & Exercício Prático

### Questão 1: Branch Protection
Se um teste falhar em CI, o que deve acontecer?

**Resposta:** PR não pode ser mergeado para main. Deve passar todos os testes antes de merge.

---

### Questão 2: Canary Deployment
Por que usar canary (5% traffic) antes de 100%?

**Resposta:** 
- Detectar bugs em pequena escala
- Monitorar real traffic patterns
- Rollback rápido se problema
- Reduz impacto de erro

---

### Questão 3: Smoke Tests
Qual é o objetivo de smoke tests após deploy?

**Resposta:** Validar que deployment foi bem-sucedido. Testa funcionalidades críticas (health check, login, API).

---

### Questão 4: SLO
Qual é diferença entre SLA e SLO?

**Resposta:**
- **SLA**: Service Level Agreement (contrato com cliente: 99.9% uptime)
- **SLO**: Service Level Objective (meta interna: P99 < 400ms)

---

### Questão 5: Cenário Real
Você vê error rate subir para 8% após deploy. O que fazer?

**Resposta:**
1. Trigger automatic rollback
2. Investigate root cause (logs, traces, metrics)
3. Fix e re-deploy
4. Post-mortem para evitar

---

### Exercício Prático: CI/CD Pipeline Completa

**Objetivo:** Criar pipeline GitHub Actions com testes e deploy

**Requisitos:**

1. ✅ Lint + Format check
2. ✅ Unit tests com coverage threshold (80%)
3. ✅ Integration tests com PostgreSQL
4. ✅ E2E tests (3 critical paths)
5. ✅ Build artifact
6. ✅ Deploy com manual approval
7. ✅ Smoke tests pós-deploy
8. ✅ Metrics report

**Estrutura Esperada:**

```yaml
# .github/workflows/full-ci-cd.yml

name: Complete CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  # Job 1: Lint
  lint:
    # seu config aqui
  
  # Job 2: Build
  build:
    needs: lint
    # seu config aqui
  
  # Job 3: Unit tests
  unit-tests:
    needs: build
    # seu config aqui
  
  # Job 4: Integration tests
  integration-tests:
    needs: build
    # seu config aqui
  
  # Job 5: E2E tests
  e2e-tests:
    needs: build
    # seu config aqui
  
  # Job 6: Deploy (manual approval)
  deploy:
    needs: [unit-tests, integration-tests, e2e-tests]
    if: github.ref == 'refs/heads/main'
    environment:
      name: production
    # seu config aqui
  
  # Job 7: Post-deploy validation
  validate:
    needs: deploy
    # seu config aqui
```

**Dicas:**
- Use `needs:` para dependências entre jobs
- Use `if:` para rodar só em main
- Use `environment:` para manual approval
- Upload artifacts para rastreabilidade
- Comentar resultados no PR

---

**Tempo Total:** 200 minutos  
**Conclusão do Módulo:** 6.6 - CI/CD Pipeline & Deployment Testing

---

## Resumo do Módulo 6: Testing & QA

### O Que Você Aprendeu

| Lição | Foco | Tempo |
|-------|------|-------|
| 6.1 | Testing Pyramid (estratégia) | 200 min |
| 6.2 | Jest Unit Testing (prático) | 200 min |
| 6.3 | Integration Testing (bancos reais) | 200 min |
| 6.4 | E2E Testing com Playwright | 200 min |
| 6.5 | Performance Testing | 200 min |
| 6.6 | CI/CD Pipeline (automação) | 200 min |

**Total:** 20 horas de conteúdo

### Checklist de Competências

- [ ] Entender trade-offs entre tipos de testes
- [ ] Escrever unit tests com Jest
- [ ] Mockar dependências corretamente
- [ ] Testar integrações com banco real
- [ ] Escrever E2E tests com Playwright
- [ ] Perfilar e otimizar performance
- [ ] Implementar CI/CD pipeline seguro
- [ ] Monitorar deployments
- [ ] Implementar rollback automático
- [ ] Medir qualidade com métricas

### Próximos Passos

**Aplicação Imediata:**
1. Implementar testing pyramid no seu projeto
2. Adicionar coverage threshold
3. Setup GitHub Actions com pipeline
4. Integrar Lighthouse/k6 para perf
5. Implementar branch protection

**Aprofundamento:**
- Módulo 7: SOLID Principles (design para testabilidade)
- Módulo 8: Event-Driven Testing (testes assíncronos)
- DevOps especializado: Terraform, Kubernetes, Observability

---

**Fim do Módulo 6 - Parabéns! 🎉**
