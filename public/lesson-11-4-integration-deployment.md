# LICAO 11.4: Integration & Deployment

Coloque o Harness Tutor em producao: imagem Docker multi-stage para a API, GitHub Actions com typecheck, testes e build, e deploy do dashboard na Vercel com o contrato de variaveis correto.

## Objetivos da licao

- Escrever um Dockerfile multi-stage com usuario nao-root, `.dockerignore` e cache de camadas.
- Subir Postgres e Redis com `docker compose` para o ambiente de desenvolvimento.
- Criar um pipeline GitHub Actions com typecheck, testes e build, bloqueando merge em falha.
- Fazer o deploy da API em container e do dashboard na Vercel.
- Implementar health check, graceful shutdown e readiness que refletem dependencia real.
- Escrever uma runbook de rollback que funciona quando ninguem esta acordado as 3h.

## Contexto do modulo

Voce tem tres interfaces funcionando em `localhost`. Esta licao trata do problema mais frequentemente subestimado em engenharia: **o ambiente onde o codigo roda e diferente do ambiente onde ele foi escrito**.

Em `localhost` voce tem Node 22 instalado, `.env` na mao, e acesso ao banco. Em producao voce tem uma imagem de 180MB, um container efemero que reinicia quando a plataforma decide, um proxy que bufferiza, e variaveis de ambiente que so existem se alguem cadastrou. Cada diferenca e um bug esperando.

Orcamento: ~3h. Esta e a licao com mais "coisas para clicar" e menos decisao conceitual — mas e ela que separa um projeto de coursework de um projeto que aguenta o primeiro usuario real.

## SECAO 1: O CONTRATO DE SAUDE

Antes de qualquer container, uma decisao: o que o endpoint `/health` precisa provar?

Um `/health` que so retorna `{ status: "ok" }` responde "o processo Node esta vivo". Isso nao diz se o banco aceita queries, se o Claude responde, ou se o Redis esta acessivel. E um health check que nunca falha e pior que nenhum: ele da falso verde enquanto a aplicacao esta inutil.

A distincao que profissionaliza o sistema:

- **Liveness** (`/health`): "o processo responde?" Se nao, o orquestrador deve reiniciar. Nao checa dependencia — senao uma falha de banco causa restart loop.
- **Readiness** (`/ready`): "pode receber trafego agora?" Verifica banco e, de forma opcional, cache. Se nao, o balanceador tira a instancia de rotacao sem reiniciar.

A Licao 8.5 trata disponibilidade e os doisEstados aparecem la. Aqui eles viram codigo.

```ts
// apps/api/src/health.ts
import type { FastifyInstance } from "fastify";
import { z } from "zod";

export async function registerHealth(app: FastifyInstance, deps: { db: { $queryRaw: unknown } }): Promise<void> {
  app.get("/health", async () => ({ status: "ok", uptime: process.uptime() }));

  app.get("/ready", async (_request, reply) => {
    const checks: Record<string, "ok" | "fail"> = { database: "ok", cache: "ok" };
    let ready = true;

    try {
      await (deps.db as { $queryRaw: (q: string) => Promise<unknown> }).$queryRaw("SELECT 1");
    } catch {
      checks["database"] = "fail";
      ready = false;
    }

    if (!ready) return reply.code(503).send({ status: "not_ready", checks });
    return reply.send({ status: "ready", checks });
  });
}
```

Note que liveness **nao** toca o banco. Se o banco cair e o liveness falhar, o orquestrador reinicia a API 10 vezes, e o problema real — banco — continua. Liveness responde "o processo travou?"; readiness responde "consigo trabalhar?".

---

## PASSO A PASSO

### Passo 1 - A API: Fastify com rotas minimas

O ADR 0003 da 11.1 decidiu Fastify em vez de Next API routes. Agora escreva o servidor. `apps/api/src/server.ts`:

```ts
import Fastify from "fastify";
import { PrismaClient } from "@prisma/client";
import { loadServerEnv } from "@harness/core";
import { registerHealth } from "./health.js";
import { registerChat } from "./routes/chat.js";
import { registerLessons } from "./routes/lessons.js";

const env = loadServerEnv();
const app = Fastify({ logger: { level: env.NODE_ENV === "production" ? "info" : "debug" } });
const prisma = new PrismaClient();

await registerHealth(app, { db: prisma });
await registerLessons(app, { prisma });
await registerChat(app, { env, prisma });

// Registrado ANTES do listen: se o processo morrer entre as duas linhas,
// o SIGTERM chega sem handler e o container morre com conexoes abertas.
registerShutdown(app, { closeDb: () => prisma.$disconnect() });

try {
  await app.listen({ port: env.PORT, host: "0.0.0.0" });
} catch (error) {
  app.log.error(error);
  await prisma.$disconnect();
  process.exit(1);
}
```

`host: "0.0.0.0"` e obrigatorio em container. O default `localhost` faz o processo responder apenas dentro do container, e o health check do orquestrador retorna connection refused. Esse erro custa 30 minutos de debug em toda primeira vez.

A ordem das duas linhas importa mais do que parece. `registerShutdown` antes de `listen` e `prisma.$disconnect()` no `catch` sao as duas metades da mesma disciplina: se um erro de bootstrap deixa o processo morrendo, ele morre com o banco fechado e o log gravado. O caminho de erro do bootstrap e o mais esquecido e o que mais aparece em incidente de deploy.

### Passo 2 - Graceful shutdown com Fastify

```ts
// apps/api/src/shutdown.ts
import type { FastifyInstance } from "fastify";

export function registerShutdown(app: FastifyInstance, deps: { closeDb: () => Promise<void> }): void {
  let closing = false;

  const shutdown = async (signal: string) => {
    if (closing) return;
    closing = true;
    app.log.info({ signal }, "encerrando");

    const timer = setTimeout(() => {
      app.log.error("timeout no shutdown, forcando saida");
      process.exit(1);
    }, 10_000);
    timer.unref();

    try {
      await app.close();
      await deps.closeDb();
      clearTimeout(timer);
      process.exit(0);
    } catch (error) {
      app.log.error({ error }, "falha no shutdown");
      process.exit(1);
    }
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}
```

O `closing` evita corrida: se `SIGTERM` e `SIGINT` chegarem juntos (o que acontece em `Ctrl+C` seguido de `docker stop`), o segundo handler nao inicia um segundo fechamento.

O timeout de 10 segundos e o que impede um container de ficar em estado `Terminating` para sempre, segurando o deploy. E a mesma ideia do `maxDuration` da Licao 9.2: limite de tempo para qualquer operacao que possa travar.

### Passo 3 - Schema Prisma e migracao

```prisma
// apps/api/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Lesson {
  id          String   @id @default(cuid())
  slug        String   @unique
  title       String
  description String
  order       Int
  published   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  progress    Progress[]
  sessions    Session[]

  @@index([order])
}

model Student {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  createdAt DateTime @default(now())

  progress  Progress[]
  sessions  Session[]
}

model Progress {
  id        String   @id @default(cuid())
  score     Int
  attempts  Int      @default(1)
  lessonId  String
  studentId String
  updatedAt DateTime @updatedAt

  lesson  Lesson  @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  student Student @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@unique([lessonId, studentId])
  @@index([studentId])
}

model Session {
  id        String   @id @default(cuid())
  studentId String
  lessonId  String
  tokensIn  Int      @default(0)
  tokensOut Int      @default(0)
  createdAt DateTime @default(now())

  student Student @relation(fields: [studentId], references: [id], onDelete: Cascade)
  lesson  Lesson  @relation(fields: [lessonId], references: [id], onDelete: Cascade)

  @@index([studentId, createdAt])
}
```

Tres escolhas que valem explicacao:

**`@@unique([lessonId, studentId])` em Progress.** Um aluno tem um registro de progresso por licao. Sem essa constraint, um retry de rede cria dois registros e o dashboard soma pontos errados. E o padrao "idempotencia no banco" do Modulo 4.5.

**`@@index([studentId])` em Progress e `@@index([studentId, createdAt])` em Session.** O dashboard sempre filtra "progresso deste aluno" e "sessoes recentes deste aluno". O indice composto evita o table scan que so aparece com 100 mil linhas — exatamente o Modulo 4.2.

**Token usage em Session.** A Licao 10.1 mostrou que custo e um dado de negocio, nao so de infra. Com `tokensIn`/`tokensOut` persistidos, o custo por aluno vira uma query.

```bash
cd apps/api
npx prisma migrate dev --name init
npx prisma generate
```

### Passo 4 - Docker multi-stage para a API

O ponto central desta secao. Uma imagem de aplicacao tem duas fases: uma com todo o ferramental de build, outra so com o resultado e o runtime.

```dockerfile
# apps/api/Dockerfile
# syntax=docker/dockerfile:1.7

FROM node:22.11.0-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/core/package.json packages/core/
COPY apps/api/package.json apps/api/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter @harness/api... --filter @harness/core

FROM deps AS build
COPY tsconfig.base.json ./
COPY packages/core packages/core
COPY apps/api apps/api
RUN pnpm --filter @harness/core build && pnpm --filter @harness/api build
# --legacy flag deixa `deploy` funcionar mesmo com o campo injectWorkspacePackages
# ligado no pnpm-workspace.yaml; sem isso o comando aborta.
RUN pnpm --filter=@harness/api --prod deploy --legacy /out

FROM base AS runner
ENV NODE_ENV=production
RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs tutor
WORKDIR /app

# `pnpm deploy` ja achata o workspace: /out/node_modules tem as dependencias de
# producao E o @harness/core resolvido como codigo real, sem symlink para
# workspace. E por isso que este e um unico COPY.
COPY --from=build --chown=tutor:tutor /out ./
COPY --from=build --chown=tutor:tutor /app/apps/api/prisma ./prisma

USER tutor
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/server.js"]
```

Cada linha tem um motivo:

**`pnpm deploy` em vez de copiar `node_modules` na mao.** Este e o ponto que mais quebra image de monorepo. No `node_modules` do workspace, `@harness/core` dentro de `apps/api/node_modules` e um **symlink** para `../../packages/core`. O `COPY` do Docker resolve conteudo, nao symlink: ou o link fica apontando para `/app/packages/core` que voce nao copiou, ou vira um arquivo de texto. Nos dois casos o container sobe e morre com `Cannot find module '@harness/core'`. O `pnpm deploy` gera um diretorio com as dependencias de producao e o pacote do workspace **achatado**, em um unico `COPY` que funciona.

**O `--legacy` no `deploy`.** Se o `pnpm-workspace.yaml` tem `injectWorkspacePackages: true`, o `deploy` aborta pedindo esse flag. Descobrir isso no build de producao, depois de todo o resto funcionando, custa uma hora. E note o `--filter=@harness/api` com igual: o `deploy` e o subcomando e o alvo do filtro vai como `--filter=`, separado do nome. Escrevendo `--filter @harness/api --prod deploy /out`, o pnpm interpreta `/out` como alvo e tenta fazer deploy da raiz do workspace.

**`prisma` copiado separadamente.** O `deploy` leva o `package.json` e as dependencias, mas o schema do Prisma esta em `apps/api/prisma` e nao e dependencia. Sem ele, `prisma migrate deploy` no entrypoint nao acha o schema.

**`CMD ["node", "dist/server.js"]`.** O `deploy` achata a estrutura, entao `dist` esta na raiz do `/app` e o caminho `apps/api/dist/server.js` da versao anterior apontaria para um arquivo inexistente.

**`--filter @harness/api...`** com os tres pontos instala a API e todas as dependencias de workspace dela. Sem os pontos, o core nao e instalado e o build falha com "module not found".

**`COPY` dos `package.json` antes do codigo.** Se voce copiar o codigo primeiro, qualquer mudanca em `.ts` invalida a camada de `pnpm install` e a instalacao inteira roda de novo. Copiando so os manifestos primeiro, a camada de dependencias so muda quando as dependencias mudam. E o principio de cache da Licao 9.1 aplicado a Docker.

**`USER tutor`.** Rodar como root dentro do container significa que um exploited runner tem root no host. O Modulo 9.1 mostra o ataque; aqui esta a defesa em uma linha.

**`HEALTHCHECK` com `node -e` e nao `curl`.** A imagem `node:22-slim` nao tem `curl` nem `wget`. Adicionar o pacote aumenta a superficie de ataque por causa de um health check. Usando o proprio Node, a imagem fica menor e sem dependencia extra.

**`--start-period=20s`.** Da 20 segundos para a aplicacao comecar antes de contar falha. Sem isso, o primeiro health check acontece em 30s e o container e marcado como unhealthy durante o boot, o que reinicia a aplicacao num loop.

### Passo 5 - .dockerignore

```gitignore
# apps/api/.dockerignore
node_modules
dist
.next
.turbo
coverage
.env
.env.*
!.env.example
*.md
docs
__tests__
.git
.gitignore
Dockerfile
.dockerignore
```

`.dockerignore` e o equivalente do cache de build: sem ele, o contexto de build envia `.git`, `node_modules` e `.env` para o daemon. Alem de lento, cada mudanca em `.git` invalida **todas** as camadas.

O padrao e o mesmo do `.gitignore` mais o que nunca deve ir para a imagem. `!.env.example` e a excecao que mantem a documentacao de variaveis dentro do container sem expor segredo.

### Passo 6 - docker compose para desenvolvimento

```yaml
# docker-compose.yml
name: harness-tutor

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: tutor
      POSTGRES_PASSWORD: tutor
      POSTGRES_DB: tutor
    ports: ["5432:5432"]
    volumes: ["pgdata:/var/lib/postgresql/data"]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U tutor -d tutor"]
      interval: 5s
      timeout: 3s
      retries: 10

  redis:
    image: redis:7-alpine
    command: ["redis-server", "--save", "", "--appendonly", "no"]
    ports: ["6379:6379"]
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 10

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    env_file: [.env]
    environment:
      DATABASE_URL: postgresql://tutor:tutor@postgres:5432/tutor
      REDIS_URL: redis://redis:6379
    ports: ["4000:4000"]
    depends_on:
      postgres: { condition: service_healthy }
      redis: { condition: service_healthy }

volumes:
  pgdata:
```

`condition: service_healthy` e o ponto que evita a corrida de startup. Sem ele, o container da API sobe antes do Postgres aceitar conexoes, a migracao falha, e o primeiro `docker compose up` do aluno ja falha. Isso e orquestracao basica do Modulo 9.2: dependencia nao e ordem de declaracao, e estado de saude verificado.

O `redis-server --save "" --appendonly no` desliga persistencia. Redis aqui e cache; persistir dado descartavel em disco so desperdica I/O.

```bash
docker compose up -d postgres redis
docker compose run --rm api npx prisma migrate deploy
docker compose up -d api
curl http://localhost:4000/ready
```

`prisma migrate deploy` e o comando de producao. `migrate dev` cria migration e pode pedir seed — nunca rodo em producao.

### Passo 7 - O workflow de CI

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 10.11.0

      - uses: actions/setup-node@v4
        with:
          node-version: 22.11.0
          cache: pnpm

      - name: Install
        run: pnpm install --frozen-lockfile

      - name: Generate Prisma client
        run: pnpm --filter @harness/api exec prisma generate
        env:
          DATABASE_URL: postgresql://tutor:tutor@localhost:5432/tutor

      - name: Typecheck
        run: pnpm typecheck

      - name: Test
        run: pnpm test
        env:
          DATABASE_URL: postgresql://tutor:tutor@localhost:5432/tutor

      - name: Build
        run: pnpm build
        env:
          NEXT_TELEMETRY_DISABLED: "1"
```

O `--frozen-lockfile` e o que garante reprodutibilidade: se o `package.json` e o `pnpm-lock.yaml` divergirem, o CI falha em vez de instalar versoes diferentes da sua maquina. A Licao 9.4 mostra que "funciona no meu" e, na maioria das vezes, "funciona porque meu lockfile estava desatualizado".

O `concurrency` com `cancel-in-progress` evita gastar minutos de CI com pushes subsequentes no mesmo branch. Em um projeto pessoal isso e otimizacao; em trabalho com varias pessoas e desperdicio de recurso compartilhado.

O `prisma generate` roda **antes** do typecheck porque os tipos do Prisma sao gerados. Sem essa ordem, o typecheck falha com "module @prisma/client has no exported member PrismaClient" — e a causa nao esta no seu codigo.

### Passo 8 - Job de teste de integracao com Postgres real

```yaml
  integration:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: tutor
          POSTGRES_PASSWORD: tutor
          POSTGRES_DB: tutor_test
        ports: ["5432:5432"]
        options: >-
          --health-cmd pg_isready
          --health-interval 5s
          --health-timeout 3s
          --health-retries 10
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10.11.0
      - uses: actions/setup-node@v4
        with:
          node-version: 22.11.0
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @harness/api exec prisma migrate deploy
        env:
          DATABASE_URL: postgresql://tutor:tutor@localhost:5432/tutor_test
      - run: pnpm --filter @harness/api test:integration
        env:
          DATABASE_URL: postgresql://tutor:tutor@localhost:5432/tutor_test
```

Um teste de integracao que roda contra Postgres real pega o que mock nunca pega: migration quebrada, constraint violada, tipo do Postgres diferente do que o Prisma acha.

O servico do GitHub Actions mapeia a porta do container para uma porta aleatoria do runner. Por isso o endereco **nao** muda: no runner, o Postgres continua em `localhost:5432` — o mapeamento acontece do lado de dentro do container, invisivel para quem conecta de fora. A pegadinha classica e a oposta: se voce escrever a URL do servico com a porta mapeada, so funciona localmente e falha no CI.

### Passo 9 - Proteger a branch main

Adicione este job **dentro de `jobs:`**, com a mesma indentacao de `verify` e `integration` (dois espacos):

```yaml
# .github/workflows/ci.yml
jobs:
  # ... verify e integration como acima ...
  required:
    runs-on: ubuntu-latest
    needs: [verify, integration]
    if: always()
    steps:
      - name: Falhar se algum job anterior falhou
        if: needs.verify.result != 'success' || needs.integration.result != 'success'
        run: exit 1
```

`if: always()` e obrigatorio: sem ele, o job e pulado quando um job anterior falha, e o check passa sem ter rodado nada. E um job sem `steps` que executa nada passa. Configurar como **branch protection required status check** no repositorio e o que faz a regra valer de verdade — sem isso, o job e apenas informativo.

A checagem e `result != 'success'`, e nao `failure`: `cancelled` e `skipped` tambem sao reprovacao. Usar `== 'failure'` deixa passar um job pulado.

E o `needs: [verify, integration]` precisa de `always()` pelos dois lados. Sem `if: always()` no job, ele e pulado. E o `if` do `run` compara resultado, nao conclusao: `needs.verify.result` e `'success' | 'failure' | 'cancelled' | 'skipped'`, enquanto `needs.verify.conclusion` e `null` enquanto o job roda. Comparar com `conclusion` numa expressao que avalia antes de o job terminar produz `null != 'success'` — que e verdade, entao funciona por acidente. Use `result`.

### Passo 10 - Deploy da API como container

Rode a API em qualquer plataforma de containers (Fly.io, Railway, Render, ou um VPS com Docker). O que importa e a sequencia de deploy:

```bash
# 1. build local para validar
docker build -f apps/api/Dockerfile -t harness-tutor-api:local .
docker run --rm -p 4000:4000 --env-file .env harness-tutor-api:local
curl -fsS http://localhost:4000/health | jq
```

Antes de qualquer deploy, rode a migration **como passo anterior ao deploy da aplicacao**:

```bash
# `migrate deploy` e o unico comando seguro fora de desenvolvimento:
# ele so APLICA migrations ja versionadas, nunca cria nem pede seed.
npx prisma migrate deploy
```

Aplicar migration junto com o deploy da aplicacao e o caminho mais curto para downtime. Se a migration tem lock questionable, a versao nova comeca a rodar contra schema velho e quebra. A ordem correta e: (1) deploy da migration, backwards-compatible; (2) deploy do codigo novo; (3) so entao remova colunas.

A ordem dentro de um unico pipeline e a parte que costuma ser feita ao reves. Se o passo de migration divide job com o deploy, existe uma janela entre os dois: a migration ja rodou e a versao antiga do codigo ainda esta no ar, falando com um schema que ja mudou. Por isso o passo de migration e `separate`, so com `migrate deploy`, e o passo de deploy so comeca quando ele termina com sucesso.

### Passo 11 - Deploy do dashboard na Vercel

```bash
npm i -g vercel
cd apps/web
vercel link
vercel env add ANTHROPIC_API_KEY production     # chave da API
vercel env add TUTOR_API_URL production          # https://sua-api.up.railway.app
vercel --prod
```

**Erro mais comum:** cadastrar a variavel com o prefixo `NEXT_PUBLIC_`. `NEXT_PUBLIC_ANTHROPIC_API_KEY` vai para o bundle publico. As duas regras da 11.3 continuam valendo na Vercel.

Como a API e um container separado, o dashboard so precisa de `ANTHROPIC_API_URL` no servidor e de `NEXT_PUBLIC_API_URL` no cliente — se o dashboard falar direto com a API. Se mantiver o proxy em `app/api/chat/route.ts`, entao nem `NEXT_PUBLIC_API_URL` e necessario: o Route Handler ja sabe a URL.

Para a variavel publica, a Vercel exige prefixo, e o valor e embutido no build:

```bash
vercel env add NEXT_PUBLIC_API_URL production
vercel --prod --build
```

**Variaveis de ambiente mudam no build, nao no runtime.** Se voce cadastrou a variavel depois do primeiro deploy, precisa de `--build` para o valor entrar. Esse e o segundo erro mais comum, e a solucao sempre e a mesma: redeploy com rebuild.

### Passo 12 - CORS e o dominio da Vercel

```ts
// apps/api/src/server.ts (dentro do setup)
await app.register(cors, {
  origin: env.NODE_ENV === "production" ? process.env["ALLOWED_ORIGINS"]?.split(",") ?? [] : true,
  credentials: true,
});
```

Sem isso, o navegador bloqueia as chamadas por CORS e o console mostra erro de policy — que aparece como "a API funciona no curl mas nao no navegador". A ordem importa: configure CORS antes de fazer deploy do dashboard, senao o primeiro teste do aluno falha e voce perde 20 minutos procurando bug onde nao ha.

### Passo 13 - Verificacao de producao em quatro perguntas

```bash
curl -fsS https://api.seudominio.com/health | jq        # liveness: 200?
curl -i https://api.seudominio.com/ready | head -1     # readiness: 200 ou 503?
curl -fsS https://seu-dashboard.vercel.app -o /dev/null -w "%{http_code}\n"
curl -N https://api.seudominio.com/v1/messages -H "x-api-key: $KEY" -d '{}' | head -3
```

O `-N` desliga o buffer do curl, e por isso voce ve o streaming chegando em chunks. Sem ele, o curl acumula e voce conclui que o streaming esta quebrado quando o problema e o proprio curl.

Depois, no navegador: DevTools → Network → `/api/chat` → **Response** deve mostrar arriving em chunks, com `Content-Type: text/plain`. Se vier `application/json` de uma vez, o Route Handler esta devolvendo o buffer inteiro e o streaming nao chegou a producao.

### Passo 14 - Runbook de rollback

Escreva isto **antes** de precisar:

```markdown
# Runbook: rollback

## Sintoma
Erro 5xx acima de 2% por 5 minutos no /health ou /ready.

## Diagnostico (2 min)
1. kubectl logs deploy/api --tail=200  |  (ou: vercel logs dashboard)
2. Checar env: TUTOR_API_URL e a URL certa?
3. Checar migration: prisma migrate status

## Rollback
1. Redeploy da versao anterior (git revert + push, ou versao anterior no painel)
2. Se a migration foi o problema: pnpm prisma migrate resolve --rolled-back <nome>

## Communication
Avisar no canal: inicio, causa estimada, previsao.

## Prevencao
Deploy migration como job separado, sempre antes do codigo.
```

O criterio de um bom runbook: **quem nunca viu o incidente consegue executa-lo**. Se precisa de interpretacao, falta um passo. A Licao 9.5 traz o checklist de post-mortem; o runbook e a acao preventiva que evita a metade dos rollbacks.

Faca o commit e abra a PR. A este ponto, o sistema esta em producao, com pipeline, container, health checks e plano de rollback.

---

## Decisoes praticas

- **Multi-stage sempre.** Ferramental de build fora da imagem final: menos tamanho, menos superficie de ataque, menos CVE para atualizar.
- **Manifestos antes do codigo no Dockerfile.** Invalida a camada de `pnpm install` so quando as dependencias mudam.
- **Usuario nao-root.** Uma linha que elimina escalonamento de privilegio em caso de exploited runner.
- **Liveness nao checa dependencia.** Banco fora causa restart loop se o liveness falhar junto.
- **Readiness checa dependencia.** Sem 503, o balanceador continua mandando trafego para uma instancia inutil.
- **Migration antes do codigo, sempre.** E a unica ordem que nao quebra a versao nova em schema velho.
- **Variaveis de ambiente mudam no build.** Mudou depois do deploy? `--build`.

## Checklist de implementacao

1. Fastify com `host: "0.0.0.0"` e logger por ambiente.
2. Graceful shutdown com guarda de corrida e timeout de 10s.
3. Schema Prisma com `@@unique` de progresso e indices compostos.
4. Dockerfile multi-stage com cache de camadas, usuario nao-root e HEALTHCHECK via Node.
5. `.dockerignore` cobrindo `.git`, `node_modules`, `.env`, com `!.env.example`.
6. `docker-compose.yml` com `condition: service_healthy` e Redis sem persistencia.
7. GitHub Actions com `--frozen-lockfile`, `prisma generate` antes do typecheck, e `concurrency`.
8. Job de integracao com Postgres real e health check.
9. Branch protection com required status check e `if: always()`.
10. Migration aplicada como job separado, antes do codigo.
11. Vercel com variaveis sem prefixo publico para a chave.
12. CORS com lista de origens de producao.
13. Verificacao de producao com `curl -N` para conferir streaming.
14. Runbook de rollback executavel por quem nunca viu o incidente.

## Exercicios

### Questao 1
**Pergunta:** A API sobe em container e o health check retorna connection refused. Qual e a causa mais provavel?

**Resposta esperada:** O Fastify foi iniciado sem `host: "0.0.0.0"`, entao responde apenas em `localhost` **dentro** do container, e o health check do orquestrador tenta o IP do container. Tambem verifique se o container expoe a porta e se o `EXPOSE` corresponde a `PORT`.

### Questao 2
**Pergunta:** O Postgres caiu por 30 segundos e o orquestrador reiniciou a API 4 vezes. Qual a configuracao errada?

**Resposta esperada:** O liveness check esta verificando o banco. Liveness deve responder apenas se o processo esta vivo; dependencia externa pertence ao readiness. Com banco no liveness, cada queda de banco causa restart loop.

### Questao 3
**Pergunta:** Por que o Dockerfile copia os `package.json` antes do codigo fonte?

**Resposta esperada:** Para que a camada de `pnpm install` seja invalidade apenas quando as dependencias mudam. Copiar o codigo primeiro faria qualquer mudanca em um `.ts` reexecutar a instalacao inteira a cada build.

### Questao 4
**Pergunta:** O deploy novo passou, e 10 minutos depois o dashboard comeca a mostrar erro 500 na API. Qual a causa mais provavel?

**Resposta esperada:** A migration foi aplicada junto com o codigo, ou depois dele. O padrao correto e migration primeiro (backwards-compatible), depois codigo, e so entao remover colunas. O padrao seguro de downtime curto.

### Questao 5
**Pergunta:** Voce cadastrou `TUTOR_API_URL` na Vercel depois do primeiro deploy, e a URL continua vazia em runtime. Por que?

**Resposta esperada:** Variaveis de ambiente sao embutidas no build, nao lidas em runtime. E necessario um novo build: `vercel --prod --build`.

## Exercicio pratico com gabarito

### Enunciado
Adicione observabilidade de producao ao pipeline: Sentry no backend e no frontend com release vinculada ao commit, health check de tres niveis (liveness, readiness e deep check com Claude), e um badge de status no dashboard que consulta o endpoint publico de saude.

### Entregaveis
- `apps/api/src/observability.ts` com inicializacao do Sentry e `release` igual a `process.env.GITHUB_SHA`.
- `apps/api/src/health.ts` estendido com `/health/deep`, que verifica banco, cache e uma chamada minima ao Claude com timeout de 3s.
- `apps/web/src/components/status-badge.tsx` consultando o endpoint publico com `revalidate: 60`.
- `.github/workflows/ci.yml` com passagem de `GITHUB_SHA` para build e upload de sourcemaps.
- Documentacao em `docs/observability.md` com os tres endpoints e o que cada um prova.
- Teste do `/health/deep` mockando as tres dependencias, com `deep: false` na resposta quando alguma falha.

### Gabarito esperado
Um unico registro de Structured Logging (Pino via Fastify) com requestId propagado; Sentry inicializado no servidor com `tracesSampleRate` menor em producao; e o `/health/deep` que nunca demora mais que 3s, retornando `deep: true` somente quando as tres dependencias respondem. O badge no dashboard faz polling com revalidate curto e mostra tres estados: operacional, degradado e indisponivel.

### Criterios de avaliacao
1. `/health/deep` tem timeout total de 3s mesmo se o Claude travar.
2. Liveness nunca toca dependencia externa.
3. A release do Sentry corresponde exatamente ao commit que passou no CI.
4. Sourcemaps sobem no CI, nao no deploy.
5. O badge tem estado degradado distinto de indisponivel.
6. Nenhum segredo aparece nos logs; chaves sao redigidas.

## Fechamento

O Harness Tutor esta em producao: API em container com usuario nao-root, health checks que distinguem liveness de readiness, migrations aplicadas na ordem correta, pipeline que bloqueia merge quebrado, e um runbook que outra pessoa consegue executar.

Falta uma coisa: provar que o aluno construiu isso. A ultima licao implementa a submissao automatica, a geracao de certificado com assinatura verificavel, e a badge publica — fechando o ciclo que comecou com um worktree vazio na 11.1.
