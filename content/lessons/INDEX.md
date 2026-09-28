# Índice de Lições - Curso Engenharia Harness IA

## Módulo 1: Fundamentos (5-6 horas)

### 1.1 Git Fundamentals
**Status:** ✅ Concluído  
**Duração:** 30 min  
**Tópicos:**
- Git basics (init, add, commit, push, pull)
- Branching fundamentals
- Merge vs. Rebase (introdução)

---

### 1.2 CI/CD Basics
**Status:** ⏳ Em progresso  
**Duração:** 40 min  
**Tópicos:**
- What is CI/CD?
- GitHub Actions fundamentals
- Docker basics
- Automated testing & linting

---

### 1.3 Git & Collaboration Workflow Avançado
**Status:** ✅ Concluído - 2026-09-27  
**Duração:** 45 min  
**Arquivo:** [LIÇÃO_1.3_Git_Collaboration.md](./LIÇÃO_1.3_Git_Collaboration.md)

**Conteúdo:**
1. **Git Flow vs. Trunk-Based** (10 min)
   - When to use each
   - Trade-offs & examples
   - Real-world usage (Google, Netflix, Shopify)

2. **Semantic Commits & Conventional Commits** (8 min)
   - Format: type(scope): description
   - Automation with commitizen
   - Auto-generated CHANGELOGs

3. **Branch Strategies** (10 min)
   - Feature/Release/Hotfix branches
   - Naming conventions
   - Lifecycle & PRs

4. **Code Review Culture** (12 min)
   - Professional feedback
   - Review checklist
   - CODEOWNERS automation
   - CI/CD gates

5. **Resolving Merge Conflicts** (5 min)
   - Strategies & tools
   - Rebase vs. Merge
   - Best practices

**Inclui:**
- 20+ code examples
- 5 quiz questions com respostas
- 1 hands-on exercise (20 min)
- 3 tabelas comparativas

**Tamanho:** ~32KB | **Palavras:** ~6000

---

### 1.4 Docker & Containerization
**Status:** ⏳ Planejado  
**Duração:** 60 min  
**Data Prevista:** 2026-10-04

---

### 1.5 Kubernetes Essentials
**Status:** ⏳ Planejado  
**Duração:** 90 min  
**Data Prevista:** 2026-10-11

---

## Módulo 2: Harness Platform (4-5 horas)

### 2.1 Harness Overview & Setup
**Status:** ⏳ Planejado

### 2.2 Pipeline as Code (YAML)
**Status:** ⏳ Planejado

### 2.3 Deployment Strategies
**Status:** ⏳ Planejado

### 2.4 Feature Flags & Progressive Delivery
**Status:** ⏳ Planejado

---

## Módulo 3: IA + DevOps (3-4 horas)

### 3.1 LLMs em CI/CD
**Status:** ⏳ Planejado

### 3.2 Observability com IA
**Status:** ⏳ Planejado

### 3.3 ChatOps & Intelligent Deployments
**Status:** ⏳ Planejado

---

## Módulo 6: Testing & QA (20 horas, 6 lições)

### 6.1 Testing Pyramid - A Estratégia Fundamental
**Status:** ✅ Concluído - 2026-09-27  
**Duração:** 200 min (3h 20min)  
**Arquivo:** [LIÇÃO_6.1_Testing_Pyramid.md](./LIÇÃO_6.1_Testing_Pyramid.md)

**Conteúdo:**
1. O Mito dos Testes (20 min)
2. A Pirâmide de Testes Explicada (30 min)
3. Unit Tests: Rápidos e Isolados (40 min)
4. Integration Tests: Você Precisa Deles (40 min)
5. E2E Tests: A Parte Cara (30 min)
6. Arquitetura Testável (20 min)

**Inclui:** 5 quiz questions + 1 exercício prático

---

### 6.2 Jest Unit Testing - Da Teoria à Prática
**Status:** ✅ Concluído - 2026-09-27  
**Duração:** 200 min (3h 20min)  
**Arquivo:** [LIÇÃO_6.2_Jest_Unit_Testing.md](./LIÇÃO_6.2_Jest_Unit_Testing.md)

**Conteúdo:**
1. Setup e Configuração (20 min)
2. Matchers e Assertions (30 min)
3. Mocks, Stubs e Spies (40 min)
4. Estrutura AAA e Fixtures (30 min)
5. Testing Async Code (30 min)
6. Snapshot Tests e Pitfalls (20 min)

**Inclui:** Real-world examples, Jest config, 5 quiz + exercício

---

### 6.3 Integration Testing - O Meio Termo
**Status:** ✅ Concluído - 2026-09-27  
**Duração:** 200 min (3h 20min)  
**Arquivo:** [LIÇÃO_6.3_Integration_Testing.md](./LIÇÃO_6.3_Integration_Testing.md)

**Conteúdo:**
1. Quando Unit Tests Não Bastam (20 min)
2. Setup de Bancos de Teste (30 min)
3. Test Containers e Fixtures (40 min)
4. Testando com Banco Real (40 min)
5. Transações e Isolamento (30 min)
6. Testando Fluxos Completos (20 min)

**Inclui:** Testcontainers, PostgreSQL setup, transações ACID

---

### 6.4 E2E Testing with Playwright - Do Browser ao Código
**Status:** ✅ Concluído - 2026-09-27  
**Duração:** 200 min (3h 20min)  
**Arquivo:** [LIÇÃO_6.4_E2E_Testing_Playwright.md](./LIÇÃO_6.4_E2E_Testing_Playwright.md)

**Conteúdo:**
1. Setup Playwright (20 min)
2. Locating Elements (30 min)
3. Interactions e Assertions (40 min)
4. Esperar Elementos e Redes (30 min)
5. Authentication e Fixtures (30 min)
6. Anti-patterns e Best Practices (20 min)

**Inclui:** Playwright config, data-testid strategies, network mocking

---

### 6.5 Performance Testing - Medindo o Que Importa
**Status:** ✅ Concluído - 2026-09-27  
**Duração:** 200 min (3h 20min)  
**Arquivo:** [LIÇÃO_6.5_Performance_Testing.md](./LIÇÃO_6.5_Performance_Testing.md)

**Conteúdo:**
1. Métricas que Importam (25 min)
2. Profiling em Node.js (35 min)
3. Benchmarking Código (35 min)
4. Load Testing com k6 (35 min)
5. Lighthouse e Web Performance (30 min)
6. Análise e Otimização (20 min)

**Inclui:** k6 load testing, Lighthouse, clinic.js, Web Vitals

---

### 6.6 CI/CD Pipeline & Deployment Testing
**Status:** ✅ Concluído - 2026-09-27  
**Duração:** 200 min (3h 20min)  
**Arquivo:** [LIÇÃO_6.6_CI_CD_Pipeline_Testing.md](./LIÇÃO_6.6_CI_CD_Pipeline_Testing.md)

**Conteúdo:**
1. GitHub Actions Fundações (30 min)
2. Pipeline de Testes (40 min)
3. Deployment Seguro com Testes (35 min)
4. Monitoramento Pós-Deployment (30 min)
5. Rollback e Recovery (25 min)
6. Observabilidade em Testes (20 min)

**Inclui:** GitHub Actions workflows, canary deployment, blue-green, SLO monitoring

---

## Cronograma Geral (ATUALIZADO)

| Semana | Módulo | Status |
|--------|--------|--------|
| 1 (27 set) | Módulo 0+1 Intro | ✅ Lição 1.1 OK |
| 2 (4 out) | Módulo 1 (1.2-1.5) | ⏳ Planejado |
| 3 (11 out) | Módulo 2-5 | ⏳ Planejado |
| 4 (18 out) | Módulo 6 (Testes) | ✅ CONCLUÍDO (27/09) |
| 5+ (25 out) | Módulos 7-8 | ⏳ Futuro |

---

## Como Usar Este Curso

### Para Iniciantes
1. Comece com 1.1 (Git Fundamentals)
2. Pule direto para 1.3 (Git Flow - prático)
3. Faça o exercício prático
4. Continue com 1.4 (Docker)

### Para Intermediários
1. Review 1.3 (Git Flow strategies)
2. Foco em Code Review Culture (seção 4)
3. Continue com Módulo 2

### Para Instrutores
- Cada lição é autossuficiente (módulo)
- Inclui exemplos, quiz, exercício prático
- Use o INDEX.md para trackear progresso

---

## Desenvolvimento & Contribuições

**Branch structure:**
- main - production-ready lessons
- develop - next release prep
- eature/lição-X.Y - lesson development

**Padrão de commits:**
`
feat(lição-1.3): add git flow vs trunk section
fix(lição-1.2): correct CI/CD example
docs(lição-1.3): update references
`

**Para adicionar nova lição:**
1. Create eature/lição-X.Y branch
2. Add LIÇÃO_X.Y_*.md file
3. Update this INDEX.md
4. Create PR (self-review first)
5. Merge to develop

---

**Última atualização:** 2026-09-27  
**Total de conteúdo:** ~6500 palavras + exemplos  
**Tempo estimado:** 11.5 horas de conteúdo
