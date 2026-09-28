# LICAO 11.1: Project Setup & Architecture

Monte a base profissional do Harness Tutor: worktree isolado, monorepo pnpm + Turborepo, Project References do TypeScript e a fronteira de dominio que vai separar o CLI do dashboard.

## Objetivos da licao

- Isolar o capstone em um worktree Git proprio, sem sujar a branch principal do curso.
- Montar um monorepo pnpm workspaces com quatro pacotes e um grafo de dependencias explicito.
- Compilar o codigo compartilhado duas vezes (referencia em tempo de build + emissao de tipos) via Project References.
- Isolar o dominio puro (`@harness/core`) de I/O, para que o mesmo codigo sirva o CLI, a API e a web.
- Validar variaveis de ambiente com Zod no boot, falhando cedo e com mensagem util.
- Provar a configuracao com um unico comando (`pnpm verify`) que roda build, typecheck e testes em grafo.

## Contexto do modulo

O Modulo 11 e o capstone. Nas onze licoes anteriores voce aprendeu partes: arquitetura e padroes (1, 7), React (2), Node e HTTP (3), dados (4), cache e real-time (5), testes (6), escala (8), entrega (9), e Claude (10). Agora voce junta tudo em um produto so: o **Harness Tutor**, um tutor de engenharia de IA que roda no terminal e no navegador.

Este projeto custa 14 a 20 horas, o equivalente a uma semana de trabalho. A divisao e: 11.1 ~2h, 11.2 ~3h, 11.3 ~4h, 11.4 ~3h, 11.5 ~3h. A licao de hoje e a unica que, se voce pular, faz todas as outras voltarem para reescrever imports.

Um alerta honesto antes de comecar: existe um monorepo "grande" e existe um monorepo "certo". Nenhum trainee deve sair daqui com um `src/` de 200 arquivos e um `package.json` com 60 dependencias. O objetivo desta aula e o oposto: quatro pacotes com fronteiras claras, e uma regra simples para decidir o que entra em cada um.

## SECAO 1: O TRABALHO PROFISSIONAL COMECA ANTES DO CODIGO

Tres habitos separam quem entrega projeto de quem entrega codigo. Todos vao acontecer nesta aula.

O primeiro e o **worktree**. `git worktree` cria um segundo diretorio de trabalho apontando para o mesmo repositorio, cada um em uma branch diferente. Voce pode ter o curso aberto em `main` e o capstone aberto em `capstone/harness-tutor` ao mesmo tempo, sem `git stash`, sem commit acidental e sem trocar de branch no meio de uma sessao de debug. O `.git` fica compartilhado; os arquivos de trabalho, nao.

O segundo e o **monorepo com fronteiras declaradas**. Um monorepo nao e "uma pasta com varios package.json". E um conjunto de pacotes onde cada um declara o que consome, e o grafo de dependencias e a documentacao de arquitetura do seu sistema. Se `apps/cli` importa `apps/api`, algo quebrou.

O terceiro e a **decisao registrada**. Toda decisao estrutural (por que dois pacotes e nao um? por que o dominio nao chama a API do Claude?) merece um ADR (Architecture Decision Record): um arquivo de 20 linhas. Quatro meses depois, o ADR e a unica coisa que explica por que o codigo e assim.

## SECAO 2: A FRONTEIRA DE DOMINIO

O erro mais caro do capstone seria fazer o CLI e o dashboard compartilharem tudo por convenience. O desenho que funciona tem tres camadas:

- **Dominio puro** (`packages/core`): tipos, schemas, calculos, a maquina de estado da sessao, o runner de avaliacao. Zero `fetch`, zero `process`, zero `import.meta`. Depende so de `zod`.
- **Adaptadores** (`packages/cli`, `apps/api`, `apps/web`): leem arquivo, escrevem no terminal, chamam HTTP, renderizam React. Todos dependem de `core`; `core` nao depende de ninguem.
- **Integracao** (`apps/api`): o unico lugar que fala com Claude, Postgres e Redis.

O ganho concreto: seu `core` tem testes que rodam em 40ms sem rede, sem banco e sem mock. No Modulo 6 voce aprendeu que mock e custo. Aqui a fronteira elimina o mock na maior parte do sistema. E o dashboard e o CLI ficam multiplataforma de graca, porque a logica nao depende de runtime Node nem de browser.

O criterio pratico para decidir o pacote de um arquivo: *se este arquivo teria que mudar se o Claude trocasse de modelo?* Se nao, ele e dominio. Se sim, ele e adaptador.

---

## PASSO A PASSO

### Passo 1 - Verificar e fixar o ambiente

Confirme as versoes antes de escrever codigo. Versao errada de Node produz erro de tipo que parece bug do framework.

```bash
node --version   # deve ser v22.x
pnpm --version   # 10.x
git --version    # >= 2.40 (suporta worktree com --relative)
docker --version
gh --version
```

Se `pnpm` nao existir, instale com o gerenciador de versoes do Node e fixe a versao no projeto (Passo 3). Nao use `npm install -g` para ferramentas que affectam o projeto.

### Passo 2 - Criar o worktree do capstone

O worktree mora **fora** do repositorio, para nao ser confundido com conteudo do curso.

```bash
cd "A:/Projetos Lucas/Curso Engenharia Harness IA"
git status                      # working tree limpa? commite ou stash antes
git worktree add ../wt/harness-tutor -b capstone/harness-tutor
cd ../wt/harness-tutor
git worktree list              # confirma os dois worktrees
```

Crie um README imediatamente. Worktree vazio com branch nova e a unica combinacao em que a pessoa se perde depois de uma semana.

```bash
mkdir -p docs/adr
printf '# Harness Tutor\n\nCapstone do Modulo 11. Ver docs/adr.\n' > README.md
```

### Passo 3 - Inicializar o monorepo

```bash
pnpm init
```

`package.json` raiz. Note `private: true` (obrigatorio para workspace) e `"type": "module"` (o projeto inteiro sera ESM).

```json
{
  "name": "harness-tutor",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@10.11.0",
  "engines": { "node": ">=22.11.0" },
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev --parallel",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "verify": "pnpm build && pnpm typecheck && pnpm test && pnpm lint"
  },
  "devDependencies": {
    "turbo": "^2.3.0",
    "typescript": "^5.9.0",
    "vitest": "^3.2.0",
    "zod": "^4.1.0"
  }
}
```

O script `verify` e o contrato. Voce vai roda-lo dezenas de vezes por dia; ele precisa ser o unico comando necessario para saber se o projeto esta sao.

### Passo 4 - Declarar os workspaces e ligar o Turborepo

`pnpm-workspace.yaml` (pnpm 10 usa YAML, nao mais o campo `workspaces` do package.json):

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

`turbo.json` define o grafo. `dependsOn: ["^build"]` garante que `core` compile antes de quem depende dele, sem vocor ordenar manualmente.

```json
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "stream",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**", ".next/**", "!.next/cache/**"] },
    "typecheck": { "dependsOn": ["^build"] },
    "test": { "dependsOn": ["^build"], "outputs": [] },
    "lint": {},
    "dev": { "cache": false, "persistent": true }
  }
}
```

### Passo 5 - Definir os quatro pacotes

```bash
mkdir -p packages/core/src packages/cli/src apps/api/src apps/web
```

| Caminho | Responsabilidade | Pode depender de |
|---|---|---|
| `packages/core` | dominio puro, schemas, evaluator | `zod` |
| `packages/cli` | `harness-tutor init/chat/test/submit` | `core`, commander |
| `apps/api` | HTTP, Claude, Prisma, Redis | `core`, fastify |
| `apps/web` | dashboard Next.js | `core`, react |

Antes de escrever `package.json` de cada um, escreva a tabela acima num ADR. Registrar a decisao antes de implementa-la evita a discussao de 40 minutos sobre nomes de pasta depois que o codigo ja existe.

### Passo 6 - Configurar Project References

O `tsconfig.base.json` na raiz define as opcoes que nao mudam.

```json
{
  "$compilerOptions": {
    "target": "ES2023",
    "lib": ["ES2023"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "composite": true,
    "skipLibCheck": true
  }
}
```

`strict` sozinho nao basta. `noUncheckedIndexedAccess` obriga voce a tratar `arr[0]` como possivelmente `undefined` — foi exatamente onde a Licao 10.5 Alertou sobre bug de production. `verbatimModuleSyntax` obriga `import type`, que mantem o bundle do dashboard menor.

Cada pacote referencia o anterior:

```json
// packages/core/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "outDir": "dist", "rootDir": "src" },
  "include": ["src/**/*"]
}

// packages/cli/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "outDir": "dist", "rootDir": "src" },
  "include": ["src/**/*"],
  "references": [{ "path": "../core" }]
}
```

`apps/web` e a excecao: o Next.js gerencia o proprio `tsconfig` e nao deve receber `composite: true` (o build do Next ignora `outDir`).

### Passo 7 - Declarar dependencias com protocolo de workspace

Ponto que economiza horas de depuracao: **sempre** com `workspace:*`.

```json
// packages/cli/package.json
{
  "name": "@harness/cli",
  "version": "0.1.0",
  "type": "module",
  "bin": { "harness-tutor": "./dist/index.js" },
  "exports": { ".": "./dist/index.js" },
  "scripts": {
    "build": "tsc -b",
    "typecheck": "tsc -b --pretty",
    "test": "vitest run",
    "lint": "eslint src"
  },
  "dependencies": {
    "@harness/core": "workspace:*",
    "commander": "^13.1.0",
    "picocolors": "^1.1.1"
  }
}
```

Com `workspace:*`, o pnpm cria um symlink. Alterou `core` e o CLI ve o codigo novo no proximo start, sem `npm link` nem `pnpm build` manual.

### Passo 8 - Validar ambiente com Zod no boot

Erro de configuracao deve acontecer no primeiro segundo, nao no quinto deploy. `packages/core/src/config.ts`:

```ts
import { z } from "zod";

const ServerEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  ANTHROPIC_API_KEY: z.string().min(1),
  TUTOR_MODEL: z.string().default("claude-sonnet-4-5"),
  DATABASE_URL: z.url(),
  REDIS_URL: z.string().default(""),
});

export type ServerEnv = z.infer<typeof ServerEnvSchema>;

export function loadServerEnv(source: NodeJS.ProcessEnv = process.env): ServerEnv {
  const parsed = ServerEnvSchema.safeParse(source);
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${detail}`);
  }
  return parsed.data;
}
```

`z.coerce.number()` aceita a string `"4000"` e transforma em numero — string e numero sao tipos diferentes em TypeScript, e banco de dados nao faz conversao implicita. O detalhe da mensagem de erro e o que separa um bom onboarding de um ticket "nao funciona".

### Passo 9 - Escrever o primeiro tipo de dominio e o primeiro teste

`packages/core/src/session.ts` — puro, sem I/O, testavel em milissegundos.

```ts
export type SessionState =
  | { phase: "idle" }
  | { phase: "awaiting_input" }
  | { phase: "thinking"; startedAt: number }
  | { phase: "streaming"; chars: number }
  | { phase: "failed"; reason: string };

export type SessionEvent =
  | { type: "start" }
  | { type: "submit" }
  | { type: "first_token" }
  | { type: "done" }
  | { type: "error"; reason: string };

export function sessionReducer(state: SessionState, event: SessionEvent): SessionState {
  switch (event.type) {
    case "start":
      return { phase: "awaiting_input" };
    case "submit":
      return { phase: "thinking", startedAt: 0 };
    case "first_token":
      return state.phase === "thinking" ? { phase: "streaming", chars: 0 } : state;
    case "done":
      return { phase: "awaiting_input" };
    case "error":
      return { phase: "failed", reason: event.reason };
  }
}
```

`packages/core/src/session.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { sessionReducer, type SessionState } from "./session.js";

describe("sessionReducer", () => {
  it("ignora first_token fora de thinking", () => {
    const idle: SessionState = { phase: "idle" };
    expect(sessionReducer(idle, { type: "first_token" })).toBe(idle);
  });

  it("leva de thinking para streaming", () => {
    const thinking: SessionState = { phase: "thinking", startedAt: 0 };
    expect(sessionReducer(thinking, { type: "first_token" })).toEqual({ phase: "streaming", chars: 0 });
  });

  it("volta para awaiting_input apos done", () => {
    const streaming: SessionState = { phase: "streaming", chars: 42 };
    expect(sessionReducer(streaming, { type: "done" })).toEqual({ phase: "awaiting_input" });
  });
});
```

Tres testes, zero mock, zero rede. Esse e o dividends da fronteira de dominio. Note tambem o `.js` no import: obrigatorio em ESM com `NodeNext`.

### Passo 10 - Escrever os ADRs

`docs/adr/0001-monorepo-pnpm-turbo.md`:

```markdown
# ADR 0001 - Monorepo com pnpm workspaces e Turborepo

## Status
Aceito (2026-09-28)

## Contexto
CLI, API e dashboard compartilham o dominio e precisam ser consistentes
entre si. Four independent repositories exigiriam 4 pipelines, 4 versoes
do core e publicacao simultanea.

## Decisao
Monorepo com quatro pacotes e Project References do TypeScript.

## Consequencias
- Positivo: `pnpm verify` valida o sistema inteiro; refactor no core
  propaga por link simbolico.
- Negativo: o core precisa ser framework-agnostic; um `import { db }`
  dentro de `core` e proibido por review.
- Alternativa rejeitada: polyrepo com versionamento independente, pois
  o core muda varias vezes por semana durante o capstone.
```

Escreva ADR 0002 (dominio puro) e 0003 (Fastify em vez de Next API routes para o backend) tambem. A decisao do backend merece ADR explicito: Next API routes seriam menos codigo, mas nao dariam container proprio, nem pool de conexao estavel, nem worker de background. A Licao 9.1 mostra por que o container e o contrato de deploy.

### Passo 11 - Higiene de repositorio

```bash
touch .nvmrc .npmrc .editorconfig .gitignore
echo "22.11.0" > .nvmrc
echo "engine-strict=true" > .npmrc
echo "auto-install-peers=true" >> .npmrc
```

O `.gitignore` precisa cobrir os saidos de build de todos os pacotes:

```gitignore
node_modules/
dist/
.next/
.turbo/
coverage/
*.tsbuildinfo
.env
.env.local
!.env.example
worktrees/
```

`engine-strict=true` no `.npmrc` faz o pnpm recusar Node 22.9 em vez de gerar `ERR_REQUIRE_ESM` confuso no meio do build.

### Passo 12 - Criar o bootstrap de uma linha

Um comando para levantar o projeto inteiro do zero. Este script e o que o avaliador da Licao 11.5 vai rodar.

```bash
cat > bootstrap.sh <<'SH'
#!/usr/bin/env bash
set -euo pipefail
pnpm install
pnpm verify
[ -f .env ] || cp .env.example .env
printf '\nPronto. Rode: pnpm dev\n'
SH
chmod +x bootstrap.sh
```

### Passo 13 - Validar o grafo inteiro

```bash
pnpm install
pnpm verify
```

Se o build do core falhar e o do CLI tambem, o problema esta no core, nao no CLI — e o Turborepo para o grafo e mostra isso em vez deismissar 20 erros. Esse e o ganho real do cache de task: nao e velocidade, e atribuicao de culpa.

Confirme a ordem com o grafo visual:

```bash
pnpm turbo run build --graph=html   # abre um HTML com o DAG
```

### Passo 14 - O criterio de "pronto" desta licao

Antes de seguir para 11.2:

```bash
node --input-type=module -e "import('@harness/core').then(m => console.log(Object.keys(m)))"
```

Seu monorepo esta pronto quando: `pnpm verify` passa, o comando acima imprime os simbolos do dominio, e `git status` mostra apenas os arquivos desta aula. Se `git status` mostrar `.env`, pare: `.env` nunca entra no repositorio, so `.env.example`.

---

## Decisoes praticas

- **Workspace protocol em toda dependencia interna.** `workspace:*` elimina a copia divergente que so aparece em producao.
- **Dominio sem I/O e a decisao que mais paga.** Metade dos testes do projeto deixa de precisar de mock.
- **Project References, nao alias de path.** Alias funciona no editor e falha no build de container. Referencia compila de verdade.
- **Project references exigem `rootDir` explicito.** Sem isso o `tsc` inclui arquivos de outro pacote e a saida fica com estrutura errada.
- **`tsc -b` no lugar de `tsc` nos pacotes.** `-b` compila em grafo e incrementa; `-b --watch` recursa. O dashboard nao usa isso (Next compila).
- **Um unico comando de verificacao.** Se voce precisa de dois, voce nao vai rodar nenhum com frequencia.

## Checklist de implementacao

1. Worktree criado e README inicial.
2. `pnpm-workspace.yaml` e `turbo.json` presentes.
3. Quatro pacotes com `package.json` e `tsconfig.json`.
4. `tsconfig.base.json` com `strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`.
5. `@harness/core` compila e tem zero dependencia de I/O.
6. `loadServerEnv` falha com mensagem acionavel.
7. Reducer de sessao com 3 testes verdes.
8. Tres ADRs escritos.
9. `.gitignore` cobre `dist/`, `.next/`, `.turbo/`, `.env`.
10. `pnpm verify` passa de ponta a ponta.

## Exercicios

### Questao 1
**Pergunta:** Por que usar `workspace:*` em vez de `"@harness/core": "^0.1.0"`?

**Resposta esperada:** `workspace:*` faz o pnpm instalar um symlink para o pacote local, garantindo que alteracoes no core aparecam imediatamente e que nunca exista uma versao publicada divergente da local.

### Questao 2
**Pergunta:** `packages/core/src/stats.ts` importa `@prisma/client`. Qual regra foi violada?

**Resposta esperada:** A fronteira de dominio. `core` nao pode depender de I/O nem de framework externo, senao seus testes passam a exigir banco e o CLI deixa de ser multiplataforma. O acesso a dados pertence a `apps/api`.

### Questao 3
**Pergunta:** Por que `exactOptionalPropertyTypes` esta ligado?

**Resposta esperada:** Porque sem ele, `{ port?: number }` aceita `port: undefined` explicitamente, e esse valor se distingue do ausente em tempo de execucao. Isso mascara bugs de serializacao e de validacao em payloads de API.

### Questao 4
**Pergunta:** Se voce adiciona um quinto pacote `packages/ui`, qual documento precisa ser atualizado e por que?

**Resposta esperada:** O ADR 0001 e a tabela de fronteiras do Passo 5, porque o grafo de dependencias e parte da arquitetura documentada, nao um detalhe de implementacao. Sem registrar, o proximo dev assume que pode importar qualquer pacote de qualquer lugar.

### Questao 5
**Pergunta:** `pnpm build` passa mas `pnpm typecheck` falha com erro em `apps/web`. Qual a causa mais provavel?

**Resposta esperada:** `apps/web` herdou `composite: true` e `outDir` do tsconfig base, o que o Next.js nao suporta, ou o arquivo gerado pelo `next-env.d.ts` nao esta incluido. Verifique se `apps/web/tsconfig.json` remove `composite` e se o plugin do Next esta aplicado.

## Exercicio pratico com gabarito

### Enunciado
Transforme o monorepo em um template reaproveitavel: extraia a criacao dos quatro pacotes para `scripts/scaffold.mjs`, adicione `packages/core/src/env.ts` com schemas separados para `ServerEnv` e `BrowserEnv` (o browser nao pode ver `ANTHROPIC_API_KEY`), e escreva um teste que prove que `BrowserEnvSchema` rejeita essa chave.

### Entregaveis
- `scripts/scaffold.mjs` executavel, idempotente, com `--dry-run`.
- `packages/core/src/env.ts` com `ServerEnvSchema` e `BrowserEnvSchema`.
- `packages/core/src/env.test.ts` com pelo menos 4 casos: happy path, porta invalida, URL invalida, e rejeicao de segredo no browser.
- `docs/adr/0004-browser-env-allowlist.md`.

### Gabarito esperado
O scaffold usa `node:fs/promises` e uma lista declarativa de pacotes, escrevendo `package.json` e `tsconfig.json` de cada um a partir de um template unico, sem duplicar literais. O `BrowserEnvSchema` usa `z.object({...}).strict()`, de modo que qualquer chave desconhecida — inclusive `ANTHROPIC_API_KEY` — falha na borda, e o teste confirma isso.

### Criterios de avaliacao
1. Nenhum arquivo gerado contem caminho absoluto do seu computador.
2. Rodar o scaffold duas vezes nao quebra nada.
3. `BrowserEnvSchema` falha fechado, nao aberto.
4. A fronteira de dominio continua valendo: `core` nao importa nada de `apps/`.
5. `pnpm verify` passa.

## Fechamento

Voce tem um worktree isolado, um monorepo com quatro fronteiras e um unico comando que prova que tudo compila e passa. Nada aqui e visivel no produto final — e exatamente por isso que importa. Na proxima licao a fronteira se paga: o CLI `harness-tutor` vai consumir `@harness/core` e obter, de graca, os tipos, os schemas de configuracao e o reducer de sessao que voce acabou de escrever.
