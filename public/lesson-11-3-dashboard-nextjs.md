# LICAO 11.3: Building the Dashboard

Construa o dashboard em Next.js 16: App Router, Server Components, Route Handler com streaming SSE e um Client Component que consome o mesmo `sessionReducer` do dominio.

## Objetivos da licao

- Reusar `@harness/core` no servidor do Next sem duplicar regra de negocio.
- Montar a arvore de rotas do App Router com layout, loading, error e not-found.
- Implementar um Route Handler que faz streaming de resposta com `ReadableStream`.
- Consumir o stream no cliente com `useReducer` e o mesmo reducer do dominio.
- Separar dados de leitura (fetch no server) de interatividade (Client Component minimo).
- Aplicar `loading.tsx` e `Suspense` para perceived performance real.

## Contexto do modulo

A Licao 11.1 separou o dominio da apresentacao. A 11.2 fez a apresentacao no terminal. Agora ela vai para o navegador, e o teste real da sua fronteira aparece: **o mesmo `sessionReducer`, com os mesmos tres testes, roda dentro do React sem alteracao nenhuma**. Se voce precisou copiar a maquina de estado para o cliente, a fronteira estava errada.

O Next 16 traz duas mudancas que afetam diretamente este codigo, e ambas vem do proprio `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`:

**`params` e `searchParams` sao Promises.** O acesso sincrono foi removido. Toda pagina dinamica precisa de `await props.params`. Codigo de Next 14/15 com `params.id` direto falha no typecheck e em runtime.

**Server e Client Components por padrao.** Todo arquivo em `app/` e Server Component. OClient Component precisa de `"use client"` explicito, e essa fronteira e o que mantem a `ANTHROPIC_API_KEY` fora do bundle.

Orcamento: ~4h. E a licao mais longa do capstone porque junta duas frentes: leitura de dados e interatividade de chat.

## SECAO 1: ONDE A CHAVE SECRETA PODE E NAO PODE EXISTIR

O Next injeta no browser **apenas** variaveis com prefixo `NEXT_PUBLIC_`. `ANTHROPIC_API_KEY` nao tem esse prefixo, entao nunca chega ao cliente — desde que voce nao a copie para um arquivo do tipo `app/lib/config.ts` que um Client Component importe.

A falha classica:

```ts
// app/lib/tutor.ts  <- Client Component importa isto
export const TUTOR_CONFIG = {
  apiKey: process.env.ANTHROPIC_API_KEY,   // vira undefined no browser
};
```

O resultado e silencioso: `undefined` no cliente, erro 500 no servidor, e nenhuma mensagem util. A regra estrutural e simples: **o unico lugar que le `process.env.ANTHROPIC_API_KEY` e o Route Handler, em `app/api/`, no runtime Node**. Nenhum Client Component importa modulo que le ambiente.

Para o dashboard precisar falar com a API, use a variavel publica `NEXT_PUBLIC_API_URL`, que por definicao pode ir ao browser, e o proxy `app/api/chat/route.ts` como unico intermediario. A chave nunca atravessa a fronteira cliente-servidor.

## SECAO 2: POR QUE STREAMING E MAIS IMPORTANTE NA WEB

No terminal, 4 segundos de espera sao toleraveis. Na web, 4 segundos comecam a parecer pagina quebrada — e o usuario recarrega, o que dispara uma segunda chamada e dobra seu custo.

A combinacao que funciona: **Route Handler com `ReadableStream` + `useReducer` no cliente**. O handler envia `text/plain; charset=utf-8` com chunks `data: {...}\n\n`, identico ao formato que voce ja consumiu na 11.2. O cliente le com `getReader()` e despacha `first_token`, `text`, `done` e `error` para o `sessionReducer` que ja existe no dominio.

Isso da tres coisas de uma vez: primeira pintura rapida, estado tipado (o reducer garante as transicoes), e a mesma logica de estado testada na 11.1 rodando no servidor da API e no navegador.

---

## PASSO A PASSO

### Passo 1 - Criar o app Next dentro do monorepo

```bash
cd apps
pnpm dlx create-next-app@latest web --ts --tailwind --app --src-dir --no-eslint --turbopack --import-alias "@/*"
```

Cuidado com a opcao `--eslint`: o repositorio usa ESLint flat config na raiz (`eslint.config.mjs`), e o lint local do app conflita. Depois da geracao:

```bash
rm -f apps/web/eslint.config.mjs apps/web/.eslintrc.json
```

O `create-next-app` tambem cria um `package.json` com o nome `web` e um `dev` script proprios, e um `.git` se rodar num diretorio que nao esta dentro de um repositorio. Os dois precisam sair antes do build do monorepo: o `pnpm-workspace.yaml` da 11.1 e quem define o nome do pacote, e o `dev` local sobrescreve o `turbo dev` que roda os quatro pacotes.

```bash
# o nome do pacote vem do workspace, nao do create-next-app
node -e "const f='apps/web/package.json';const p=require('./'+f);p.name='@harness/web';delete p.scripts;require('fs').writeFileSync(f,JSON.stringify(p,null,2)+'\n')"
rm -rf apps/web/.git
```

Nao remova o `next.config.ts` ainda: o passo 2 precisa dele para o alias.

### Passo 2 - Apontar o alias do monorepo e ajustar o tsconfig

O `@harness/core` precisa ser resolvido pelo Turbopack. Em Next 16 isso e feito com `turbopack.resolveAlias` no `next.config.ts`:

```ts
// apps/web/next.config.ts
import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";

const core = fileURLToPath(new URL("../../packages/core/src", import.meta.url));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    resolveAlias: {
      "@harness/core": core,
    },
  },
};

export default nextConfig;
```

Apontar direto para `src` e intencional. `packages/core` ainda nao tem `dist` enquanto voce desenvolve, e apontar para `dist` obriga a rebuild a cada import. Em producao, a Licao 11.4 troca isso por `transpilePackages`.

Repare que o `resolveAlias` mapeia o caminho exato, sem curinga. O `turbopack.resolveAlias` tambem aceita padroes (`"~*": "*"`), mas um alias exato para `@harness/core` e o correto: ele nao captura `@harness/core/subpath`, que nao existe. E o `paths` do `tsconfig` precisa do mesmo mapeamento, com o `.ts` explicito — o TypeScript nao resolve um diretorio sem `index.ts` a menos que o campo aponte direto para o arquivo. Sao dois sistemas de resolucao diferentes (Turbopack em runtime, TypeScript em type-check) e eles precisam concordar, ou voce ve `Module not found` no type-check e funciona no dev, ou o inverso.

O `tsconfig.json` do app **nao** pode herdar `composite: true` nem `outDir` do `tsconfig.base.json` — o Next gerencia o proprio:

```jsonc
// apps/web/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES2022"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "allowJs": true,
    "skipLibCheck": true,
    "noEmit": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"], "@harness/core": ["../../packages/core/src/index.ts"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

`moduleResolution: "bundler"` e obrigatorio aqui: o Next 16 usa Turbopack, que resolve como bundler e nao como Node. E note que o `include` precisa de `.next/types/**/*.ts`, onde o `next typegen` grava os tipos globais de rota.

### Passo 3 - Instalar as dependencias do dashboard

```bash
cd apps/web
pnpm add @harness/core@workspace:* zod@^4.1.0
pnpm add -D @testing-library/react@^16 @testing-library/jest-dom@^7 vitest@^3 @vitejs/plugin-react@^5
```

O teste de componente roda com Vitest + Testing Library, nao com Jest: o `jsdom` do Vitest inicializa mais rapido e a configuracao e menor. Este e o desvio consciente do Modulo 6, que usou Jest — a escolha se justifica porque nao precisamos do `next/jest` para testar um Client Component puro.

### Passo 4 - Expor o dominio ao dashboard

`packages/core/src/index.ts` precisa ser a porta de entrada unica:

```ts
export * from "./session.js";
export * from "./evaluator.js";
export * from "./env.js";
export * from "./messages.js";
```

Crie `packages/core/src/messages.ts` com o contrato de streaming compartilhado — **o mesmo formato SSE do CLI**:

```ts
import { z } from "zod";

export const WireEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("first_token") }),
  z.object({ type: z.literal("text"), delta: z.string() }),
  z.object({
    type: z.literal("usage"),
    inputTokens: z.number().int().nonnegative(),
    outputTokens: z.number().int().nonnegative(),
  }),
  z.object({ type: z.literal("done"), stopReason: z.string().nullable() }),
  z.object({ type: z.literal("error"), message: z.string() }),
]);
export type WireEvent = z.infer<typeof WireEventSchema>;

export function encodeSse(event: WireEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}
```

Colocar o formato do wire no dominio e o que garante que CLI e web nunca divirjam. Se um dia o formato mudar, muda em um lugar so — e a migracao de um cliente obriga o outro, exatamente como deve ser.

Repare que o `encodeSse` emite **uma linha `data:` por frame**, enquanto o Route Handler do passo 7 faz o oposto e emite varias linhas por frame da Anthropic. Nao e contradicao: sao dois formatos diferentes, em direcoes diferentes. O `encodeSse` e o formato do Harness (o que o CLI da 11.2 consome e o que o cliente do passo 8 le); o parser do passo 7 traduz do formato da Anthropic para o do Harness. A confusao entre os dois e a origem do bug mais caro da licao, e e discussada no passo 7.

### Passo 5 - Layout raiz e provider

```tsx
// apps/web/src/app/layout.tsx
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Harness Tutor",
  description: "Tutor de engenharia de IA com feedback progressivo",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">{children}</body>
    </html>
  );
}
```

Note a assinatura: `children: ReactNode`, nao `JSX.Element`. No React 19 o tipo correto para props de filho e `ReactNode`. Usar `JSX.Element` ainda compila, mas e o padrao da versao anterior e atrapalha quem escreve codigo colado de exemplos antigos.

`metadata` exportado do layout em vez de `<head>` manual — o App Router nao usa `next/head`, e este e o ponto de corte mais comum para quem vem do Pages Router.

### Passo 6 - Pagina inicial como Server Component com Suspense

```tsx
// apps/web/src/app/page.tsx
import { Suspense } from "react";
import { getLessonList } from "@/lib/lessons";
import { LessonCard } from "@/components/lesson-card";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-semibold">Harness Tutor</h1>
      <Suspense fallback={<div className="mt-6 h-40 animate-pulse rounded-lg bg-slate-900" />}>
        <LessonList />
      </Suspense>
    </main>
  );
}

async function LessonList() {
  const lessons = await getLessonList();
  return (
    <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {lessons.map((lesson) => (
        <li key={lesson.id}>
          <LessonCard lesson={lesson} />
        </li>
      ))}
    </ul>
  );
}
```

O `LessonList` e `async`, entao e um Server Component que pode fazer `await` direto. Por estar dentro de `Suspense`, o shell da pagina e o `h1` enviam imediatamente e a lista preenche depois. **A pagina fica utilizavel antes dos dados chegarem** — isso e perceived performance, e a Licao 2.6 mede a diferenca.

Se `getLessonList` demorar 2 segundos e voce nao usar `Suspense`, o usuario ve tela branca por 2 segundos. Com `Suspense`, ve o cabecalho em 100ms.

### Passo 7 - O Route Handler de streaming

O coracao da licao. `app/api/chat/route.ts`:

```ts
import { z } from "zod";
import { encodeSse, loadServerEnv, type WireEvent } from "@harness/core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ChatRequestSchema = z.object({
  message: z.string().min(1).max(8000),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })).max(20).default([]),
});

export async function POST(request: Request): Promise<Response> {
  const env = loadServerEnv();

  const parsed = ChatRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Payload invalido" }, { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: WireEvent) => {
        controller.enqueue(encoder.encode(encodeSse(event)));
      };

      try {
        // A mensagem atual precisa entrar no array: o history so tem as trocas
        // anteriores. Sem esta linha o modelo responde ao nada.
        const messages = [
          ...parsed.data.history,
          { role: "user" as const, content: parsed.data.message },
        ];

        const upstream = await fetch(`${env.TUTOR_API_URL}/v1/messages`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-api-key": env.ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: env.TUTOR_MODEL,
            max_tokens: 2048,
            stream: true,
            system: "Voce e um tutor de engenharia de software. Responda em portugues.",
            messages,
          }),
          signal: request.signal,
        });

        if (!upstream.ok || !upstream.body) {
          send({ type: "error", message: `Upstream respondeu ${upstream.status}` });
          controller.close();
          return;
        }

        const reader = upstream.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let usage = { inputTokens: 0, outputTokens: 0 };
        let sentFirstToken = false;

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let sep = buffer.indexOf("\n\n");
          while (sep !== -1) {
            const raw = buffer.slice(0, sep).trim();
            buffer = buffer.slice(sep + 2);
            sep = buffer.indexOf("\n\n");

            // Um frame SSE do Anthropic tem varias linhas, e a primeira e `event:`.
            // Checar `raw.startsWith("data:")` descartaria o frame inteiro e o
            // dashboard ficaria mudo em producao. O certo e extrair a linha data:.
            const dataLine = raw
              .split("\n")
              .find((line) => line.startsWith("data:"));
            if (!dataLine) continue;

            const payload = dataLine.slice(5).trim();
            if (payload === "" || payload === "[DONE]") continue;

            let ev: {
              type: string;
              delta?: { text?: string };
              usage?: { input_tokens?: number; output_tokens?: number };
            };
            try {
              ev = JSON.parse(payload) as typeof ev;
            } catch {
              send({ type: "error", message: "Frame upstream invalido" });
              continue;
            }

            if (ev.type === "content_block_delta" && ev.delta?.text) {
              // first_token so quando o primeiro texto chega de fato. Emitir antes do
              // fetch mediria latencia de conexao, nao TTFT, e o dashboard mentiria.
              if (!sentFirstToken) {
                sentFirstToken = true;
                send({ type: "first_token" });
              }
              send({ type: "text", delta: ev.delta.text });
            }
            // input_tokens vem em message_start; output_tokens so em message_delta.
            // Tratar os dois no mesmo evento zera o input.
            if (ev.type === "message_start" && ev.usage?.input_tokens !== undefined) {
              usage.inputTokens = ev.usage.input_tokens;
            }
            if (ev.type === "message_delta" && ev.usage?.output_tokens !== undefined) {
              usage.outputTokens = ev.usage.output_tokens;
            }
          }
        }

        send({ type: "usage", ...usage });
        send({ type: "done", stopReason: "end_turn" });
      } catch (error) {
        send({ type: "error", message: error instanceof Error ? error.message : "falha" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      "x-accel-buffering": "no",
    },
  });
}
```

Quatro decisoes que valem a leitura:

**`export const runtime = "nodejs"`.** O padrao do Route Handler ja e Node, mas declarar explicitamente evita que uma otimizacao futura mova a rota para Edge — onde `process.env` e diferente e o `fetch` upstream muda de semantica.

**`request.signal` repassado ao fetch upstream.** Se o usuario fechar a aba, o cancelamento propaga. Sem isso, voce continua pagando tokens de uma resposta que ninguem vai ler — o vazamento de custo ensinado na Licao 10.5.

**`x-accel-buffering: no`.** Se houver proxy ou CDN no caminho, ele pode bufferizar a resposta e destruir o streaming. Esse header desliga o buffer em nginx e CDN. Ele parece um detalhe; sem ele, o dashboard funciona em `localhost` e nao funciona em producao, e ninguem entende o porque.

**Extrair a linha `data:`, e nao testar `startsWith`.** Este e o bug que so aparece em producao. O SSE da Anthropic manda cada frame com varias linhas, e a primeira e `event: content_block_delta`; o `data:` vem depois. O parser da 11.2 testava `raw.startsWith("data:")` porque ali o quadro *era* so uma linha `data:`. Copiar o codigo da 11.2 para ca mantem a checagem e faz o frame ser descartado inteiro — o dashboard fica mudo, sem erro no console, com HTTP 200. E o motivo de o mesmo parser nao poder ser copiado as cegas entre formatos diferentes.

**A distincao entre `message_start` e `message_delta`.** O `input_tokens` chega no `message_start` e o `output_tokens` so no `message_delta`. Ler os dois no mesmo evento e o caminho mais curto para um relatorio de custo com input zerado.

### Passo 8 - O Client Component do chat

O unico lugar do projeto com `"use client"`. Todos os hooks vivem aqui.

```tsx
// apps/web/src/components/tutor-chat.tsx
"use client";

import { useCallback, useReducer, useRef, useState } from "react";
import { sessionReducer, type SessionEvent, type SessionState, type WireEvent } from "@harness/core";

type Turn = { role: "user" | "assistant"; content: string };

type ChatState = {
  session: SessionState;
  text: string;
  usage: { input: number; output: number };
  // Historico vive no estado e NAO e apagado por `reset`. Sem esse campo, a
  // segunda mensagem chegaria com `history: []` e o tutor perderia a memoria a
  // cada turno — a Licao 10.4 inteira viraria decoracao.
  history: Turn[];
};

// Mesmo teto do lado do servidor (`z.array(...).max(20)`). Historico ilimitado
// no cliente parece funcionar e estoura a janela de contexto do modelo com um
// erro 400 que nao tem nada a ver com a causa.
const MAX_HISTORY = 20;

const initialState: ChatState = {
  session: { phase: "idle" },
  text: "",
  usage: { input: 0, output: 0 },
  history: [],
};

type Action =
  | { kind: "event"; event: WireEvent }
  | { kind: "submit"; message: string }
  | { kind: "reset" }
  | { kind: "newConversation" }
  | { kind: "fail"; reason: string };

function chatReducer(state: ChatState, action: Action): ChatState {
  switch (action.kind) {
    case "newConversation":
      return initialState;
    case "reset":
      // Zera a exibicao do turno, preserva o historico. Sao coisas diferentes:
      // `reset` limpa a tela antes de cada pergunta, `newConversation` e o botao
      // "Nova conversa" que limpa tudo.
      return { ...state, text: "", usage: { input: 0, output: 0 } };
    case "submit":
      return {
        ...state,
        session: sessionReducer(state.session, { type: "submit" }),
        history: [...state.history, { role: "user", content: action.message }].slice(-MAX_HISTORY),
      };
    case "fail":
      return { ...state, session: { phase: "failed", reason: action.reason } };
    case "event": {
      const translated = toSessionEvent(action.event);
      const session = translated === null ? state.session : sessionReducer(state.session, translated);

      if (action.event.type === "text") {
        return { ...state, session, text: state.text + action.event.delta };
      }
      if (action.event.type === "usage") {
        return {
          ...state,
          session,
          usage: { input: action.event.inputTokens, output: action.event.outputTokens },
        };
      }
      if (action.event.type === "done") {
        // O turno so entra no historico quando o `done` chega. Fechar em `text`
        // truncaria a resposta no meio; fechar no fim do request falharia
        // quando o usuario aborta com Ctrl+C.
        //
        // `text` NAO e limpo aqui: e o que a tela mostra. O proximo `reset` o
        // zera. Limpar no `done` faria a resposta desaparecer no instante em que
        // ela termina de chegar.
        const closed = state.text.trim()
          ? [...state.history, { role: "assistant" as const, content: state.text }]
          : state.history;
        return { ...state, session, history: closed.slice(-MAX_HISTORY) };
      }
      return { ...state, session };
    }
  }
}

function toSessionEvent(event: WireEvent): SessionEvent | null {
  switch (event.type) {
    case "first_token":
      return { type: "first_token" };
    case "text":
    case "usage":
      // Nem todo evento de wire muda a maquina de estado. Traduzir `text` para `done`
      // encerrava a sessao no primeiro pedaco de texto: o reducer voltava para
      // awaiting_input, aceitando uma segunda mensagem por cima de um stream vivo.
      return null;
    case "done":
      return { type: "done" };
    case "error":
      return { type: "error", reason: event.message };
  }
}
```

Repare no detalhe arquitetural: `toSessionEvent` traduz o evento de **wire** para o evento de **estado**, e pode devolver `null` quando o evento nao tem efeito na maquina. Os dois vocabularios sao diferentes e a traducao nao e identidade.

O caso `null` e o que separa os dois designs. Traduzir `text` para `done` parece funcionar na primeira demonstracao — a tela preenche, o spinner para — e quebra silenciosamente assim que a segunda mensagem e enviada durante o stream: a sessao ja estava em `awaiting_input`, o input ja foi reabilitado, e as duas respostas se misturam na tela. A traducao precisa poder dizer "este evento nao move o estado".

O Client Component consome o stream:

```tsx
export function TutorChat() {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const [input, setInput] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(async () => {
    const message = input.trim();
    if (!message) return;

    // `reset` devolve initialState, cujo phase e `idle`. Precisa de `submit` para
    // entrar em `thinking` e habilitar o spinner. Despachar um `text` vazio para
    // "mudar de fase" e o tipo de atalho que funciona ate alguem clicar duas vezes.
    dispatch({ kind: "reset" });
    dispatch({ kind: "submit", message });

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        // O historico vai no corpo, e nao num state do servidor. O cliente e o
        // dono da conversa: assim da pra recarregar a pagina, abrir duas abas ou
        // trocar de aluno sem misturar contexto.
        body: JSON.stringify({ message, history: state.history }),
        signal: controller.signal,
      });

      if (!response.body) throw new Error("Resposta sem corpo");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let sep = buffer.indexOf("\n\n");
        while (sep !== -1) {
          const raw = buffer.slice(0, sep).trim();
          buffer = buffer.slice(sep + 2);
          sep = buffer.indexOf("\n\n");
          if (!raw.startsWith("data:")) continue;
          try {
            const parsed = WireEventSchema.safeParse(JSON.parse(raw.slice(5).trim()));
            if (parsed.success) dispatch({ kind: "event", event: parsed.data });
          } catch {
            // Frame de upstream malformado e do servidor, nao do cliente: seguir
            // consumindo e o certo. Um throw aqui mataria o stream no primeiro glitch.
          }
        }
      }
    } catch (error) {
      dispatch({
        kind: "fail",
        reason: error instanceof Error ? error.message : "falha de rede",
      });
    } finally {
      abortRef.current = null;
    }
    // `state.history` entra na lista: sem ela o `useCallback` captura o array
    // vazio da primeira renderizacao e a segunda pergunta continua mandando
    // `history: []`. E a falha exata do item anterior, so que agora silenciosa.
  }, [input, state.history]);

  const busy = state.session.phase === "thinking" || state.session.phase === "streaming";

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
      <div aria-live="polite" className="min-h-32 whitespace-pre-wrap text-sm">
        {state.text || <span className="text-slate-500">Pergunte algo sobre o curso.</span>}
      </div>

      <div className="mt-2 text-xs text-slate-500">
        {state.session.phase === "thinking" && "pensando..."}
        {state.session.phase === "streaming" && "escrevendo..."}
        {state.session.phase === "failed" && `erro: ${state.session.reason}`}
        {state.usage.output > 0 && ` · ${state.usage.output} tokens · ${state.usage.input} in`}
      </div>

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <input
          className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-cyan-500"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="explique Project References"
          disabled={busy}
          aria-label="Mensagem para o tutor"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-cyan-600 px-4 py-2 text-sm font-medium hover:bg-cyan-500 disabled:opacity-50"
        >
          Enviar
        </button>
        <button
          type="button"
          onClick={() => dispatch({ kind: "newConversation" })}
          disabled={busy || state.history.length === 0}
          className="rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-400 hover:border-slate-500 disabled:opacity-40"
        >
          Nova conversa
        </button>
      </form>
    </section>
  );
}
```

`aria-live="polite"` e o que faz o leitor de tela anunciar a resposta conforme ela chega. Sem isso, o usuario cego nao percebe que a resposta chegou. A Licao 2.1 trata acessibilidade como requisito, nao como extra — e aqui o `aria-live` cumpre esse papel.

Vale detener no historico, porque e a parte que parece pequena e tem tres decisoes dentro. **Quem guarda:** o cliente, num `Turn[]` no reducer, e o servidor so valida e repassa. Guardar no servidor exigiria estado de sessao, e estado de sessao e o que faz um dashboard inteiro quebrar quando o pod reinicia. **Quando fecha o turno:** no `done`, nao no `text` e nao no fim do `fetch`. No `text` a resposta entraria truncada no primeiro delta; no fim do request, um Ctrl+C perderia a fala inteira. **Qual o limite:** 20, o mesmo `.max(20)` do `ChatRequestSchema`. Divergencia entre os dois tetos aparece como 400 do Zod com mensagem que nao aponta pro historico.

E o efeito colateral que vale registrar: `text` e o buffer do turno, nao o log da conversa. Ele e limpo no `reset` do proximo envio e nunca acumula. Para mostrar varias trocas na tela seria preciso um array de `Turn` renderizado em lista — e ai o historico do request e o historico da exibicao convergirem em um unico array, com o cuidado de que esse `text` temporario continue existindo. Sao duas responsabilidades que uma variavel tenta fazer ao mesmo tempo, e e o tipo de bug que so aparece depois da terceira pergunta.

### Passo 9 - Pagina do chat com params assincronos

```tsx
// apps/web/src/app/lessons/[lessonId]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TutorChat } from "@/components/tutor-chat";
import { getLesson } from "@/lib/lessons";

type PageProps = {
  params: Promise<{ lessonId: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lessonId } = await params;
  const lesson = await getLesson(lessonId);
  if (!lesson) return { title: "Licao nao encontrada" };
  return { title: lesson.title, description: lesson.description };
}

export default async function LessonPage({ params }: PageProps) {
  const { lessonId } = await params;
  const lesson = await getLesson(lessonId);

  if (!lesson) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold">{lesson.title}</h1>
      <p className="mt-2 text-sm text-slate-400">{lesson.description}</p>
      <div className="mt-8">
        <TutorChat />
      </div>
    </main>
  );
}
```

O tipo `PageProps` com `params: Promise<...>` e a assinatura do Next 16. Escrever `params: { lessonId: string }`-sync passa no editor de quem tem versao antiga e quebra no build. Este arquivo e o teste mais rapido de que voce leu a documentacao do modulo.

`generateMetadata` e um segundo fetch dos mesmos dados. Para uma unica licao isso e aceitavel; para multiplos, o `cache()` do Next 16 evita a chamada duplicada — o mesmo mecanismo de cache do Modulo 5.1, com API diferente.

### Passo 10 - loading.tsx, error.tsx e not-found.tsx

```tsx
// apps/web/src/app/lessons/[lessonId]/loading.tsx
export default function Loading() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="h-8 w-2/3 animate-pulse rounded bg-slate-800" />
      <div className="mt-4 h-4 w-full animate-pulse rounded bg-slate-800" />
      <div className="mt-8 h-48 animate-pulse rounded-lg bg-slate-900" />
    </main>
  );
}
```

```tsx
// apps/web/src/app/lessons/[lessonId]/error.tsx
"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h2 className="text-lg font-medium text-red-400">Nao foi possivel carregar a licao</h2>
      <p className="mt-2 text-sm text-slate-400">{error.message}</p>
      <button
        onClick={reset}
        className="mt-4 rounded-md bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700"
      >
        Tentar novamente
      </button>
    </main>
  );
}
```

`error.tsx` **precisa** de `"use client"` porque recebe `reset`, que e uma funcao passada do servidor. E o unico padrao de excecao do App Router: um arquivo que captura erro de renderizacao do subtree, com botao de retry sem recarregar a pagina inteira. Isso e melhor que um `try/catch` no layout, que esconderia o resto da aplicacao.

O terceiro arquivo fecha o triangulo de estados, e ele e o mais curto:

```tsx
// apps/web/src/app/lessons/[lessonId]/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h2 className="text-lg font-medium">Licao nao encontrada</h2>
      <p className="mt-2 text-sm text-slate-400">
        O endereco existe, mas nao ha licao com esse identificador.
      </p>
      <Link href="/lessons" className="mt-4 inline-block text-sm text-sky-400 hover:underline">
        Voltar para as licoes
      </Link>
    </main>
  );
}
```

Nao precisa de `"use client"` porque nao tem estado nem handler — e so markup. E ele e o que o `notFound()` do passo 9 aciona. A distincao que importa: `not-found.tsx` e para "esse recurso nao existe" (404), `error.tsx` e para "algo quebrou" (500). Misturar os dois transforma um link errado em mensagem de erro de servidor, que assusta o usuario e polui os logs.

### Passo 11 - Camada de dados com cache explicito

```ts
// apps/web/src/lib/lessons.ts
import { cache } from "react";
import { z } from "zod";

const LessonSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  order: z.number().int(),
});

export type Lesson = z.infer<typeof LessonSchema>;

const baseUrl = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:4000";

export const getLessonList = cache(async (): Promise<Lesson[]> => {
  const response = await fetch(`${baseUrl}/lessons`, { next: { revalidate: 300 } });
  if (!response.ok) throw new Error(`API respondeu ${response.status}`);
  return z.array(LessonSchema).parse(await response.json());
});

export const getLesson = cache(async (lessonId: string): Promise<Lesson | null> => {
  const response = await fetch(`${baseUrl}/lessons/${lessonId}`, { next: { revalidate: 300 } });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`API respondeu ${response.status}`);
  return LessonSchema.parse(await response.json());
});
```

`cache()` do React memoiza **por requisicao**: `generateMetadata` e a pagina que chamam `getLesson` compartilham a mesma promessa, e a API e chamada uma vez. E o padrao "request deduplication" do Modulo 8.2 aplicado ao fetch, e resolve o desperdicio sem cache distribuido.

O `revalidate: 300` e a politica: conteudo de licao muda raramente. Para dados que mudam por push (progresso do aluno), use `revalidate: 0` ou leitura dinamica — misturar as duas politicas no mesmo componente e a causa classica de dado velho na tela.

Validar a resposta com Zod antes de entregar a tela e o que impede que um campo renomeado na API vire `undefined` silencioso no componente. Erro de contrato aparece no servidor, com stack, em vez de na tela.

### Passo 12 - Testes do Client Component

```tsx
// apps/web/src/components/tutor-chat.test.tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TutorChat } from "./tutor-chat";

function sseStream(events: unknown[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const e of events) controller.enqueue(encoder.encode(`data: ${JSON.stringify(e)}\n\n`));
      controller.close();
    },
  });
}

describe("TutorChat", () => {
  it("renderiza o texto recebido por streaming", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        body: sseStream([
          { type: "first_token" },
          { type: "text", delta: "Project " },
          { type: "text", delta: "References" },
          { type: "done", stopReason: "end_turn" },
        ]),
      }),
    );

    const user = userEvent.setup();
    render(<TutorChat />);
    const field = screen.getByLabelText("Mensagem para o tutor");
    await user.type(field, "Project References");
    await user.keyboard("{Enter}");

    // O texto chega em dois chunks; o assertion so passa se os dois foram
    // concatenados. Um unico "Project" mostraria que o buffer do reducer foi
    // sobrescrito em vez de acumulado.
    await waitFor(() => {
      expect(screen.getByText(/Project References/)).toBeDefined();
    });
  });

  it("mostra erro quando a requisicao falha", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    const user = userEvent.setup();
    render(<TutorChat />);
    const field = screen.getByLabelText("Mensagem para o tutor");
    await user.type(field, "oi");
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(screen.getByText(/offline/)).toBeDefined();
    });
  });
});
```

O primeiro teste constroi um `ReadableStream` de verdade com o mesmo formato SSE do Route Handler. Isso testa o parser, o reducer e o render juntos — um teste de integracao da fronteira cliente-servidor, sem subir servidor nenhum. E o tipo de teste que pega bug de buffer.

Tres detalhes do setup que evitam falso positivo:

**`userEvent.setup()` antes do `render`.** Chamar `userEvent.type` direto funciona, mas o `setup` e o que instala o estado compartilhado entre chamadas. Sem ele, `user.type` e `user.keyboard` sao instancias diferentes e o `{Enter}` as vezes nao chega ao campo que o `type` preenchceu.

**Enter pelo `user.keyboard`, nao dentro do `type`.** `userEvent.type(field, "oi{enter}")` interpreta `{enter}` como texto literal em algumas versoes e como tecla em outras. Deixar a tecla em uma chamada propria deixa a intencao explicita e o teste estavel entre versoes.

**O mock precisa de `body` e nada mais.** O componente so chama `response.body.getReader()`. Por isso o `ok` e o `status` podem faltar no mock — e um bom sinal de que o componente consulta o minimo possivel da resposta.

Rode com:

```bash
cd apps/web && pnpm vitest run
```

### Passo 13 - Rodar e verificar o comportamento de streaming

```bash
pnpm --filter @harness/web dev
```

Com a API no ar tambem (`pnpm --filter @harness/api dev`), abra `http://localhost:3000`.

Verificacoes em ordem, porque cada uma isola uma camada:

1. **Streaming funciona no dev?** A resposta aparece letra a letra. Se vier tudo de uma vez, o `x-accel-buffering` ou o `ReadableStream` esta errado.
2. **A chave some do bundle?** DevTools → Sources → procure `ANTHROPIC_API_KEY`. Nenhum resultado em chunk do navegador.
3. **`loading.tsx` aparece?** DevTools → Network → throttle em "Slow 3G". O cabecalho deve renderizar antes dos dados.
4. **O chat sobrevive a erro?** Pare a API e envie mensagem. Deve aparecer `erro: ...` sem tela branca.

O ponto 2 e o teste de seguranca. Se a chave aparecer no bundle, a fronteira entre servidor e cliente foi violada e qualquer visitante pode extrai-la.

### Passo 14 - Build de producao e verificacao de tamanho

```bash
pnpm --filter @harness/web build
pnpm --filter @harness/web start
```

Checklist do build:

- Nenhum erro de tipo em `params` (confirma que voce usou `Promise`).
- `NEXT_PUBLIC_API_URL` aparece no bundle; `ANTHROPIC_API_KEY` nao.
- O tamanho do first-load JS esta abaixo de 200kB. Se estiver muito acima, um componente grande virou Client Component sem necessidade.
- As rotas dinamicas apareceram em `.next/server/app/**` e nao foram prerenderizadas (porque usam `params` e `cache`).

Rode `next typegen` antes de commitar se o typecheck reclamar de `PageProps` ou `RouteContext` — ele regenera os tipos globais de rota.

---

## Decisoes praticas

- **Um unico Client Component por tela.** Quanto menos `"use client"`, menor o bundle e menos vazamento de servidor. O resto e Server Component.
- **`params` como Promise.** Assinatura obrigatoria do Next 16; acesso sincrono foi removido.
- **Streaming precisa de `x-accel-buffering: no`.** Sem ele funciona em localhost e quebra atras de proxy ou CDN.
- **`cache()` para deduplicar por requisicao.** Resolve o duplo fetch de `generateMetadata` sem cache distribuido.
- **Validar resposta da API com Zod no servidor.** Erro de contrato aparece com stack, nao como `undefined` na tela.
- **Formato do wire vive no dominio.** CLI e web nao podem divergir; mudanca de um obriga o outro.

## Checklist de implementacao

1. `create-next-app` dentro de `apps/web`, sem ESLint local conflitante.
2. `turbopack.resolveAlias` apontando para `packages/core/src`.
3. `tsconfig.json` sem `composite`/`outDir`, com `moduleResolution: "bundler"` e `.next/types` no include.
4. `packages/core/src/messages.ts` com `WireEventSchema` e `encodeSse`.
5. `layout.tsx` com `metadata` exportado e `children: ReactNode`.
6. `page.tsx` com Server Component assincrono dentro de `Suspense`.
7. Route Handler com `runtime = "nodejs"`, `dynamic = "force-dynamic"` e `ReadableStream`.
8. `request.signal` repassado ao fetch upstream.
9. `x-accel-buffering: no` no header de resposta.
10. Client Component com `useReducer` consumindo o `sessionReducer` do dominio.
11. Traducao `WireEvent` -> `SessionEvent` explicita.
12. `params: Promise<{...}>` em toda pagina dinamica.
13. `loading.tsx`, `error.tsx` com `reset` e `not-found.tsx`.
14. `cache()` + `revalidate` na camada de dados, com Zod na resposta.
15. Teste de componente com `ReadableStream` real e `aria-live` no chat.

## Exercicios

### Questao 1
**Pergunta:** O dashboard funciona em `localhost` com streaming, mas em producao a resposta chega inteira de uma vez. Qual a causa mais provavel?

**Resposta esperada:** O proxy ou CDN no caminho esta bufferizando a resposta. Falta o header `x-accel-buffering: no`, que desliga o buffer em nginx e CDN. E o sintoma classico de "funciona local, nao funciona em producao".

### Questao 2
**Pergunta:** Por que `error.tsx` precisa de `"use client"`?

**Resposta esperada:** Porque ele recebe a prop `reset`, que e uma funcao passada do servidor. Client Components podem receber funcao do servidor; Server Components nao podem. Logo o arquivo de error boundary e necessariamente client.

### Questao 3
**Pergunta:** `generateMetadata` e a pagina chamam `getLesson` e a API responde duas vezes. Como evitar sem cache distribuido?

**Resposta esperada:** Envolver `getLesson` em `cache()` do React. O memoizacao e por requisicao: dentro do mesmo render, as duas chamadas compartilham a mesma promessa e a API e chamada uma vez.

### Questao 4
**Pergunta:** Por que `toSessionEvent` existe em vez de despachar `WireEvent` direto para o `sessionReducer`?

**Resposta esperada:** Porque os dois vocabularios sao diferentes. `text` no wire significa "chegou pedaco de texto", mas no estado significa "chegou o primeiro token". Despachar direto faria a maquina de estado receber transicoes invalidas e ficar presa em `thinking` para sempre.

### Questao 5
**Pergunta:** O que acontece se um modulo importado por um Client Component le `process.env.ANTHROPIC_API_KEY`?

**Resposta esperada:** A variavel nao tem prefixo `NEXT_PUBLIC_`, entao chega `undefined` no bundle. O cliente envia requisicao sem credencial, a API responde 500, e o usuario ve um erro generico sem nenhuma pista da causa.

## Exercicio pratico com gabarito

### Enunciado
Adicione ao dashboard uma rota `/lessons/[lessonId]/quiz` onde o aluno responde a uma pergunta de multipla escolha, o resultado e avaliado no cliente com um schema do dominio, e o progresso e enviado para a API com `fetch` e estado otimista com rollback.

### Entregaveis
- `packages/core/src/quiz.ts` com `QuizQuestionSchema`, `QuizAttemptSchema` e `gradeQuiz()` puro.
- `apps/web/src/app/lessons/[lessonId]/quiz/page.tsx` como Server Component, com `Suspense` e `params` assincrono.
- `apps/web/src/components/quiz-form.tsx` como Client Component, com estado otimista e rollback em falha de `POST`.
- `apps/web/src/lib/progress.ts` com `submitAttempt` e tratamento de `409` (conflito de versao).
- Testes: `gradeQuiz` cobrindo acerto, erro, e pergunta invalida; e um teste do componente cobrindo rollback.

### Gabarito esperado
`gradeQuiz()` no dominio recebe a tentativa e devolve `{ correct, correctOptionId, explanation }` — puro, testavel, sem React. O componente mantem `pending` otimista, marca a opcao e reverte com `setState` quando o `POST` retorna erro, exibindo a mensagem de erro. O `409` e tratado como "outro dispositivo respondeu" e dispara refetch.

### Criterios de avaliacao
1. `gradeQuiz` esta em `packages/core` e o teste nao precisa de React nem de fetch.
2. Nenhum modulo lido por Client Component acessa `process.env` sem `NEXT_PUBLIC_`.
3. A pagina usa `params: Promise<...>` e compila no Next 16.
4. O rollback do estado otimista esta coberto por teste.
5. O `409` tem tratamento explicito e recuperavel.

## Fechamento

O mesmo dominio agora tem tres interfaces: terminal, API e navegador. O `sessionReducer` da 11.1 roda no `useReducer` do React sem alteracao, e o formato SSE do CLI e o mesmo que o Route Handler emite.

Tambem estao prontos os dois artefatos que a 11.4 precisa: o dashboard com build de producao funcionando e o Route Handler com streaming. A proxima licao conecta tudo em infra real — Docker multi-stage, GitHub Actions com typecheck e testes, e deploy na Vercel com as variaveis de ambiente corretas.
