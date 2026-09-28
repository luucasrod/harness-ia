# LIÇÃO 1.3: Git & Collaboration Workflow Avançado

**Duração:** 45 minutos  
**Nível:** Intermediário-Avançado  
**Foco:** Git flow profissional, não só "git commit"  
**Público-alvo:** Desenvolvedores em equipes de 3+ pessoas

---

## ÍNDICE
1. [Git Flow vs. Trunk-Based](#seção-1-git-flow-vs-trunk-based-10-min)
2. [Semantic Commits & Conventional Commits](#seção-2-semantic-commits--conventional-commits-8-min)
3. [Branch Strategies](#seção-3-branch-strategies-10-min)
4. [Code Review Culture](#seção-4-code-review-culture-12-min)
5. [Resolving Merge Conflicts](#seção-5-resolving-merge-conflicts-5-min)
6. [Quiz & Exercício Prático](#quiz--exercício-prático)

---

## Seção 1: Git Flow vs. Trunk-Based (10 min)

### O Problema: Como coordenar código entre 5+ pessoas?

Duas estratégias dominam a indústria, cada uma com trade-offs drasticamente diferentes:

### **1.1 Git Flow (Vincent Driessen, 2010)**

```
main (production)
  │
  ├─→ release/1.5.0 (QA stage)
  │     ├─→ fix bug X
  │     └─→ merge back to main + develop
  │
develop (integration branch)
  │
  ├─→ feature/auth-redesign (Alice)
  │     ├─→ 20 commits
  │     ├─→ code review
  │     └─→ merge to develop
  │
  ├─→ feature/payment-api (Bob)
  │     ├─→ 15 commits
  │     ├─→ tests
  │     └─→ merge to develop
  │
  └─→ hotfix/critical-bug (Charlie)
        ├─→ off main
        ├─→ deploy immediately
        └─→ merge back to main + develop
```

**Quando USAR:**
- Grandes equipes (10+ pessoas)
- Release cycles previsíveis (monthly/quarterly)
- Múltiplas versões em suporte simultâneo
- Requisito: código em `main` = **sempre deployment-ready**

**Exemplo Real:** Shopify (2020-2023), Discord (até 2021)

**Estrutura de Branches:**
- `main`: production-ready, tagged with versions
- `develop`: integration branch, next release prep
- `feature/*`: individual features (ex: `feature/user-profiles`)
- `release/*`: release preparation (ex: `release/2.1.0`)
- `hotfix/*`: urgent fixes to production (ex: `hotfix/security-patch`)

**Vantagens:**
✅ Estrutura clara e documentada  
✅ Simples de onboard novos desenvolvedores  
✅ Bom para releases previsíveis  
✅ Isolamento natural entre features  

**Desvantagens:**
❌ PRs complexas (20-50 commits por feature)  
❌ Merge conflicts frequentes em equipes grandes  
❌ "Develop" pode ficar instável por semanas  
❌ Deployment é batche (todas features de uma vez)  

---

### **1.2 Trunk-Based Development (Google, Facebook, Netflix)**

```
main (sempre production-ready + deployable)
  │
  ├─→ feat/auth-redesign (Alice, 1-2 dias)
  │     ├─→ 3-5 commits
  │     ├─→ feature flag (hidden for 99% users)
  │     └─→ merge + deploy immediately
  │
  ├─→ fix/memory-leak (Bob)
  │     ├─→ 2 commits
  │     └─→ merge + deploy same day
  │
  └─→ feat/payment-api (Charlie)
        ├─→ 4 commits
        ├─→ canary deploy (5% traffic)
        └─→ gradual rollout
```

**Quando USAR:**
- Continuous deployment (múltiplas releases/dia)
- DevOps maturo (CI/CD + feature flags + monitoring)
- Equipes muito comunicativas
- Mudanças incrementais (não "big bang" features)

**Exemplo Real:** Google (internal), Netflix, LinkedIn, Uber

**Princípios Fundamentais:**
1. **Branches vivem ≤ 2 dias** (não "feature branches" de 3 semanas)
2. **Todos commitam em `main`** (ou muito perto)
3. **Deployments frequentes** (várias vezes/dia)
4. **Feature flags** substituem branch isolation
5. **CI/CD é CRÍTICA** (sem ela, caos)

**Vantagens:**
✅ Conflicts minimizados (branches curtas)  
✅ Integração contínua = bugs detectados cedo  
✅ Deploy frequente = feedback rápido  
✅ Simples operacionalmente  
✅ Colaboração natural (nem "silos" de feature)  

**Desvantagens:**
❌ Requer disciplina & comunicação  
❌ Feature flags complexas (tech debt)  
❌ Requer CI/CD muito bom  
❌ Podem aparecer bugs em prod (mais facilmente)  

---

### **1.3 Tabela Comparativa**

| Critério | Git Flow | Trunk-Based |
|----------|----------|-------------|
| **Tamanho Ideal** | 10+ devs | 3-20 devs |
| **Releases** | Planejadas (mensal/trimestral) | Contínuas (diárias) |
| **Tempo de Branch** | 1-4 semanas | 1-2 dias |
| **Merge Conflicts** | Frequentes | Raros |
| **Curva de Aprendizado** | Fácil | Média-Alta |
| **Ferramentas Necessárias** | Git + Code Review | Git + CI/CD + Feature Flags |
| **Time Maturity** | Pode ser junior | Precisa sênior |

---

### **Decisão para seu projeto:**

**Use Git Flow se:**
- Você libera versões a cada 2+ semanas
- Tem múltiplas versões em suporte (v1.5, v2.0, v2.1)
- Equipe é grande ou distribuída
- Testes são lentos (batche)

**Use Trunk-Based se:**
- Você deploya várias vezes por semana/dia
- Uma única versão em prod
- Time é pequeno mas comunicativo
- CI/CD é forte

**Híbrido (Recomendado para MVP/Startups):**
```
main (production)
  │
  └─→ develop (next release)
        ├─→ feature/X (PR → merge)
        ├─→ feature/Y (PR → merge)
        └─→ [a cada sprint, develop → main]
```

→ **Decisão: Comece com Git Flow. Quando tim amadurecer, considere Trunk-Based.**

---

## Seção 2: Semantic Commits & Conventional Commits (8 min)

### O Problema: Histórico ilegível

```bash
# BAD
git commit -m "fix stuff"
git commit -m "wip"
git commit -m "updates"
git commit -m "final final fix"
git commit -m "omg works"

# Log gerado:
* 3f2a1b fix stuff
* d8e4c2 wip
* 9a1f5e updates
* b7e3a9 final final fix
* c2f8d1 omg works

# Resultados:
❌ Impossível saber o que mudou
❌ `git bisect` inútil (qual commit quebrou?)
❌ `git blame` sem contexto
❌ Changelog gerado é lixo
```

### **Conventional Commits Specification** (2016)

Formato padrão, legível, automático.

**Sintaxe Completa:**

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Exemplos bons:**

```bash
# ✅ Feature simples
git commit -m "feat: add user authentication with JWT"

# ✅ Feature com scope
git commit -m "feat(auth): add JWT token refresh mechanism"

# ✅ Bug fix
git commit -m "fix(api): resolve N+1 query in user profile endpoint"

# ✅ Com corpo explicativo
git commit -m "feat(payment): integrate Stripe payment webhook

- Added webhook endpoint at POST /api/payments/webhook
- Validates Stripe signature before processing
- Stores webhook logs for audit trail
- Handles retry logic for failed webhooks (exponential backoff)"

# ✅ Com footer (breaking change)
git commit -m "feat!: restructure authentication API

BREAKING CHANGE: /auth/login response format changed.
Old: { token: string }
New: { accessToken: string; refreshToken: string }

See migration guide at docs/MIGRATION-v2.md"

# ✅ Issue reference (GitHub/Jira/Linear)
git commit -m "fix(form): validate email field on blur

Fixes #1234
Closes #1235"
```

**Tipos Comuns (commitizen standard):**

| Tipo | Descrição | Bump Semver | Exemplo |
|------|-----------|------------|---------|
| `feat` | Nova feature | MINOR (v1.2.0 → v1.3.0) | `feat(auth): add SSO` |
| `fix` | Bug fix | PATCH (v1.2.0 → v1.2.1) | `fix(api): handle null response` |
| `docs` | Documentação | - | `docs: update README` |
| `style` | Formatação, linting | - | `style: format code with prettier` |
| `refactor` | Reorganizar sem mudança | - | `refactor: simplify auth logic` |
| `perf` | Performance | PATCH (opcional) | `perf(db): optimize query with index` |
| `test` | Testes | - | `test: add auth edge cases` |
| `chore` | Deps, config | - | `chore: bump Next.js to v14` |
| `ci` | CI/CD configs | - | `ci: add GitHub Actions workflow` |

**Exemplos ruins (❌ não fazer):**

```bash
❌ Ambíguo
git commit -m "update"
git commit -m "changes"
git commit -m "fix bug"

❌ Muito genérico
git commit -m "feat: various improvements"
git commit -m "refactor: cleaning up code"

❌ Sem contexto
git commit -m "feat(auth)"  # qual feat?
git commit -m "fix: issue with login"  # qual issue?

❌ Misturando tipos
git commit -m "feat: add auth AND fix payment bug AND update docs"
# ↑ Sempre um tipo por commit
```

---

### **Automação: Commitizen**

Força padrão Conventional Commits:

```bash
# Instalação global
npm install -g commitizen cz-conventional-changelog

# Usar ao fazer commit
cz commit
# ou
git cz

# Saída interativa:
# Select the type of change that you're committing:
# 1) feat:     A new feature
# 2) fix:      A bug fix
# 3) docs:     Documentation only changes
# ...
```

**Config no projeto** (`.cz.json`):

```json
{
  "commitizen": {
    "name": "cz_conventional_commits",
    "version": "2.29.4",
    "tag_format": "v$version"
  }
}
```

---

### **Por que importa: Automação de Changelog & Versioning**

**Antes (manual):**
```markdown
# v2.1.0 (2024-01-15)

## Features
- Added user authentication
- Implemented password reset
- New dashboard widgets
- ...

## Bug Fixes
- Fixed profile picture upload
- Resolved memory leak in charts
```

**Depois (automático com Conventional Commits + `standard-version`):**

```bash
npm install --save-dev standard-version

# Commita tudo com Conventional Commits
git commit -m "feat: add user auth"
git commit -m "fix: profile picture upload"

# Uma linha:
npx standard-version

# Resultado:
# ✓ Bumped version v2.0.0 → v2.1.0
# ✓ Updated CHANGELOG.md
# ✓ Created git tag v2.1.0
# ✓ Ready to git push --tags
```

**CHANGELOG.md gerado automaticamente:**

```markdown
# Changelog

All notable changes to this project will be documented in this file.

## [2.1.0] - 2024-01-15

### Added
- User authentication with JWT
- Password reset functionality

### Fixed
- Profile picture upload bug
- Memory leak in charts
```

**CI/CD Integration (GitHub Actions):**

```yaml
name: Release

on:
  workflow_dispatch:

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Create Release
        run: |
          npx standard-version
          git push --follow-tags
          
      - name: Publish to NPM
        run: npm publish
```

---

### **Pro Tips**

```bash
# 1. Editar último commit (não pub'lished)
git commit --amend -m "fix(auth): correct token expiry logic"

# 2. Ver histórico legível
git log --oneline --decorate --graph

# 3. Filtrar por tipo
git log --grep="^feat:" --oneline

# 4. Gerar sumário de commits
git log v2.0.0..HEAD --pretty=format:"%h %s" | head -20

# 5. Verificar se segue padrão (pre-commit hook)
# .husky/commit-msg
#!/bin/bash
npx commitlint --edit "$1"
```

---

## Seção 3: Branch Strategies (10 min)

### **3.1 Feature Branch Lifecycle (Detalhado)**

**Cenário:** Alice implementa "User Profiles" com Git Flow

```bash
# Passo 1: Criar branch da develop
git checkout develop
git pull origin develop
git checkout -b feature/user-profiles

# Passo 2: Trabalhar localmente (3-5 commits semânticos)
git commit -m "feat(profile): create user profile schema"
git commit -m "feat(profile): add GET /api/users/:id endpoint"
git commit -m "test(profile): add e2e tests for profile view"

# Passo 3: Sincronizar com develop (pode ter mudado)
git fetch origin
git rebase origin/develop  # ← IMPORTANTE: rebase, não merge!
# ↑ Evita "Merge commit from develop" desnecessário

# Passo 4: Push para remoto
git push origin feature/user-profiles

# Passo 5: Criar Pull Request (explicado na Seção 4)
# GitHub Web UI:
# - Title: "feat: user profile view and API"
# - Body: descrição detalhada
# - Reviewers: 2 sêniors
```

**Naming Convention (PADRÃO PROFISSIONAL):**

```
feature/<descrição-curta>
  ✅ feature/user-profiles
  ✅ feature/payment-integration
  ✅ feature/dark-mode-ui
  
bugfix/<descrição-do-bug>
  ✅ bugfix/profile-image-corruption
  ✅ bugfix/notification-duplication
  
refactor/<área>
  ✅ refactor/auth-service
  ✅ refactor/database-queries
  
docs/<página>
  ✅ docs/api-authentication
  ✅ docs/deployment-guide
```

**Anti-patterns:**

```bash
❌ feature/1  # vago
❌ FEATURE_USER_PROFILES  # case inconsistente
❌ fix-payment-api-v2-final-working-version  # muito longo
❌ john/auth-stuff  # nome pessoal (usa código de issue)
```

---

### **3.2 Release Branch Strategy**

**Cenário:** Preparar v2.1.0 para produção

```bash
# 1. Criar release branch de develop
git checkout develop
git pull origin develop
git checkout -b release/2.1.0

# 2. Fazer apenas:
#    - Bump version (package.json)
#    - Fix bugs críticos encontrados em QA
#    - Atualizar CHANGELOG.md

# Exemplo: release/2.1.0 commits
git commit -m "chore(release): bump version to 2.1.0"
git commit -m "fix(api): handle edge case in payment retry"
git commit -m "docs(changelog): update for v2.1.0"

# 3. Code review (mais curto que feature)
# PR: release/2.1.0 → main

# 4. Merge para main e tag
git checkout main
git pull origin main
git merge --no-ff release/2.1.0  # ← --no-ff cria merge commit
git tag -a v2.1.0 -m "Release version 2.1.0"

# 5. Merge de volta para develop (bugfixes propagam)
git checkout develop
git pull origin develop
git merge --no-ff release/2.1.0

# 6. Push
git push origin main develop
git push origin v2.1.0
```

**Motivo do `--no-ff`:** Cria commit visível no histórico

```
main
  │
  ├─→ *───* (merge commit legível)
  │   │   │
  │   release/2.1.0
  │   └───* (bug fix)
  │
  └─→ v2.1.0 tag

# vs. sem --no-ff:
# * (commit do release vira commit do main direto)
# Histórico menos claro
```

---

### **3.3 Hotfix Branch (Emergência)**

**Cenário:** Bug crítico em produção descoberto às 22:00

```bash
# 1. Criar hotfix de main
git checkout main
git pull origin main
git checkout -b hotfix/critical-auth-bypass

# 2. Fix urgente (1-2 commits)
git commit -m "fix(auth): close session hijacking vulnerability"
git commit -m "test(auth): add regression test for bypass"

# 3. Code review EXPRESS (15 min, não 2 horas)
# Merge direto para main
git checkout main
git merge --no-ff hotfix/critical-auth-bypass

# 4. Tag immediately
git tag -a v2.0.1 -m "Hotfix: auth vulnerability"

# 5. Deploy para produção
npm run deploy:prod  # ou seu script

# 6. Merge de volta para develop (CRÍTICO!)
git checkout develop
git merge --no-ff hotfix/critical-auth-bypass

# 7. Clean up
git branch -d hotfix/critical-auth-bypass
git push origin main develop v2.0.1
```

**Sem esse passo 6, develop fica com bug! Common mistake.**

---

### **3.4 Trunk-Based: Short-Lived Branches**

Se usar Trunk-Based, branches morrem em 1-2 dias:

```bash
# Manhã
git checkout main
git pull origin main
git checkout -b feat/quick-button-color  # tópico mínimo

echo "color: #ff0000;" >> src/styles.css
git commit -m "feat(ui): change button to red"

# Mesmo dia
git push origin feat/quick-button-color
# PR → review → merge → CI/CD → deploy
# Branch deletada

# Tarde
git checkout main
git pull origin main  # ← main tem a mudança de cor
git checkout -b fix/text-alignment
# ...
```

**Regra de Ouro Trunk-Based:**
- ✅ Branch vive ≤ 2 dias
- ✅ ≤ 5 commits por branch
- ✅ Nenhum "feature branch de 3 semanas"
- ✅ Sempre rebase antes de merging

---

### **3.5 Rebase vs. Merge: Quando Usar**

**Cenário:** Sua `feature/auth` está 5 commits atrás de `develop`

```bash
# Opção 1: MERGE (cria merge commit)
git merge origin/develop
# Log resultante:
# *  Merge branch 'develop' into feature/auth
# |\
# | * (commit from develop)
# | * (commit from develop)
# * | (seu commit)
# * | (seu commit)

# Opção 2: REBASE (reapplica seus commits)
git rebase origin/develop
# Log resultante:
# * (seu commit reaplicado)
# * (seu commit reaplicado)
# * (commit from develop)
# * (commit from develop)

# ✅ Histórico linear e legível
```

**Regra Profissional:**

```
Seus commits NÃO foram publicados (pushed)?
  → Use REBASE antes de push
  → Histórico fica limpo
  
Seus commits JÁ foram publicados?
  → Use MERGE
  → Evita "reescrita de história" (confunde o time)
  
Feature branch antes de PR?
  → git rebase origin/develop ✅
  
Main antes de deploy?
  → git merge --no-ff ✅ (cria merge visível)
```

**Comandos Práticos:**

```bash
# Rebase interativo (limpar commits antes de push)
git rebase -i origin/develop

# Interface:
# pick a1b2c3d feat: add auth
# pick d4e5f6g wip: typo fix
# pick h7i8j9k fix: memory leak
# ---
# Editar para:
# pick a1b2c3d feat: add auth
# squash d4e5f6g wip: typo fix  # ← combina com anterior
# squash h7i8j9k fix: memory leak

# Rebase abortado?
git rebase --abort

# Rebase com conflito? (depois de resolver)
git rebase --continue
```

---

## Seção 4: Code Review Culture (12 min)

### **4.1 Como Revisar Código Profissionalmente**

**Mentalidade:** Reviewers são "guardiões da qualidade", não "fiscais".

**Objetivo:**
1. Encontrar bugs antes de prod
2. Spread knowledge no time
3. Manter padrões de código
4. Mentorar (não julgar)

---

### **4.2 Checklist de Review Profissional**

Ao receber um PR:

```markdown
## Code Quality
- [ ] Código segue lint rules do projeto?
- [ ] Nomes de variáveis/funções são claros?
- [ ] Código é duplicado? (DRY principle)
- [ ] Complexidade é razoável (não 100 linhas em 1 função)?
- [ ] Magic numbers? (devem ser constantes nomeadas)

## Functionality
- [ ] Solução resolve o problema descrito?
- [ ] Edge cases cobertos?
  - [ ] Null/undefined handling
  - [ ] Limites (arrays vazios, números negativos)
  - [ ] Concorrência (race conditions)
- [ ] Breaking changes documentadas?

## Testing
- [ ] Testes adicionados/atualizados?
- [ ] Coverage não diminuiu?
- [ ] Testes são legíveis (given/when/then)?

## Security
- [ ] SQL injection risks?
- [ ] XSS vulnerabilities?
- [ ] Secrets hardcoded? (❌ API keys, passwords)
- [ ] Inputs validados?
- [ ] Rate limiting considerado?

## Performance
- [ ] N+1 queries? (DB)
- [ ] Loops aninhados desnecessários?
- [ ] Objetos grandes criados em loop?
- [ ] Bundle size aumentou muito?

## Documentation
- [ ] JSDoc/docstrings adicionadas?
- [ ] README atualizado (se necessário)?
- [ ] CHANGELOG.md incluso?

## Arquitetura
- [ ] Segue padrões do projeto?
- [ ] Não introducing new dependencies sem necessidade?
- [ ] API é consistente com resto do codebase?
```

---

### **4.3 Feedback Construtivo (Exemplos)**

**❌ RUIM: Crítica pessoal**

```
@alice: This code is terrible. Why would you use a for loop here?
This is obviously inefficient. You're wasting memory everywhere.
```

**✅ BOM: Feedback técnico e educativo**

```
@alice: I noticed a potential optimization here. This forEach loop 
does a database query on each iteration (N+1 problem). 

Could we batch load users first? Example:

```javascript
// Current approach (N+1)
users.forEach(user => {
  const profile = db.getProfile(user.id);  // Query per user!
});

// Suggested approach
const profiles = db.getProfiles(users.map(u => u.id));  // One query
```

This would be O(n) instead of O(n²) for large datasets.
What do you think?
```

---

### **4.4 Exemplo de PR Review Realista**

**PR:** `feat: implement user profile API` (Alice)

```markdown
# Changes
- Created GET /api/users/:id endpoint
- Added user profile schema to database
- Wrote e2e tests

# Diffs analisados:
1. src/api/users.ts (220 linhas)
2. src/db/schema.ts (15 linhas)
3. tests/e2e/users.test.ts (80 linhas)
```

**Feedback do Revisor (Bob):**

```markdown
# Great work! Few things to polish:

## 🟡 Performance Concern
Line 45 in `users.ts`:
```typescript
const user = db.query(`
  SELECT * FROM users u
  LEFT JOIN posts p ON u.id = p.user_id  // ← OUTER JOIN
  LEFT JOIN comments c ON u.id = c.user_id
  WHERE u.id = $1
`);
```

This loads **all** posts and comments for the user. 
If a user has 10k posts, this query is expensive.

**Suggestion:** Load posts separately on-demand (pagination):
- GET /api/users/:id → basic profile only
- GET /api/users/:id/posts → paginated (limit 20, offset)

## 🟡 Missing Validation
Line 32: No input validation on `userId`.

```typescript
// Current
export async function getUser(userId) {  // ← Could be "abc" string!
  return db.query(..., [userId]);
}

// Better
export async function getUser(userId: string) {
  if (!Number.isInteger(parseInt(userId))) {
    throw new BadRequestError('userId must be integer');
  }
  return db.query(..., [userId]);
}
```

Or use a validation library like `zod`:
```typescript
const userIdSchema = z.string().regex(/^\d+$/);
const userId = userIdSchema.parse(req.params.id);
```

## ✅ Great
- Tests are comprehensive (e2e + happy path + error cases)
- Code is readable and well-documented
- No hardcoded secrets

## 🤔 Question
Line 88 in tests: Why are we not mocking the database? 
Using real DB in tests makes them slow and brittle.
Have you considered testcontainers or fixtures?

---

Approve with comments: **Request changes** button
This is good work, let's just fix these two things first.
```

**Alice responde:**

```markdown
@bob: Great catch on the N+1! You're right.

I just pushed a fix:
- Split into two endpoints (profile + posts)
- Added `zod` validation
- Posts are now paginated

On mocking: We discussed this in sprint planning 
(see #2340) — team decided real DB tests for now 
since our tests run fast enough in parallel.
But I agree it's tech debt. Can we add to backlog?
```

**Bob aprova:**

```markdown
Looks good! 🚀
Merging now.
```

---

### **4.5 CODEOWNERS File (Automação de Review)**

Força review de pessoas certas automaticamente:

**`.github/CODEOWNERS`** (repositório)

```
# Cada mudança nestes arquivos precisa review específico

# Auth code → só sênior pode revisar
src/auth/** @carol-senior @dave-senior

# Payment code → sênior + compliance
src/payment/** @carol-senior @legal-team

# Docs → qualquer um
docs/** @*

# CI/CD → DevOps team
.github/workflows/** @devops-team

# Database migrations → DBA
src/db/migrations/** @dba-senior
```

**Como funciona:**

```
Alice: Push feature/auth-redesign
GitHub: Vê que src/auth/** mudou
GitHub: @carol-senior e @dave-senior recebem review request automático
Carol: Pode aprovar
Dave: Pode aprovar
(Ambas precisam aprovar antes de merge)
```

---

### **4.6 CI/CD Gates (Automação de Qualidade)**

PR não pode ser merged sem passar:

**`.github/workflows/pr-checks.yml`:**

```yaml
name: PR Checks
on: [pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm run lint
      
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm test
      - run: npm run coverage
      
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm audit

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm run build
```

**Resultado no PR:**

```
✅ Lint passed
✅ Tests passed (coverage: 94%)
✅ Security audit clean
✅ Build succeeded

🚀 All checks passed. Ready to merge.
```

Se algum falhar:

```
❌ Lint failed (semicolon on line 45)
❌ 3 tests failed
❌ Potential vulnerability (dependency X)
❌ Build error

Cannot merge until checks pass.
```

---

### **4.7 Anti-patterns em Code Review**

```markdown
❌ "Looks good to me" (sem realmente ler)
✅ "Looks good, I verified X, Y, Z..."

❌ "Why would you use this function?" (julgador)
✅ "Did you consider using loadUser() instead? It handles caching." (educativo)

❌ Feedback vago
✅ Feedback com linha, sugestão de código, context

❌ Revisor desaparece por 2 semanas
✅ Review dentro de 24h

❌ PR com 50 comentários (autor desincentivado)
✅ PR com feedback priorizado (core issues vs. nits)

❌ Bikeshedding (discutir cor da logo por horas)
✅ Focar em lógica, segurança, performance
```

---

## Seção 5: Resolving Merge Conflicts (5 min)

### **5.1 Por que ocorrem**

```bash
# main
main.txt: "Line 1\nLine 2\nLine 3"

# feature-A altera linha 2
feature-A.txt: "Line 1\nLINE 2 MODIFIED\nLine 3"

# feature-B também altera linha 2
feature-B.txt: "Line 1\nDIFFERENT LINE 2\nLine 3"

# Tentando merge feature-B em main (que já tem feature-A):
CONFLICT! Git não sabe qual linha 2 manter.
```

---

### **5.2 Estratégias de Resolução**

**Estratégia 1: Manual (VS Code)**

```bash
# Git reporta conflito
git merge feature-B
# CONFLICT (content): Merge conflict in main.txt
# Automatic merge failed; fix conflicts and then commit

# Abrir arquivo conflitado:
# main.txt:
<<<<<<< HEAD  # ← seu branch (main)
Line 1
LINE 2 MODIFIED FROM FEATURE-A
Line 3
=======  # ← incoming branch (feature-B)
Line 1
DIFFERENT LINE 2 FROM FEATURE-B
Line 3
>>>>>>> feature-B
```

**Em VS Code:**

```
[Accept Current Change] [Accept Incoming Change] [Accept Both] [Compare]

↓
```

Escolher a versão correta (ou combinar manualmente):

```
Line 1
LINE 2 MODIFIED FROM FEATURE-A + DIFFERENT CONTEXT FROM B
Line 3
```

Depois:

```bash
git add main.txt
git commit -m "merge: resolve conflict in main.txt"
```

---

**Estratégia 2: Rebase (Evitar Conflicts)**

Em vez de merging direto quando tem múltiplos branches:

```bash
# feature-A está em main
# Você trabalha em feature-B, que bifurcou de main (antes de A)

# ❌ Fazer isso faz muitos conflicts
git merge origin/main

# ✅ Fazer isso:
git rebase origin/main
# Reapplica seus commits ON TOP de main (que agora tem A)
# Resolve conflicts conforme rebasing (interativo)
```

---

**Estratégia 3: Ours/Theirs (Rápida)**

```bash
# Estou em develop, merging release/2.0
git merge --strategy-option ours release/2.0
# ↑ Qualquer conflito → usar versão de develop

# vs.
git merge --strategy-option theirs release/2.0
# ↑ Qualquer conflito → usar versão de release/2.0
```

**Use quando:**
- Você confia que um branch está "correto"
- Mudanças são não-críticas (comentários, docs)

---

**Estratégia 4: Using Beyond Compare ou P4Merge**

Configure no Git:

```bash
git config --global merge.tool bc3  # Beyond Compare
git mergetool  # Abre GUI
```

**VS Code merge editor (built-in):**

```bash
git config --global merge.editor code
git mergetool
```

---

### **5.3 Preventing Conflicts**

Melhor que resolver: não ter!

```markdown
## Regras
1. Branches curtos (≤ 2 dias) = menos chance
2. Comunicar mudanças grandes
3. Pull frequently: git pull origin develop (no seu branch)
4. Rebase antes de merge
5. Evitar editar os mesmos 3 arquivos que outro dev

## No Projeto
- Um dev = Authorization
- Outro dev = Payments
- Outro dev = UI

Não: Todos mexendo em utils.ts
```

---

### **5.4 Checklist: Depois de Resolver**

```bash
# ✅ Testar depois de resolver
npm test
npm run build

# ✅ Verificar se resolveu certo
git diff  # Ver o que foi resolvido

# ✅ Commit explicativo
git commit -m "merge(develop): resolve conflicts in auth.ts"

# ✅ Push
git push origin feature/my-feature
```

---

## QUIZ & EXERCÍCIO PRÁTICO

### **Quiz (5 perguntas)**

**1. Qual estratégia escolher?**

Seu time: 3 pessoas, deploya 2x/semana, CI/CD forte.

- A) Git Flow
- B) Trunk-Based Development  
- C) GitHub Flow

**Resposta:** B. Trunk-Based é ideal para times pequenos com deployment frequente.

---

**2. Conventional Commits - qual está correto?**

- A) `git commit -m "fix and improve authentication"`
- B) `git commit -m "fix(auth): add token refresh mechanism"`
- C) `git commit -m "git add -A && git commit"`

**Resposta:** B. Tem type (fix), scope (auth), descrição clara.

---

**3. Merge vs. Rebase:**

Você trabalhou em `feature/ui` 3 dias. Não foi publicado ainda.
Agora `main` tem mudanças e você quer sincronizar.

Qual fazer?

- A) `git merge origin/main` (mais seguro)
- B) `git rebase origin/main` (histórico limpo)
- C) `git pull origin/main` (mesmo que merge)

**Resposta:** B. Rebase mantém histórico linear e limpo.
(Seguro porque branch ainda não foi publicado)

---

**4. Code Review - qual feedback está profissional?**

- A) "This code is bad. Redo it."
- B) "This loop does N+1 queries. Suggest batching with: `db.getMany(ids)` instead."
- C) "Why?"

**Resposta:** B. Específico, educativo, com sugestão.

---

**5. Git Flow - qual branch estrutura está correta?**

- A) main → develop → feature/*, release/*, hotfix/*
- B) main → feature/*, com tags
- C) develop → feature/*, release/*, hotfix/* (sem main)

**Resposta:** A. Git Flow tem ambas main (production) e develop (integration).

---

### **Exercício Prático (20 min)**

**Cenário:**
Você é Alice. Sua equipe usa Git Flow. Precisa:
1. Criar feature branch
2. Fazer commits semânticos
3. Criar PR
4. Resolver um merge conflict
5. Merging para develop

**Instruções:**

```bash
# Passo 1: Setup inicial
mkdir git-exercise && cd git-exercise
git init
git config user.name "Alice"
git config user.email "alice@company.com"

# Passo 2: Criar estrutura inicial
echo "# Project" > README.md
git add .
git commit -m "chore: initial commit"

# Passo 3: Criar branch develop
git branch develop
git checkout develop

# Passo 4: Criar feature branch
git checkout -b feature/user-authentication

# Passo 5: Fazer 3 commits semânticos
echo "export function auth() { return 'token'; }" > src/auth.ts
git add .
git commit -m "feat(auth): add basic authentication"

echo "export function validateToken(token) { return token.length > 0; }" >> src/auth.ts
git add .
git commit -m "feat(auth): add token validation"

echo "test('token validation works', () => {" > src/auth.test.ts
echo "  expect(validateToken('abc')).toBe(true);" >> src/auth.test.ts
echo "});" >> src/auth.test.ts
git add .
git commit -m "test(auth): add validation tests"

# Passo 6: Simular conflito
git checkout develop
echo "// Conflicting change" >> README.md
git add .
git commit -m "docs: update readme"

# Passo 7: Tentar merge (vai ter conflito)
git merge feature/user-authentication
# CONFLICT! Resolver manualmente

# Passo 8: Resolver conflito
# (editar README.md, combinar mudanças)
git add README.md
git commit -m "merge: resolve conflict in README"

# Passo 9: Ver histórico final
git log --oneline --graph --all

# Resultado esperado:
# *   <merge commit>
# |\
# | * <seu commit de feature>
# | * <seu commit de feature>
# | * <seu commit de feature>
# |/
# * <conflicting commit>
```

**Desafio Extra:**

1. Crie outro branch `feature/logging`
2. Faça 2 commits nele
3. Rebase em develop (sem conflito)
4. Merge para develop com `--no-ff`
5. Tag como `v1.0.0`
6. Veja o histórico: deve ter "Merge branch" bem visível

---

## Resumo Executivo

| Conceito | Key Takeaway |
|----------|-----------|
| **Git Flow vs. Trunk** | Git Flow: equipes grandes + releases planejadas. Trunk: times pequenos + deploy frequente |
| **Conventional Commits** | `type(scope): description` → changelogs automáticos, CI/CD automático |
| **Branches** | Feature curtas (≤2 dias), nomeadas, rebase antes de merge |
| **Code Review** | Feedback técnico, educativo, com exemplos. Review 24h. |
| **Conflicts** | Evitar: branches curtas. Resolver: rebase > merge interativo > manual |
| **Automação** | CODEOWNERS (quem revisa), CI/CD gates (qualidade), commitizen (commits) |

---

## Referências & Recursos

**Leitura Recomendada:**
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Flow Cheatsheet](https://danielkummer.github.io/git-flow-cheatsheet/)
- [Trunk-Based Development (Google)](https://cloud.google.com/architecture/devops/devops-tech-trunk-based-development)
- [A Successful Git Branching Model - Vincent Driessen](https://nvie.com/posts/a-successful-git-branching-model/)

**Ferramentas Essenciais:**
- `commitizen` - Força Conventional Commits
- `standard-version` - Gera CHANGELOG e versioning automático
- `husky` + `commitlint` - Pre-commit hooks
- VS Code Merge Editor - Resolução visual de conflitos
- GitHub CODEOWNERS - Automação de reviewers

**Pro Commands:**

```bash
# Ver commits de um type específico
git log --grep="^feat:" --oneline

# Visualizar branches como árvore
git log --all --graph --decorate --oneline

# Resetar arquivo específico
git checkout HEAD -- file.txt

# Ver quem mudou cada linha
git blame src/auth.ts

# Encontrar commit que quebrou (binary search)
git bisect start
git bisect bad HEAD
git bisect good v1.0
# ... testa commits automaticamente
```

---

**Duração Total:** ~45 min (vídeo + exemplos)  
**Próxima Lição:** CI/CD Pipelines & Automation
