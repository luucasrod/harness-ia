# Protocolo de Trabalho - Harness IA Development

## Filosofia

- **Autonomia**: Agentes trabalham sem esperar aprovação em decisões reversíveis
- **Qualidade**: Code review automático com revisor Claude Haiku
- **Velocidade**: Paralelismo máximo, sem gargalos desnecessários
- **Integração**: Código mergeado continuamente em branches de desenvolvimento
- **Iteração**: Feedback rápido, correção rápida, follow-up rápido

## Divisão de Trabalho (CLI Workers)

### Codex (codex-cli)
- **Foco**: Frontend (React/Next.js), componentes, UI/UX
- **Responsabilidades**:
  - Criar componentes React
  - Páginas Next.js
  - Estilos Tailwind
  - Hooks customizados
  - Integração com forms
- **Quando termina**: Commita `feature/ui-<issue-number>`

### Gemini CLI (@google/gemini-cli)
- **Foco**: Backend, database, API, lógica
- **Responsabilidades**:
  - API endpoints
  - Prisma schema & migrations
  - Business logic
  - Auth flows
  - Data validation
- **Quando termina**: Commita `feature/backend-<issue-number>`

### OpenCode / Qwen
- **Foco**: Integração, infraestrutura, tests, DevOps
- **Responsabilidades**:
  - Setup do projeto (npm, tsconfig, etc)
  - Tests (Jest, RTL)
  - Docker/deployment
  - CI/CD
  - Scripts de seeding
  - Configuração geral
- **Quando termina**: Commita `feature/infra-<issue-number>`

## Fluxo de Trabalho

### 1. Issue -> Worker

Quando uma issue está READY:

```
[Issue Board]
    ↓
[Claude Code - Dispatcher]
    ↓
[Seleciona worker apropriado]
    ↓
[Envia prompt estruturado]
    ↓
[Worker executa (autonomamente, sem stdin)]
```

### 2. Worker implementa

Worker deve:
```bash
# Criar feature branch
git checkout -b feature/issue-<number>

# Implementar
npm install <packages-necessários>
# ... código ...

# Testar localmente se possível
npm run lint
npm run typecheck
npm test

# Commitar
git add .
git commit -m "feat: <descrição>

Implemented <issue-number>: <título>

- Alteração 1
- Alteração 2

Co-Authored-By: <Worker Name> <worker@example.com>"
```

### 3. Claude Code revisa

Quando o worker commita:
- Ler diff
- Verificar segurança, lógica, conventions
- Se tudo OK: merge ou PR
- Se problemas: Edit direto (correções pequenas) ou comunicar bloqueio

## Estrutura de Commits

```
type(scope): short description

Longer description if needed.

- Bullet point 1
- Bullet point 2

Fixes #123
Co-Authored-By: Worker Name <worker@example.com>
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`

## Convention de Branches

```
main                              # Production-ready
├── develop                       # Integration branch
│   ├── feature/ui-001           # Codex work
│   ├── feature/backend-002      # Gemini work
│   └── feature/infra-003        # OpenCode work
│
└── release/0.1.0
```

## Code Style

### TypeScript
- Strict mode sempre ativado
- Sem `any` type
- Tipos explícitos em funções públicas
- Interfaces para contracts

### React Components
- Functional components sempre
- Props com interface de tipos
- Hooks utilizados corretamente
- Memo/useMemo só quando necessário

### Database
- Migrations versionadas
- Seeds reproduzíveis
- Tipos gerados por Prisma
- Queries otimizadas

## Testes

Mínimo esperado:
- **Unit tests** para lógica pura
- **Integration tests** para API endpoints
- **Component tests** para React components
- **E2E** para fluxos críticos (depois)

Coverage target: 70% (MVP), 85% (produção)

## Integração

### Merge Strategy

1. **Feature branch** → **develop** (via PR ou rebase)
2. **develop** → **main** (quando MVP completo)

### Antes de mergear

```bash
git rebase develop
npm install
npm run lint
npm run typecheck
npm run test
npm run build
```

## Decisões Sem Aprovação

Agentes podem decidir autonomamente:
- Nomes de funções/variáveis
- Estrutura de arquivos
- Seleção de pequenas bibliotecas
- Detalhes de implementação técnica
- Estilos CSS (conforme design system)
- Testes internos
- Refactors reversíveis

## Bloqueios (requerem humano)

Escalar para Claude Code se:
- Mudança de stack/framework
- Alterações de database schema (produção)
- Segurança (secrets, auth, perms)
- Integração com serviço externo
- Mudança de major architecture
- Custos (API keys, services)

## Comunicação

- **Commits**: Feature descriptions
- **PRs**: Context, design decisions
- **Docs**: Manter ARCHITECTURE.md atualizado
- **Issues**: Keep updated with status

## Exemplo de Tarefa Completa

```
[Issue #1] - Setup Next.js project

Assigned: OpenCode (infra)

Issue:
- Init Next.js with TypeScript
- Configure Tailwind CSS
- Setup Prisma with SQLite
- Create basic folder structure
- Add first test

Worker executes:
$ npm create next-app@latest ...
$ npm install prisma tailwindcss
$ npx prisma init
$ mkdir packages/database
$ npm run dev (verify)

Commit:
$ git add .
$ git commit -m "chore(setup): init next.js project

Initialized Next.js 14+ with:
- TypeScript strict mode
- Tailwind CSS configured
- Prisma ORM with SQLite
- Folder structure ready

Co-Authored-By: OpenCode AI <opencode@example.com>"

Claude Code reviews:
- Checks structure ✅
- Verifies configs ✅
- Tests build ✅
- Merges to develop ✅

$ git checkout develop && git merge feature/infra-001

[Issue #1 marked DONE]
[Issue #2 now READY - can start frontend or backend in parallel]
```

## Retry Policy

If worker encounters error:

1. **First try**: Diagnose and fix
2. **Second try**: Alternative approach
3. **Third try**: Request claude code review
4. **Blocked**: Mark issue BLOCKED with detailed log

## Success Criteria

A task is done when:
- ✅ Code committed and merged
- ✅ Tests pass
- ✅ Lint passes
- ✅ TypeCheck passes
- ✅ Build succeeds
- ✅ Feature works end-to-end
- ✅ Issue marked DONE
- ✅ Documentation updated

---

**Coordinator**: Claude Code (Haiku 4.5)  
**Last Updated**: 2026-09-26  
**Version**: 1.0
