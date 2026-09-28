# LIÇÃO 1.4: Dev Environment Setup & Tooling Profissional

**Duração:** 45 minutos  
**Nível:** Intermediário → Avançado  
**Objetivo:** Setup reproduzível, escalonável e production-ready — não apenas local

---

## Introdução

Um dev environment profissional é **o que diferencia um time que entrega rápido de um time preso em conflitos de setup**. Você pode ser engenheiro A-10 no código, mas se seu ambiente está quebrado, CI falha misteriosamente ou o novo membro da equipe passa 3 horas instalando dependências, você está deixando performance na mesa.

Nesta lição vamos construir um setup que:
- ✅ É **reproduzível** (dev, staging, prod usam a mesma stack)
- ✅ É **frictionless** (npm install e tudo funciona)
- ✅ Aplica **qualidade automaticamente** (pre-commit hooks, type checking)
- ✅ Escala com o time (novos devs não sofrem)
- ✅ Aproveita **containerização** (local ≈ production)

---

## SEÇÃO 1: Node.js & Package Managers (10 min)

### 1.1 Node.js: LTS vs. Latest

**LTS (Long Term Support):** v20, v22, etc.
- Suporte por 30 meses
- Estável, recomendado para produção
- Bugs críticos recebem backports

**Latest:** v23+
- Novas features a cada 6 meses
- Melhorias de performance ainda em teste
- Risco de breaking changes entre minor versions

#### Decisão Recomendada:
```
Desenvolvimento    → Node 20 LTS (ou 22 se quiser mais recente, mas ainda LTS)
Production        → Node 20 LTS
CI/CD             → Espelhar production
```

**Por quê?** Você quer que seu time desenvolva contra o mesmo que roda em produção. Zero surpresas.

#### Gerenciamento de Versão com NVM (Node Version Manager)

```bash
# Instalar NVM (Linux/Mac)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Windows: use nvm-windows
# https://github.com/coreybutler/nvm-windows

# Usar e instalar versão específica
nvm use 20
nvm install 20.12.0

# Definir default
nvm alias default 20
```

**`.nvmrc` (versão fixa no projeto):**
```
20.12.0
```

Quando alguém clona o repo e roda `nvm use`, automaticamente usa a versão certa.

---

### 1.2 npm vs. yarn vs. pnpm — Trade-offs

| Aspecto | npm | yarn | pnpm |
|---------|-----|------|------|
| **Velocidade** | Bom | Muito bom | ⭐ Melhor |
| **Espaço em disco** | Muito (duplica node_modules) | Bom (deduped) | ⭐ Melhor (hardlinks) |
| **Lock file** | package-lock.json | yarn.lock | pnpm-lock.yaml |
| **Ecosystem** | Padrão (integração com tudo) | Bom | Crescente, mas menos integrado |
| **Workspaces** | Básicos | Excelentes | Excelentes |
| **Determinístico** | npm 7+ sim | Sempre | Sempre |
| **Learning curve** | Baixa | Média | Média |

#### Recomendação para Produção:

**pnpm** se:
- Seu projeto é monorepo (múltiplos workspaces)
- Espaço em disco é crítico (CI agents, Docker images menores)
- Seu time já conhece gerenciadores avançados

**yarn** se:
- Você precisa de excelente suporte a workspaces + ecosystem maduro
- Quer algo entre npm e pnpm

**npm** se:
- Quer simplicidade + zero dependências externas
- É seu primeiro projeto profissional

#### Para esta aula: Usaremos **npm 10+ (vem com Node.js)**

---

### 1.3 Lock Files: A Verdade sobre package-lock.json

**O que é:** Um snapshot EXATO de todas as versões instaladas — transitive dependencies incluídas.

**Por quê importa:**
```
Sem lock file:
  Dev instala → npm i → webpack 5.1.0
  CI instala → npm i → webpack 5.2.0 (nova patch!)
  RESULTADO: Código que funciona localmente quebra no CI
```

**Regra #1 de Produção:**
```bash
# Sempre usar lock file
git commit package-lock.json

# Em CI, usar --ci (não atualiza, falha se lock está desatualizado)
npm ci  # ao invés de npm install
```

**Configurar no projeto:**

```json
{
  "name": "my-app",
  "version": "1.0.0",
  "engines": {
    "node": ">=20.0.0 <21.0.0",
    "npm": ">=10.0.0"
  },
  "packageManager": "npm@10.8.3",
  "scripts": {
    "ci": "npm ci"
  }
}
```

A chave `packageManager` força a versão exata em pnpm/yarn (compatível com Corepack).

---

### 1.4 Private Registries (npm/Artifact Repository)

Se seu time usa pacotes privados (código interno, libs proprietárias):

```bash
# .npmrc (commitado no git — SEM senhas!)
@mycompany:registry=https://npm.pkg.github.com/
@mycompany:always-auth=true

# ~/.npmrc (USER HOME — SIM com credenciais)
//npm.pkg.github.com/:_authToken=ghp_xxxxxxxxxxxx
```

**Ou usando npm CLI:**
```bash
npm config set @mycompany:registry https://npm.pkg.github.com/
npm config set //npm.pkg.github.com/:_authToken $GITHUB_TOKEN
```

---

## SEÇÃO 2: TypeScript Setup Stricto (10 min)

### 2.1 tsconfig.json Profissional

Essa é a diferença entre TypeScript que salva você de bugs e TypeScript que deixa você escrever `any` em tudo.

```json
{
  "compilerOptions": {
    // === TIPO CHECKING AGRESSIVO ===
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,

    // === RESOLUÇÃO DE MÓDULOS ===
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "moduleResolution": "node",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,

    // === CAMINHOS (aliases) ===
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@utils/*": ["src/utils/*"],
      "@types/*": ["src/types/*"]
    },

    // === OUTPUT ===
    "outDir": "./dist",
    "rootDir": "./src",
    "removeComments": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"]
}
```

### 2.2 O que cada flag faz

```typescript
// strict: true = todos estes abaixo
noUncheckedIndexedAccess: true
  // ❌ const x = arr[0];  // erro: pode ser undefined
  // ✅ const x = arr[0]?: obj;  // ok

noUnusedLocals: true
  // ❌ const unused = "I'm never used";
  // ✅ remove tudo que não é referenciado

noImplicitReturns: true
  // ❌ function test(x) {
  //      if (x) return "yes";
  //    }  // erro: falta return no else
  // ✅ sempre retorna algo ou lança erro
```

---

### 2.3 Type Checking em CI

**GitHub Actions workflow:**
```yaml
name: Type Check

on: [push, pull_request]

jobs:
  type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run type-check
```

**Package.json:**
```json
{
  "scripts": {
    "type-check": "tsc --noEmit",
    "type-check:watch": "tsc --noEmit --watch"
  }
}
```

---

### 2.4 Common Pitfalls

```typescript
// ❌ ERRADO: any esconde erros
function process(data: any) {
  return data.toUpperCase();  // erro em runtime se data é number
}

// ✅ CERTO: tipos explícitos
function process(data: string): string {
  return data.toUpperCase();
}

// ❌ ERRADO: unknown sem type guard
function handle(err: unknown) {
  console.log(err.message);  // erro! err é unknown
}

// ✅ CERTO: narrowing
function handle(err: unknown) {
  if (err instanceof Error) {
    console.log(err.message);  // ok
  }
}

// ❌ ERRADO: Interfaces mutáveis por padrão
interface User {
  name: string;
  age: number;
}
const user: User = { name: "John", age: 30 };
user.age = 999;  // permitido (problema!)

// ✅ CERTO: readonly quando apropriado
interface User {
  readonly name: string;
  readonly age: number;
}
```

---

## SEÇÃO 3: Linting & Formatting (8 min)

### 3.1 ESLint: Configuração Profissional

**Instalação:**
```bash
npm install --save-dev eslint eslint-config-prettier eslint-plugin-prettier
npx eslint --init
```

**`.eslintrc.json` (configuração moderna):**
```json
{
  "env": {
    "browser": true,
    "es2022": true,
    "node": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:prettier/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module",
    "project": "./tsconfig.json"
  },
  "plugins": ["@typescript-eslint", "prettier"],
  "rules": {
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": [
      "error",
      { "argsIgnorePattern": "^_" }
    ],
    "prefer-const": "error",
    "no-var": "error",
    "eqeqeq": ["error", "always"],
    "prettier/prettier": "error"
  }
}
```

### 3.2 Prettier: Formato Automático

**`.prettierrc.json`:**
```json
{
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

**`package.json` scripts:**
```json
{
  "scripts": {
    "lint": "eslint src --fix",
    "format": "prettier --write .",
    "quality": "npm run lint && npm run type-check"
  }
}
```

### 3.3 Husky + Lint-Staged: Pre-commit Hooks

**Instalar:**
```bash
npm install --save-dev husky lint-staged
npx husky install
```

**`.husky/pre-commit`:**
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
```

**`.lintstagedrc.json`:**
```json
{
  "*.{ts,tsx}": [
    "eslint --fix",
    "prettier --write"
  ],
  "*.json": ["prettier --write"],
  "*.md": ["prettier --write"]
}
```

**Como funciona:**
```
Você: git commit -m "meu fix"
  ↓
Husky: executa pre-commit hook
  ↓
Lint-staged: pega arquivos no staging
  ↓
ESLint + Prettier: formata/fixa
  ↓
Resultado: Commit "sujo" vira "limpo" automaticamente
```

---

### 3.4 GitHub Actions para CI

```yaml
name: Lint & Format

on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
```

---

## SEÇÃO 4: VS Code & Extensões Essenciais (8 min)

### 4.1 Extensões Recomendadas

| Extensão | Propósito | Essencial? |
|-----------|-----------|-----------|
| **ESLint** (dbaeumer.vscode-eslint) | Linting em tempo real | ⭐ SIM |
| **Prettier** (esbenp.prettier-vscode) | Formatação ao salvar | ⭐ SIM |
| **TypeScript Vue Plugin** (Vue.volar) | Se usar Vue | ⭐ SIM (Vue) |
| **GitHub Copilot** (github.copilot) | Autocompletar com IA | Recomendado |
| **Thunder Client** (rangav.vscode-thunder-client) | Tester HTTP nativo | Bom |
| **Git Graph** (mhutchie.git-graph) | Visualizar commits | Útil |
| **REST Client** (humao.rest-client) | .http files | Alternativa ao Thunder |
| **Peacock** (johnpapa.vscode-peacock) | Cores por workspace | Produtividade |

### 4.2 settings.json Profissional

**`.vscode/settings.json`:**
```json
{
  // === EDITOR ===
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit"
  },
  "editor.tabSize": 2,
  "editor.insertSpaces": true,
  "editor.detectIndentation": false,
  "editor.trimAutoWhitespace": true,
  "files.trimTrailingWhitespace": true,
  "files.insertFinalNewline": true,

  // === TYPESCRIPT ===
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.check.npmIsInstalled": false,

  // === ESLINT ===
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "eslint.format.enable": false,

  // === FILES ===
  "files.exclude": {
    "**/.git": true,
    "**/node_modules": true,
    "**/.DS_Store": true,
    "**/dist": false
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true
  }
}
```

### 4.3 Debugging Setup

**`.vscode/launch.json`:**
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Launch Program",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/dist/index.js",
      "preLaunchTask": "npm: build",
      "outFiles": ["${workspaceFolder}/dist/**/*.js"]
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Tests",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand", "--no-cache"],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal"
    }
  ]
}
```

### 4.4 Workspace Settings (compartilhado com o time)

```
seu-projeto/
├── .vscode/
│   ├── settings.json       # Configurações compartilhadas
│   ├── launch.json         # Debug configs
│   └── extensions.json     # Recomendações
├── .eslintrc.json
├── .prettierrc.json
└── tsconfig.json
```

**`.vscode/extensions.json`:**
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "github.copilot"
  ]
}
```

Quando um novo dev abre a pasta, VS Code recomenda instalar essas extensões.

---

## SEÇÃO 5: Container Development (9 min)

### 5.1 Dockerfile para Development

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copiar apenas package files (para cache)
COPY package*.json ./

# Instalar dependencies
RUN npm ci

# Copiar código
COPY . .

# Expor porta
EXPOSE 3000

# Development: watch mode
CMD ["npm", "run", "dev"]
```

**Por quê Alpine?** Imagem 3x menor (150MB vs 900MB) — CI mais rápido.

### 5.2 docker-compose.yml para Dev Local

```yaml
version: '3.9'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules  # Não sobrescrever node_modules do container
    environment:
      - NODE_ENV=development
      - DEBUG=app:*
    command: npm run dev
    networks:
      - dev-network

  # Se precisar de database local
  postgres:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev
      POSTGRES_DB: myapp
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - dev-network

volumes:
  postgres_data:

networks:
  dev-network:
    driver: bridge
```

**Usar:**
```bash
# Inicia tudo
docker-compose up

# Em outra aba
docker-compose exec app npm test
docker-compose exec app npm run lint

# Parar
docker-compose down
```

### 5.3 VS Code Dev Containers

**`.devcontainer/devcontainer.json`:**
```json
{
  "name": "Node Dev",
  "image": "node:20-alpine",
  "features": {
    "ghcr.io/devcontainers/features/github-cli:1": {}
  },
  "customizations": {
    "vscode": {
      "extensions": [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode"
      ],
      "settings": {
        "editor.defaultFormatter": "esbenp.prettier-vscode",
        "editor.formatOnSave": true
      }
    }
  },
  "postCreateCommand": "npm ci",
  "remoteUser": "node"
}
```

**Workflow:**
```
1. Abrir projeto
2. VS Code detecta .devcontainer/
3. Clica "Reopen in Container"
4. Espera ~30s enquanto build do container
5. Tudo que faz: npm, git, eslint → dentro do container
6. Git do host funciona normalmente
7. Terminal integrado é shell do container
```

**Vantagem:** Novo dev:
- Não instala nada (nem Node!)
- Clona repo
- Abre em VS Code
- Pronto

### 5.4 Multi-stage Build para Production

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /build
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm prune --production

# Stage 2: Runtime
FROM node:20-alpine

WORKDIR /app
COPY --from=builder /build/node_modules ./node_modules
COPY --from=builder /build/dist ./dist
COPY --from=builder /build/package*.json ./

EXPOSE 3000
CMD ["node", "dist/index.js"]
```

**Resultado:** Imagem ~100MB (sem dev deps, sem TypeScript, sem source code)

### 5.5 .dockerignore

```
node_modules
npm-debug.log
dist
.git
.gitignore
.vscode
.prettierrc.json
.eslintrc.json
README.md
.env.local
.env.*.local
```

---

## RESUMO: Checklist de Setup Profissional

- [ ] Node.js 20 LTS + `.nvmrc`
- [ ] Lock file (`package-lock.json`) commited
- [ ] `tsconfig.json` com `strict: true`
- [ ] ESLint + Prettier configurados
- [ ] Husky pre-commit hooks
- [ ] GitHub Actions para CI (type-check + lint)
- [ ] `.vscode/settings.json` compartilhado
- [ ] Dockerfile + docker-compose.yml
- [ ] `.devcontainer/` para VS Code Dev Containers
- [ ] `.env.example` com variáveis de exemplo (SEM valores reais)
- [ ] CI pipeline testando tudo automaticamente

---

## QUIZ: Teste Seu Conhecimento (5 questões)

### Questão 1: Lock Files
**O que acontece se você NÃO commitar `package-lock.json`?**

A) Nada, é opcional  
B) Cada pessoa que roda `npm install` pode pegar versões diferentes das dependências  
C) npm automaticamente usa a versão mais segura  
D) Só afeta o Windows  

<details>
<summary>Resposta</summary>

**B** — Sem lock file, `npm install` pode resolver dependências de forma diferente em cada máquina. Dev A instala webpack 5.1, CI instala 5.2 → código quebra. É por isso que lock files existem.

</details>

---

### Questão 2: TypeScript Strict Mode
**Por que `"strict": true` no tsconfig.json é importante?**

A) Compila mais rápido  
B) Obriga explicitação de tipos, evita bugs como null/undefined implícitos  
C) Permite usar `any` em qualquer lugar  
D) Aumenta o tamanho do bundle  

<details>
<summary>Resposta</summary>

**B** — TypeScript "estrito" força você a pensar sobre tipos, evitando classes comuns de bugs (null pointer exceptions, type coercion surprises, etc.). É o que torna TypeScript valioso.

</details>

---

### Questão 3: Pre-commit Hooks
**Qual é a vantagem principal de Husky + lint-staged?**

A) Faz o código compilar mais rápido  
B) Garante que código lintado e formatado seja commited automaticamente, sem erro humano  
C) Remove a necessidade de CI/CD  
D) Permite commits sem testes  

<details>
<summary>Resposta</summary>

**B** — Pre-commit hooks rodam ESLint/Prettier automaticamente antes do commit. Se falhar, commit é bloqueado. Isso **evita que código ruim entre no repo**.

</details>

---

### Questão 4: Escolha de Package Manager
**Quando usar pnpm ao invés de npm?**

A) Nunca, npm é sempre melhor  
B) Quando seu projeto é monorepo ou espaço em disco é crítico  
C) Só quando você quer se mostrar  
D) Nunca em produção  

<details>
<summary>Resposta</summary>

**B** — pnpm usa hardlinks (não cópia), economiza ~70% espaço. Excelente para monorepos e CI em máquinas com pouca memória. npm é mais simples e sempre será, mas pnpm é melhor para casos específicos.

</details>

---

### Questão 5: Dev Containers
**Qual benefício de usar `.devcontainer/` no VS Code?**

A) Seu código roda mais rápido  
B) Todos no time têm exatamente o mesmo environment (sem "funciona na minha máquina")  
C) Elimina a necessidade de Git  
D) Aumenta segurança do código fonte  

<details>
<summary>Resposta</summary>

**B** — Dev containers garantem que Dev A no Windows, Dev B no Mac e CI no Linux usem EXATAMENTE o mesmo Node.js, versão de packages, etc. Zero surpresas. É a maneira moderna de "ninguém sofre com setup".

</details>

---

## EXERCÍCIO PRÁTICO: Setup Profissional Completo (30 min)

### Objetivo
Configurar um projeto Node.js production-ready do zero com todo o setup desta lição.

### Passos

#### Passo 1: Criar projeto base
```bash
mkdir my-harness-project
cd my-harness-project

# Iniciar git
git init
git config user.name "Your Name"
git config user.email "your@email.com"

# Iniciar Node project
npm init -y

# Criar .nvmrc
echo "20.12.0" > .nvmrc

# Criar diretório src/
mkdir src
```

#### Passo 2: Instalar dependências
```bash
# TypeScript + types
npm install --save-dev typescript @types/node

# ESLint + Prettier
npm install --save-dev eslint eslint-config-prettier eslint-plugin-prettier prettier

# Husky + lint-staged
npm install --save-dev husky lint-staged
npx husky install

# (Opcional) Dev utils
npm install --save-dev ts-node nodemon
```

#### Passo 3: Configurar TypeScript
**`tsconfig.json`:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "node",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

#### Passo 4: Configurar ESLint
**`.eslintrc.json`:**
```json
{
  "env": {
    "es2022": true,
    "node": true
  },
  "extends": ["eslint:recommended", "plugin:prettier/recommended"],
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  "rules": {
    "no-console": "off",
    "prefer-const": "error",
    "no-var": "error",
    "eqeqeq": ["error", "always"],
    "prettier/prettier": "error"
  }
}
```

#### Passo 5: Configurar Prettier
**`.prettierrc.json`:**
```json
{
  "printWidth": 100,
  "tabWidth": 2,
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "endOfLine": "lf"
}
```

#### Passo 6: Configurar Husky
```bash
npx husky add .husky/pre-commit "npx lint-staged"
```

**`.lintstagedrc.json`:**
```json
{
  "*.ts": ["eslint --fix", "prettier --write"],
  "*.json": ["prettier --write"]
}
```

#### Passo 7: Adicionar scripts
**`package.json`:**
```json
{
  "scripts": {
    "dev": "ts-node src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "lint": "eslint src --fix",
    "format": "prettier --write .",
    "type-check": "tsc --noEmit",
    "quality": "npm run type-check && npm run lint"
  }
}
```

#### Passo 8: Criar exemplo
**`src/index.ts`:**
```typescript
interface User {
  name: string;
  age: number;
}

function greet(user: User): void {
  console.log(`Hello, ${user.name}!`);
  console.log(`You are ${user.age} years old.`);
}

const user: User = {
  name: 'Alice',
  age: 30,
};

greet(user);
```

#### Passo 9: Testar
```bash
# Type check
npm run type-check

# Lint + format
npm run lint

# Run
npm run dev

# Build
npm run build
npm run start
```

#### Passo 10: Configurar Git
```bash
# .gitignore
echo "node_modules/
dist/
.env.local
*.log" > .gitignore

# Commit tudo
git add .
git commit -m "chore: setup professional dev environment

- Node.js 20 LTS with .nvmrc
- TypeScript with strict mode
- ESLint + Prettier configured
- Husky pre-commit hooks
- npm scripts for quality checks"
```

#### Passo 11 (Bônus): Dockerfile
**`Dockerfile`:**
```dockerfile
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev"]
```

**`docker-compose.yml`:**
```yaml
version: '3.9'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
    command: npm run dev
```

```bash
docker-compose up
```

### Validação

Você sabe que terminou quando:

- ✅ `npm run type-check` passa sem erros
- ✅ `npm run lint` fixa automaticamente problemas
- ✅ `npm run dev` roda sem aviso (ou com warnings controlados)
- ✅ Fazer `git commit` sem formatar → Husky previne (lint-staged roda)
- ✅ `docker-compose up` executa a app sem erros
- ✅ Repository está limpo e profissional

---

## Referências

- [Node.js Official Docs](https://nodejs.org/en/docs/)
- [TypeScript Strict Mode](https://www.typescriptlang.org/tsconfig#strict)
- [ESLint Best Practices](https://eslint.org/docs/rules/)
- [Prettier Docs](https://prettier.io/docs/)
- [Husky](https://typicode.github.io/husky/)
- [Docker for Node.js](https://docs.docker.com/language/nodejs/)
- [VS Code Dev Containers](https://code.visualstudio.com/docs/devcontainers/containers)

---

## Próxima Lição
**1.5: Testing Strategies & CI/CD Pipeline** — Testes automatizados, coverage, GitHub Actions avançado.

