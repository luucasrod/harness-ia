# LICAO 11.2: Building the CLI Tool

Implemente o `harness-tutor`: quatro subcomandos (`init`, `chat`, `test`, `submit`), streaming de resposta, modo offline deterministico e saida JSON para o sistema de certificados.

## Objetivos da licao

- Estruturar um CLI com Commander, subcomandos, opcoes globais e codigos de saida corretos.
- Implementar `init` com escrita segura, fusao de `.gitignore` e `--dry-run`.
- Implementar `chat` com streaming, `Ctrl+C` handled e medicao de tokens.
- Implementar o motor de avaliacao `test` com saida humana e `--json` para automacao.
- Bloquear rede no modo `--offline`, garantindo CI deterministico e reproduzivel.
- Encerrar processos com codigos de saida distintos e documentados.

## Contexto do modulo

O terminal e a interface mais honesta de software que existe. Sem latencia de render, sem carregamento de imagem, sem cache de servico: se o comando esta lento, esta lento de verdade. Por isso o CLI e a primeira-interface do Harness Tutor, e porque ele ensina limites que a web esconde.

Voce vai consumir `@harness/core` da Licao 11.1 **sem alterar o dominio**. Os schemas, o evaluator e a maquina de estado ja existem e estao testados. O que voce escreve hoje e apresentacao: parsear argumentos, falar com o usuario, e traduzir erros internos em mensagens acionaveis.

Orcamento: ~3h. Se precisar de mais, registre o tempo real no repositorio — medir o proprio tempo contra a estimativa e parte do aprendizado do capstone.

## SECAO 1: TRES COMANDOS, TRES CONTRATOS DIFERENTES

Um CLI profissional nao e um script com `argv`. E um conjunto de contratos: o que o usuario digita, o que o programa promete fazer, e o que ele devolve ao sistema operacional.

`init` e um **comando de escrita em disco**: a unica categoria em que o programa pode destruir trabalho do usuario. Por isso nunca sobrescreve sem confirmacao e sempre oferece `--dry-run`. Devolve `0` em sucesso, `1` em falha recuperavel.

`chat` e um **comando interativo de leitura e escrita remota**: escreve apenas um cache local de sessao, aceita streaming, trata `Ctrl+C` sem deixar estado corrompido, e devolve `0` em sucesso.

`test` e um **comando de leitura com saida dupla**: humano por padrao, maquina sob demanda. O `--json` precisa emitir um unico objeto em stdout e nada mais. A Licao 11.5 depende exatamente desse contrato.

A distincao importa porque cada um tem um contrato de falha diferente. Tratar "o chat falhou" como "o init falhou" e o caminho para `catch (e) { console.log(e) }` e um ticket "`harness-tutor init` quebrou minha maquina".

## SECAO 2: STREAMING E O QUE ELE MUDA

Sem streaming, o aluno pergunta e espera 4 segundos olhando para uma tela vazia. Isso e a experiencia que faz produto de IA parecer quebrado. Com streaming, o primeiro token chega em cerca de 600ms.

O ganho nao e so perceptivo. No Modulo 10.1 voce aprendeu que o primeiro token e o melhor sinal de saude: se a conexao esta lenta, se o modelo esta sobrecarregado ou se o prompt e grande demais, isso aparece antes de qualquer token completar. Streaming e, de quebra, instrumentacao gratuita.

Dois detalhes quase sempre esquecidos:

**`Ctrl+C` precisa de tratamento explicito.** O Node mantem o stream aberto esperando mais dados; sem `process.exit()` o usuario ve um prompt de `^C` que nao faz nada.

**A taxa de tokens so existe depois do fim.** Durante o stream voce sabe apenas bytes recebidos. Tokens por segundo e fato medido, nao estimativa — exiba ao fechar.

---

## PASSO A PASSO

### Passo 1 - Dependencias do pacote CLI

```bash
cd packages/cli
pnpm add @harness/core@workspace:* commander@^13.1.0 picocolors@^1.1.1 @clack/prompts@^0.11.0
```

`@clack/prompts` traz prompts com setas, cores e estado deomatico. Escrever do zero economiza 200 linhas e entrega mais qualidade visual.

### Passo 2 - A casca do programa com Commander

`packages/cli/src/index.ts`:

```ts
#!/usr/bin/env node
import { Command } from "commander";
import { EXIT } from "./exit-codes.js";
import { runInit } from "./commands/init.js";
import { runChat } from "./commands/chat.js";
import { runTest } from "./commands/test.js";
import { runSubmit } from "./commands/submit.js";

export function buildProgram(): Command {
  const program = new Command();

  program
    .name("harness-tutor")
    .description("Tutor de engenharia de IA para o Harness IA")
    .version("0.1.0")
    .option("--no-color", "desativa cor no output")
    .option("--json", "emite saida JSON em stdout", false)
    .showHelpAfterError();

  program
    .command("init")
    .description("prepara um projeto novo com .env, .gitignore e config")
    .option("-y, --yes", "nao pergunta nada, usa defaults")
    .option("-d, --dir <path>", "diretorio alvo", ".")
    .option("--dry-run", "mostra o que faria sem escrever")
    .action(runInit);

  program
    .command("chat")
    .description("conversa com o tutor")
    .option("-m, --message <text>", "faz uma unica pergunta e sai")
    .option("--offline", "nao chama a rede; usa respostas deterministicas")
    .action(runChat);

  program
    .command("test")
    .description("avalia o projeto e emite relatorio")
    .option("--bail", "para na primeira falha")
    .option("--json", "saida em JSON puro no stdout")
    .option("--offline", "pula checks de rede (marcados como skipped)")
    .action(runTest);

  program
    .command("submit")
    .description("envia a submissao do capstone")
    .option("--repo <url>", "URL do repositorio")
    .option("--token <token>", "token de submissao")
    .option("--endpoint <url>", "URL da API de certificados")
    .option("--dashboard <url>", "URL do dashboard publicado")
    .option("--skip-network", "nao roda os probes externos (diagnostico offline)")
    .action(runSubmit);

  return program;
}
```

O entrypoint nao fica neste arquivo. `packages/cli/src/bin/harness-tutor.ts`:

```ts
#!/usr/bin/env node
import { main } from "../main.js";

await main(process.argv);
```

Essa separacao nao e uma questao de estilo. Se o `await main()` estivesse no fim de `index.ts`, o modulo executaria o parse no momento em que o teste importa `buildProgram` — e o teste inteiro quebraria com o output do Commander no meio da assercao. O binario e o unico lugar que "executa"; `index.ts` so "declara" o programa, e `main.ts` so "orquestra" a execucao. Tres responsabilidades, tres arquivos, e o teste importa `index.ts` — o unico dos tres que nao executa nada ao ser carregado.

```ts
// packages/cli/src/main.ts
import { buildProgram } from "./index.js";
import { toCliError } from "./errors.js";

export async function main(argv: string[]): Promise<void> {
  try {
    // Apenas parseAsync. Chamar parse() e parseAsync() em sequencia executa os
    // handlers duas vezes e o Commander avisa: `init` cria dois .env.
    await buildProgram().parseAsync(argv);
  } catch (error) {
    const cliError = toCliError(error);
    process.stderr.write(`${cliError.message}\n`);
    if (cliError.hint) process.stderr.write(`hint: ${cliError.hint}\n`);
    process.exitCode = cliError.exitCode;
  }
}
```

Repare no que `main.ts` **nao** importa: `EXIT`. O `exitCode` vem do proprio `CliError`, que ja sabe o que codigo carregar, e o Commander gerencia sozinho o caso de opcao invalida — ele chama `process.exit(2)`, que e o `EXIT.usage` por convencao. Um import nao usado aqui passaria em `tsc` sem `noUnusedLocals` e falharia no `eslint` do curso. O ponto e outro: quem sabe o codigo de saida e quem razona sobre o erro, nao o wrapper.

As opcoes do `submit` sao as mesmas que o `runSubmit` da 11.5 consome: `--endpoint`, `--dashboard` e `--skip-network` existem desde aqui. Commander so mapeia flag para propriedade do objeto de opcoes — se a flag nao existe aqui, `opts.skipNetwork` chega `undefined` no passo 10 e o comando fica sem o diagnostico offline, sem erro visivel. Registrar a opcao e a forma barata de documentar o contrato entre as duas licoes.

```ts
// packages/cli/src/exit-codes.ts
export const EXIT = {
  ok: 0,
  fail: 1,
  usage: 2,
  interrupted: 130,
} as const;

export type ExitCode = (typeof EXIT)[keyof typeof EXIT];
```

`EXIT` fica em `exit-codes.ts`, num modulo so de constantes, e nao em `index.ts`. Isso parece preciosismo e nao e: `errors.ts` precisa de `EXIT` e cada um dos quatro comandos precisa de `EXIT`. Se a constante morasse em `index.ts`, `errors.ts` importaria `index.ts` — que importa os quatro comandos, e um dos quais importa `errors.ts`. O resultado e um ciclo de importacao que funciona ate alguem testar. Um modulo de constantes sem dependencia nenhuma e o que mantem a arvore de importacao aciclica.

O `130` nao e arbitrario: e 128 + 2, a convencao POSIX para "interrompido por SIGINT". Um script que roda `harness-tutor chat` e aperta Ctrl+C precisa que `$?` seja 130, porque e assim que o shell e o CI distinguem "cancelado pelo usuario" de "falhou". O `as const` e o que transforma o objeto em tipo: `ExitCode` impede `exitCode: 42` num `CliError`.

Use **apenas** `parseAsync` no `main`. Chamar `parse()` e `parseAsync()` em sequencia executa os handlers duas vezes e o Commander emite aviso de deprecation. E um bug real de CLI: `init` cria dois `.env`.

### Passo 3 - Um unico wrapper de erro, com hints acionaveis

Erros de CLI tem varias classes, e confundi-las gera output inutil. O `hint` e a diferenca entre um CLI annoying e um CLI profissional: a mensagem diz o que deu errado, o hint diz o que fazer.

```ts
// packages/cli/src/errors.ts
import { EXIT, type ExitCode } from "./exit-codes.js";

export class CliError extends Error {
  constructor(
    message: string,
    // ExitCode, e nao number: com number o `EXIT` seria so uma convencao
    // decorativa e `new CliError(msg, 42)` passaria no typecheck.
    readonly exitCode: ExitCode = EXIT.fail,
    readonly hint?: string,
  ) {
    super(message);
    this.name = "CliError";
  }
}

export function toCliError(error: unknown): CliError {
  if (error instanceof CliError) return error;

  if (error instanceof Error) {
    const e = error as Error & { status?: number; code?: string };
    if (e.code === "ENOTFOUND") {
      return new CliError("Host da API nao resolvido.", EXIT.fail, "Verifique a conexao e TUTOR_API_URL.");
    }
    if (e.code === "ECONNREFUSED") {
      return new CliError("Conexao recusada pela API.", EXIT.fail, "A API esta no ar? Use: pnpm dev");
    }
    if (e.status === 401) {
      return new CliError("Credencial invalida.", EXIT.fail, "Rode: harness-tutor init --yes para regerar a chave.");
    }
    if (e.status === 429) {
      return new CliError("Limite de taxa atingido.", EXIT.fail, "Aguarde 30s ou reduza TUTOR_MAX_CONCURRENCY.");
    }
    return new CliError(error.message, EXIT.fail);
  }

  return new CliError("Erro desconhecido.", EXIT.fail);
}
```

O mapeamento de `code` e `status` para mensagem e `hint` vem direto do catalogo de erros do Modulo 10.5, traduzido para linguagem de terminal.

### Passo 4 - Spinner sem dependencia

```ts
// packages/cli/src/ui/spinner.ts
const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export function createSpinner(label: string) {
  const isTTY = process.stderr.isTTY === true;
  let frame = 0;
  let current = label;
  let timer: NodeJS.Timeout | undefined;

  return {
    start(text = label) {
      current = text;
      if (!isTTY) return;
      process.stderr.write("\x1b[?25l");
      timer = setInterval(() => {
        process.stderr.write(`\r${FRAMES[frame++ % FRAMES.length] ?? " "} ${current}`);
      }, 80);
    },
    update(text: string) {
      current = text;
    },
    stop(finalText?: string) {
      if (timer) clearInterval(timer);
      if (!isTTY) return;
      process.stderr.write("\r\x1b[2K\x1b[?25h");
      if (finalText) process.stderr.write(`${finalText}\n`);
    },
  };
}
```

Tres decisoes que evitam bugs reais: o spinner escreve em **stderr**, nunca stdout, porque stdout e o canal de dados do `--json`; o check `isTTY` evita lixo em pipe e em CI; e `\x1b[2K` limpa a linha antes de reescrever, senao o spinner deixa rastro.

O `update` existe porque a 11.5 usa o spinner em duas etapas (`Verificando criterios` e depois `Gerando certificado`): sem ele, cada subcomando precisaria de dois `start()` e o texto antigo ficaria congelado. `update` so troca o rotulo, sem derrubar o intervalo.

### Passo 5 - `init` com escrita segura

A regra de ouro: **nunca sobrescreva um arquivo existente sem confirmacao explicita**.

```ts
// packages/cli/src/commands/init.ts
import { existsSync } from "node:fs";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { confirm, intro, outro, text } from "@clack/prompts";
import { createSpinner } from "../ui/spinner.js";

type InitOptions = { yes?: boolean; dir?: string; dryRun?: boolean };

const ENV_TEMPLATE = [
  "ANTHROPIC_API_KEY=",
  "TUTOR_MODEL=claude-sonnet-4-5",
  "TUTOR_API_URL=https://api.anthropic.com",
  "TUTOR_MAX_CONCURRENCY=2",
  "DATABASE_URL=postgresql://tutor:tutor@localhost:5432/tutor",
  "REDIS_URL=redis://localhost:6379",
  "",
].join("\n");

const GITIGNORE_LINES = ["node_modules/", "dist/", ".next/", ".turbo/", ".env", "*.tsbuildinfo"];

async function mergeGitignore(path: string, dryRun: boolean): Promise<string> {
  if (!existsSync(path)) {
    if (!dryRun) {
      await writeFile(path, `# harness-tutor\n${GITIGNORE_LINES.join("\n")}\n`, "utf8");
    }
    return "created";
  }

  const current = await readFile(path, "utf8");
  const missing = GITIGNORE_LINES.filter((line) => !current.includes(line));
  if (missing.length === 0) return "skipped";
  if (!dryRun) {
    const next = `${current.trimEnd()}\n\n# harness-tutor\n${missing.join("\n")}\n`;
    await writeFile(path, next, "utf8");
  }
  return `merged (+${missing.length})`;
}

export async function runInit(opts: InitOptions): Promise<void> {
  intro("harness-tutor init");
  const dryRun = opts.dryRun === true;
  let root = resolve(opts.dir ?? ".");

  if (!opts.yes) {
    const answer = await text({ message: "Diretorio do projeto", initialValue: root });
    root = String(answer);
  }

  const spinner = createSpinner("Preparando arquivos");
  spinner.start(dryRun ? "Simulando (dry-run)" : "Preparando arquivos");

  const envPath = join(root, ".env");
  if (existsSync(envPath)) {
    if (!opts.yes) {
      spinner.stop();
      const overwrite = await confirm({ message: ".env ja existe. Sobrescrever?", initialValue: false });
      if (!overwrite) {
        outro("Mantido .env existente. Nada foi alterado.");
        return;
      }
    } else {
      // --yes e confirmacao explicita: ainda assim, o arquivo antigo vai para .env.bak
      if (!dryRun) await copyFile(envPath, `${envPath}.bak`);
    }
  }
  if (!existsSync(envPath) || opts.yes) {
    if (!dryRun) {
      await mkdir(dirname(envPath), { recursive: true });
      await writeFile(envPath, ENV_TEMPLATE, "utf8");
    }
  }

  const giStatus = await mergeGitignore(join(root, ".gitignore"), dryRun);
  const configPath = join(root, "harness.config.json");
  if (!existsSync(configPath) && !dryRun) {
    await writeFile(configPath, JSON.stringify({ version: 1, model: "claude-sonnet-4-5" }, null, 2) + "\n", "utf8");
  }

  spinner.stop(dryRun ? "Dry-run concluido" : "Arquivos prontos");
  outro(`gitignore: ${giStatus}\n${dryRun ? "Nada foi escrito." : "Proximo: pnpm install && pnpm dev"}`);
}
```

Repare no `.gitignore`: em vez de sobrescrever ou abortar, ele **mescla** apenas as linhas ausentes. Um CLI que sobrescreve `.gitignore` e destrutivo; um que aborta porque o arquivo existe e incompativel com quem roda `init` num repositorio existente.

E note a diferenca entre `.env` e `.gitignore`. O `.gitignore` **mescla** porque perder uma linha sua e chato mas reversivel. O `.env` **sobrescreve**, porque ali mora a sua `ANTHROPIC_API_KEY` — e um template com `ANTHROPIC_API_KEY=` em branco apaga a chave de graca. Por isso `--yes` nao pula a confirmacao silenciosamente: ele faz o que o nome promete (nao pergunta) mas deixa um `.env.bak` para desfazer. Backup antes de sobrescrever e o que separa um `--yes` honesto de um data loss.

### Passo 6 - Cliente de chat com streaming e Ctrl+C

O nucleo do comando. Tres responsabilidades: conectar, imprimir token a token, sair com graca.

```ts
// packages/cli/src/adapters/tutor-client.ts
export type ChatEvent =
  | { type: "text"; delta: string }
  | { type: "usage"; inputTokens: number; outputTokens: number }
  | { type: "done"; stopReason: string | null }
  | { type: "error"; message: string };

export type ChatOptions = {
  endpoint: string;
  apiKey: string;
  model: string;
  signal: AbortSignal;
};

export async function* streamChat(
  body: unknown,
  opts: ChatOptions,
): AsyncGenerator<ChatEvent> {
  const response = await fetch(opts.endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": opts.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
    signal: opts.signal,
  });

  if (!response.ok || !response.body) {
    const detail = await response.text().catch(() => "");
    yield { type: "error", message: `HTTP ${response.status}: ${detail.slice(0, 200)}` };
    return;
  }

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

      // Este endpoint fala o formato do Harness: um frame = uma linha `data:`.
      // O upstream da Anthropic tem varias linhas por frame e precisa de outro
      // parser — ver o passo 7 da 11.3. Copiar este `startsWith` para la e o bug
      // mais caro do curso, porque funciona aqui e falha so com a API real.
      if (!raw.startsWith("data:")) continue;
      const payload = raw.slice(5).trim();
      if (payload === "[DONE]") {
        yield { type: "done", stopReason: "end_turn" };
        return;
      }

      let event: { type: string; delta?: string; usage?: { input_tokens?: number; output_tokens?: number } };
      try {
        event = JSON.parse(payload) as typeof event;
      } catch {
        yield { type: "error", message: "Frame SSE invalido recebido." };
        return;
      }

      if (event.type === "text" && event.delta) yield { type: "text", delta: event.delta };
      if (event.type === "usage" && event.usage) {
        yield {
          type: "usage",
          inputTokens: event.usage.input_tokens ?? 0,
          outputTokens: event.usage.output_tokens ?? 0,
        };
      }
    }
  }

  yield { type: "done", stopReason: null };
}
```

O `buffer` e o detalhe que separa streaming funcional de streaming quebrado. Um chunk de rede **nao** corresponde a um frame SSE: ele pode conter meio evento ou tres. O loop interno so consome frames completos, separados por `\n\n`. Sem isso, `JSON.parse` estoura em transmissoes longas — exatamente o tipo de bug que so aparece com respostas longas, ou seja, em producao.

O `?? 0` nos dois tokens nao e descuido: o `usage` da Anthropic chega em dois eventos, `message_start` com `input_tokens` e `message_delta` com so `output_tokens`. Ler `input_tokens` do segundo evento devolve `undefined`, e um `undefined` num contador vira `NaN` na conta de tok/s. O default explicito mantem o relatorio numerico mesmo quando o upstream envia o evento parcial.

E o `catch` agora so cerca o `JSON.parse`. Antes ele envolvia o processamento inteiro, e um erro de logica em qualquer `yield` era reportado como "Frame SSE invalido" — uma mensagem de erro que aponta para o parser quando o problema esta no seu codigo. Separar as duas coisas e o que faz o `return` no `catch` ter um significado: o stream terminou de verdade.

### Passo 7 - O comando `chat` com AbortController

```ts
// packages/cli/src/commands/chat.ts
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { loadServerEnv } from "@harness/core";
import { EXIT } from "../exit-codes.js";
import { CliError, toCliError } from "../errors.js";
import { streamChat, type ChatEvent } from "../adapters/tutor-client.js";
import { createSpinner } from "../ui/spinner.js";

type ChatOptions = { message?: string; offline?: boolean };

export async function runChat(opts: ChatOptions): Promise<void> {
  // O env so e exigido no caminho online: --offline precisa rodar em CI sem nenhuma
  // credencial, e loadServerEnv() lancaria CliError faltando ANTHROPIC_API_KEY.
  const env = opts.offline ? undefined : loadServerEnv();
  const controller = new AbortController();
  let interrupted = false;

  const onSigint = () => {
    interrupted = true;
    controller.abort();
  };
  process.on("SIGINT", onSigint);

  const spinner = createSpinner("Pensando");
  const startedAt = performance.now();
  let chars = 0;
  let usage = { inputTokens: 0, outputTokens: 0 };
  let firstTokenAt: number | undefined;
  let finishedAt: number | undefined;

  const consume = async function* (events: AsyncGenerator<ChatEvent>): AsyncGenerator<ChatEvent> {
    for await (const event of events) {
      if (event.type === "text") {
        if (firstTokenAt === undefined) {
          firstTokenAt = performance.now();
          spinner.stop();
        }
        chars += event.delta.length;
        stdout.write(event.delta);
      }
      yield event;
    }
  };

  const ask = async (question: string): Promise<void> => {
    spinner.start("Pensando");
    const events = streamChat(
      { model: env.TUTOR_MODEL, max_tokens: 2048, messages: [{ role: "user", content: question }] },
      {
        endpoint: `${env.TUTOR_API_URL}/v1/messages`,
        apiKey: env.ANTHROPIC_API_KEY,
        model: env.TUTOR_MODEL,
        signal: controller.signal,
      },
    );

    for await (const event of consume(events)) {
      if (event.type === "usage") {
        usage = { inputTokens: event.inputTokens, outputTokens: event.outputTokens };
      }
      if (event.type === "error") throw new CliError(event.message, EXIT.fail);
    }
    finishedAt = performance.now();
  };

  try {
    if (opts.offline) {
      stdout.write("[offline] resposta simulada: verifique o cache local.\n");
    } else if (opts.message) {
      await ask(opts.message);
    } else {
      const rl = createInterface({ input: stdin, output: stdout });
      for (;;) {
        const question = await rl.question("voce> ");
        if (question.trim() === "" || question === ":q") break;
        await ask(question);
        stdout.write("\n");
      }
      rl.close();
    }
  } catch (error) {
    spinner.stop();
    const cliError = toCliError(error);
    process.stderr.write(`${cliError.message}\n`);
    if (cliError.hint) process.stderr.write(`hint: ${cliError.hint}\n`);
    process.exitCode = interrupted ? EXIT.interrupted : cliError.exitCode;
    return;
  } finally {
    process.off("SIGINT", onSigint);
  }

  // Duas metricas distintas e nao confundiveis: TTFT e quanto tempo ate o primeiro
  // token; throughput e quanto tempo o stream inteiro durou. Medir throughput com
  // firstTokenAt daria a velocidade de uma unica palavra e superestimaria o modelo.
  const totalMs = (finishedAt ?? performance.now()) - startedAt;
  const ttftMs = firstTokenAt === undefined ? undefined : firstTokenAt - startedAt;
  const tokensPerSecond = totalMs > 0 ? (usage.outputTokens / totalMs) * 1000 : 0;

  process.stderr.write(
    `\n${usage.outputTokens} tokens em ${(totalMs / 1000).toFixed(1)}s ` +
      `(${tokensPerSecond.toFixed(1)} tok/s, ` +
      `${ttftMs === undefined ? "sem streaming" : "TTFT " + ttftMs.toFixed(0) + "ms"})\n`,
  );
  process.exitCode = EXIT.ok;
}
```

Tres detalhes que valem mais que o resto do arquivo:

**O `process.off` no `finally`.** Sem ele, Ctrl+C numa segunda sessao acumula listeners e o Node emite `MaxListenersExceededWarning`. O `finally` garante limpeza mesmo no caminho de erro.

**`process.exitCode` em vez de `process.exit()`.** `process.exit()` mata o processo antes de o stdout drenar, e o usuario perde os ultimos tokens da resposta. `process.exitCode` deixa o event loop terminar naturalmente.

**As duas metricas impressas ao final.** TTFT (time to first token) mede quanto tempo voce espera antes da primeira palavra aparecer — e o numero que voce vai usar para comparar modelo, prompt e cache nas Licoes 10.1 e 10.5. Tok/s mede o stream inteiro. Sao numeros diferentes e nao se substituem: se voce calcular tok/s com o `firstTokenAt`, mede a velocidade de uma unica palavra e sai um resultado 10x otimista. Instrumentar aqui paga-se no resto do curso.

### Passo 8 - O evaluator em `@harness/core`

O comando `test` nao deve implementar logica de avaliacao; ele deve *consumir* o evaluator do dominio. Crie `packages/core/src/evaluator.ts`:

```ts
import { z } from "zod";

export const CheckResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(["passed", "failed", "skipped"]),
  durationMs: z.number().int().nonnegative(),
  message: z.string(),
});
export type CheckResult = z.infer<typeof CheckResultSchema>;

export const ReportSchema = z.object({
  harnessTutorVersion: z.string(),
  checks: z.array(CheckResultSchema),
  passed: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  durationMs: z.number().int().nonnegative(),
});
export type Report = z.infer<typeof ReportSchema>;
```

Os checks concretos (o `.env` existe? o health da API responde? o dashboard builda?) ficam em `packages/cli/src/checks/`, porque dependem de disco e de rede — e por isso **nao** pertencem ao dominio. Essa separacao e o teste final da sua fronteira da 11.1.
### Passo 9 - Os checks de filesystem

```ts
// packages/cli/src/checks/env-check.ts
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { CheckResult } from "@harness/core";

const REQUIRED = ["ANTHROPIC_API_KEY", "TUTOR_MODEL", "DATABASE_URL"] as const;

export function runEnvCheck(root: string): CheckResult {
  const started = performance.now();
  const path = join(root, ".env");

  if (!existsSync(path)) {
    return {
      id: "env",
      name: "Arquivo .env presente",
      status: "failed",
      durationMs: Math.round(performance.now() - started),
      message: ".env nao encontrado. Rode: harness-tutor init",
    };
  }

  const content = readFileSync(path, "utf8");
  const keys = new Set(
    content
      .split("\n")
      .map((line) => line.split("=")[0]?.trim())
      .filter((key): key is string => Boolean(key)),
  );
  const missing = REQUIRED.filter((key) => !keys.has(key));

  return {
    id: "env",
    name: "Variaveis obrigatorias no .env",
    status: missing.length === 0 ? "passed" : "failed",
    durationMs: Math.round(performance.now() - started),
    message: missing.length === 0 ? "Todas presentes" : `Faltando: ${missing.join(", ")}`,
  };
}
```

O check **nao valida o valor** da chave, apenas a presenca. Validar o valor aqui duplicaria o `loadServerEnv` e criaria duas fontes de verdade. Se a chave existe mas esta vazia, o schema do dominio acusa — e a mensagem sai no `chat`, onde importa.

### Passo 10 - O check de saude da API com timeout

```ts
// packages/cli/src/checks/health-check.ts
import type { CheckResult } from "@harness/core";

export async function runHealthCheck(
  baseUrl: string,
  timeoutMs = 3000,
): Promise<CheckResult> {
  const started = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}/health`, { signal: controller.signal });
    return {
      id: "api-health",
      name: `API saudavel em ${baseUrl}`,
      status: response.ok ? "passed" : "failed",
      durationMs: Math.round(performance.now() - started),
      message: response.ok ? "OK" : `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      id: "api-health",
      name: `API saudavel em ${baseUrl}`,
      status: "failed",
      durationMs: Math.round(performance.now() - started),
      message: error instanceof Error ? error.message : "falha desconhecida",
    };
  } finally {
    clearTimeout(timer);
  }
}
```

Um check **nunca lanca**: retorna `CheckResult` com `status: "failed"`. Se lancar, o relatorio inteiro quebra e o aluno perde a informacao de quais outros checks passaram — o oposto do que um relatorio de saude deve fazer. Este e o padrao "coletar e continuar" do Modulo 5.5.

### Passo 11 - O comando `test` com saida dupla

```ts
// packages/cli/src/commands/test.ts
import { createRequire } from "node:module";
import pc from "picocolors";
import { ReportSchema, type Report } from "@harness/core";
import { EXIT } from "../exit-codes.js";
import { runEnvCheck } from "../checks/env-check.js";
import { runHealthCheck } from "../checks/health-check.js";

type TestOptions = { json?: boolean; bail?: boolean; root?: string; offline?: boolean };

const require = createRequire(import.meta.url);

export async function runTest(opts: TestOptions): Promise<void> {
  const root = opts.root ?? process.cwd();
  const asJson = opts.json === true;
  const started = performance.now();

  const checks = [runEnvCheck(root)];

  // `--offline` nao pula o check: ele marca como `skipped`. Um check ausente do
  // relatorio e indistinguivel de um check que passou, e o `passed`/`failed` da
  // 11.5 conta sobre `checks` — sem o `skipped`, o relatorio offline mentiria.
  if (opts.offline === true) {
    checks.push({
      id: "health",
      name: "Saude da API",
      status: "skipped",
      durationMs: 0,
      message: "Ignorado por --offline",
    });
  } else {
    const apiUrl = process.env["TUTOR_API_URL"] ?? "http://localhost:4000";
    if (!asJson) process.stderr.write("> verificando API...\n");
    checks.push(await runHealthCheck(apiUrl));
  }

  const report: Report = {
    harnessTutorVersion: (require("../../package.json") as { version: string }).version,
    checks,
    passed: checks.filter((c) => c.status === "passed").length,
    failed: checks.filter((c) => c.status === "failed").length,
    durationMs: Math.round(performance.now() - started),
  };

  const parsed = ReportSchema.safeParse(report);
  if (!parsed.success) throw new Error("Relatorio invalido gerado pelo evaluator.");

  if (asJson) {
    process.stdout.write(`${JSON.stringify(parsed.data, null, 2)}\n`);
  } else {
    for (const check of parsed.data.checks) {
      const icon = check.status === "passed" ? pc.green("PASS") : pc.red("FAIL");
      process.stdout.write(`${icon}  ${check.name} (${check.durationMs}ms)\n      ${check.message}\n`);
    }
    process.stdout.write(
      `\n${parsed.data.passed} passed, ${parsed.data.failed} failed in ${parsed.data.durationMs}ms\n`,
    );
  }

  process.exitCode = parsed.data.failed > 0 ? EXIT.fail : EXIT.ok;
}
```

Tres pontos que todo review de CLI cobra:

**O `--json` nao escreve nada alem do JSON em stdout.** Todo o progresso vai para stderr. Um `console.log` esquecido no meio de um check corrompe o parse do Licao 11.5, e o erro aparece la, tres licoes de distancia, como "certificado invalido".

**O `ReportSchema.safeParse` antes de imprimir.** O dominio valida a propria saida. E o tipo de garantia que faz o consumidor confiar no `--json` sem defensiva.

**`skipped` nao conta como `passed`.** O relatorio tem tres estados porque as coisas tem tres estados: passou, falhou, ou nao se aplica. Um check de rede marcado como passado porque foi pulado e o tipo de bug que so aparece no relatorio final do capstone, como um criterio a mais. Note que `passed` e `failed` contam separadamente, e `skipped` fica fora dos dois — logo `passed + failed` pode ser menor que `checks.length`, que e o comportamento correto.

### Passo 12 - Testes do CLI com stdout e stderr separados

```ts
// packages/cli/src/commands/test.test.ts
import { describe, expect, it, vi, afterEach } from "vitest";
import { runTest } from "./test.js";

function captureStdout() {
  const out: string[] = [];
  const spy = vi.spyOn(process.stdout, "write").mockImplementation((chunk: unknown) => {
    out.push(String(chunk));
    return true;
  });
  return { out, spy };
}

afterEach(() => {
  vi.restoreAllMocks();
  process.exitCode = 0;
});

describe("test --json", () => {
  it("emite somente JSON valido no stdout", async () => {
    const { out, spy } = captureStdout();
    await runTest({ json: true, root: process.cwd() });
    spy.mockRestore();

    const raw = out.join("");
    expect(raw.trim().startsWith("{")).toBe(true);
    const parsed = JSON.parse(raw);
    expect(Array.isArray(parsed.checks)).toBe(true);
    expect(typeof parsed.passed).toBe("number");
  });

  it("retorna exit code 1 quando ha check falhando", async () => {
    const { spy } = captureStdout();
    await runTest({ json: true, root: "/caminho/que/nao/existe" });
    spy.mockRestore();
    expect(process.exitCode).toBe(1);
  });
});
```

Esse e o teste que protege a Licao 11.5. Ele verifica exatamente a propriedade que o consumidor precisa: **stdout contem JSON puro**. Se alguem adicionar um `console.log` no meio, o teste falha localmente em vez de falhar no servidor de certificados.

Rode com `pnpm --filter @harness/cli test`.

### Passo 13 - Validar a CLI de ponta a ponta

Use um diretorio temporario real, sem `/tmp` — o caminho literal nao existe no Windows (`C:\tmp`), e o `init` falha com `ENOENT` antes de rodar qualquer logica:

```bash
pnpm --filter @harness/cli build
SANDBOX="$(mktemp -d)"          # no Windows: $env:TEMP
node packages/cli/dist/index.js --help
node packages/cli/dist/index.js init --dry-run --dir "$SANDBOX"
ls -a "$SANDBOX"                # dry-run nao escreve nada

node packages/cli/dist/index.js init --yes --dir "$SANDBOX"
cat "$SANDBOX/.gitignore"
```

O `--dry-run` precisa ser verificado por ausencia, nao por mensagem: `ls` antes de rodar de novo e depois. E o que distingue um dry-run que mente do dry-run que respeita.

O teste de parseabilidade por terceiros:

```bash
node packages/cli/dist/index.js test --json | node -e "
  let raw = '';
  process.stdin.on('data', (d) => (raw += d)).on('end', () => {
    const r = JSON.parse(raw);
    console.log('checks:', r.checks.length, 'passed:', r.passed, 'failed:', r.failed);
  });
"
```

O pipe para um `node` separado e o teste real. Um `--json` que funciona quando voce ve a saida no terminal e quebra nesse pipe e o que vai quebrar a 11.5 no CI. Se aparecer `SyntaxError: Unexpected token`, o culpado quase sempre e um `console.log` de depuracao que alguem deixou no caminho.

Depois, o teste de robustez do `init` destrutivo:

```bash
printf 'linha-importante\n' > "$SANDBOX/.gitignore"
node packages/cli/dist/index.js init --yes --dir "$SANDBOX"
cat "$SANDBOX/.gitignore"   # "linha-importante" deve sobreviver
```

E o backup do `.env`, que e o outro lado da mesma garantia:

```bash
printf 'ANTHROPIC_API_KEY=sk-real\n' > "$SANDBOX/.env"
node packages/cli/dist/index.js init --yes --dir "$SANDBOX"
cat "$SANDBOX/.env.bak"    # a chave real tem que estar aqui
```

A chave real sobrevive no `.bak` e a original foi trocada pelo template. E o comportamento correto: `--yes` faz o que promete (nao pergunta) sem ser o caminho para perder uma credencial sem volta.

E o chat, com os dois modos:

```bash
node packages/cli/dist/index.js chat --offline
node packages/cli/dist/index.js chat -m "explique Project References"   # exit 0
```

### Passo 14 - Instalar o bin e documentar os exit codes

```bash
pnpm add -g ./packages/cli
harness-tutor --version
```

Se o `pnpm add -g` falhar com `EACCES` no Windows, habilite o Developer Mode ou use `npm i -g ./packages/cli` como alternativa.

Adicione `docs/cli.md` com a tabela de codigos de saida:

```markdown
| Codigo | Significado                                  |
|--------|----------------------------------------------|
| 0      | sucesso                                     |
| 1      | falha recuperavel (config, rede, check)      |
| 2      | uso incorreto (flag inexistente)             |
| 130    | interrompido por SIGINT                      |
```

Depois faca o commit. Ate aqui o capstone tem uma fronteira de dominio e uma CLI funcional.

---

## Decisoes praticas

- **`parseAsync` sozinho.** `parse` + `parseAsync` executa handlers duas vezes — bug de CLI que cria arquivos duplicados.
- **stdout para dados, stderr para apresentacao.** Regra que torna `--json` confiavel e `--dry-run` legivel em pipe.
- **Check nunca lanca.** Retorna resultado; o relatorio completo vale mais que uma excecao.
- **Validar a propria saida com o schema do dominio.** `ReportSchema.safeParse` antes do `JSON.stringify`.
- **Progresso e metricas em stderr, sempre.** Inclusive o TTFT, que vira dado de analise nas Licoes 10.1 e 10.5.
- **`process.exitCode`, nunca `process.exit()`.** Sair pode cortar o stdout no meio da resposta.

## Checklist de implementacao

1. Quatro subcomandos registrados, com `--json` e `--no-color` globais.
2. `CliError` com `hint` e mapeamento de `ENOTFOUND`, `ECONNREFUSED`, 401 e 429.
3. Spinner em stderr, com guarda de `isTTY`.
4. `init` com `--dry-run`, `--yes` e fusao de `.gitignore` sem perda de linhas.
5. Cliente de chat com buffer SSE parcialmente consumida e `try/catch` no parse.
6. `chat` com `AbortController`, `finally` removendo o listener e TTFT impresso.
7. `evaluator.ts` no core com `CheckResultSchema` e `ReportSchema`.
8. Checks em `packages/cli/src/checks/`, nunca no core.
9. `test --json` emitindo JSON puro, validado pelo schema.
10. Teste provando que `stdout` contem apenas JSON.
11. `docs/cli.md` com a tabela de exit codes.

## Exercicios

### Questao 1
**Pergunta:** O que acontece se `init` chama `program.parse(argv)` e depois `await program.parseAsync(argv)`?

**Resposta esperada:** Os handlers executam duas vezes, criando dois `.env` e imprimindo duas vezes. E a origem de bugs do tipo "init quebrou meu projeto". Use apenas `parseAsync`.

### Questao 2
**Pergunta:** Por que o check de saude da API retorna `CheckResult` falhado em vez de lancar excecao?

**Resposta esperada:** Porque um check que lanca aborta o relatorio inteiro e o aluno perde a informacao de quais outros checks passaram. O padrao "coletar e continuar" mantem o relatorio completo mesmo com falhas parciais.

### Questao 3
**Pergunta:** Um `console.log("conectando...")` dentro do `test` comecou a corromper o `--json`. Qual regra foi violada?

**Resposta esperada:** stdout e o canal de dados do `--json`; texto de progresso pertence a stderr. O parse do consumidor quebra sem aviso, e a falha aparece no servidor de certificados em vez de localmente.

### Questao 4
**Pergunta:** Por que `process.exitCode` e preferivel a `process.exit()` num CLI com streaming?

**Resposta esperada:** `process.exit()` encerra o processo imediatamente e pode descartar o que ainda esta no buffer do stdout, cortando a ultima parte da resposta do tutor. `process.exitCode` deixa o event loop drenar e sair naturalmente.

### Questao 5
**Pergunta:** Chunks de rede podem conter meio frame SSE. O que acontece sem o buffer?

**Resposta esperada:** `JSON.parse` recebe payload truncado e lanca `SyntaxError`, quebrando a transmissao. Como respostas longas sao as mais provaveis a serem divididas em muitos chunks, o bug so aparece com conteudo extenso — tipico de producao.

## Exercicio pratico com gabarito

### Enunciado
Adicione o subcomando `harness-tutor doctor` com quatro checks: versao do Node dentro do requisito, presenca de `ANTHROPIC_API_KEY`, conectividade com a API e uso de memoria do processo. Ele deve funcionar **offline** (sem rede) e **online**, degradando cada check separadamente.

### Entregaveis
- `packages/cli/src/commands/doctor.ts` e um arquivo por check em `packages/cli/src/checks/`.
- Cada check como funcao `(ctx: DoctorContext) => Promise<CheckResult>`, sem `console.log`.
- Saida humana tabular **e** `--json`, com os dois modos testados.
- `doctor.test.ts` com 4 casos: happy path, sem chave, API fora, e JSON valido em stdout.
- `docs/cli.md` atualizado com a linha de `doctor`.

### Gabarito esperado
Um `DoctorContext` com `env`, `fetchFn` injetavel e `cwd`. Cada check retorna resultado em vez de lancar; o `doctor` agrega e escolhe entre a tabela humana (com `picocolors`) e o JSON. O teste injeta um `fetchFn` que resolve ou rejeita, o que torna o check de conectividade 100% deterministico sem rede.

### Criterios de avaliacao
1. Nenhum check faz `console.log`; a saida passa pelo agregador.
2. `doctor --json` produz JSON valido com zero texto extra em stdout.
3. Falha de um check nao interrompe os demais.
4. `fetchFn` injetavel torna os testes offline e deterministicos.
5. `harness-tutor doctor` roda em projeto vazio sem lancar excecao nao tratada.

## Fechamento

Sua CLI tem quatro subcomandos com contratos distintos, streaming funcional com `Ctrl+C` tratado, e um `--json` que um terceiro consegue parsear. Esse `--json` ja e contrato publico do projeto — a Licao 11.5 vai depender dele para emitir o certificado.

Na proxima licao o mesmo dominio ganha uma segunda interface: o dashboard Next.js, com Server Components, streaming no navegador e o mesmo `sessionReducer` que voce testou com tres casos na 11.1.
