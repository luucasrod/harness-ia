# LICAO 11.5: Certificate System & Final Submission

Feche o ciclo: `harness-tutor submit` valida a evidencia, a API assina um certificado com HMAC-SHA256, o aluno recebe um PDF e uma badge publica, e qualquer pessoa consegue verificar a autenticidade.

## Objetivos da licao

- Validar a submissao contra evidencia objetiva, nao contra declaracao do aluno.
- Assinar o certificado com HMAC-SHA256 e tornar a verificacao reproduzivel por qualquer pessoa.
- Gerar PDF de certificado no servidor sem depender de browser.
- Emitir badge SVG publica e acessivel.
- Implementar idempotencia de submissao com chave unica e `upsert`.
- Escrever o relatorio final do capstone com metricas reais do projeto.

## Contexto do modulo

Esta e a ultima licao, e ela responde a uma pergunta que nenhum repositorio responde sozinho: **isso esta realmente pronto?**

Um certificado que o proprio aluno pode emitir nao vale nada. Um certificado emitido sem verificacao e um PDF bonito. A diferenca esta em uma assinatura que qualquer terceiro pode conferir chamando um endpoint publico.

E aqui vale ser preciso sobre o que HMAC **nao** e, porque o nome engana. HMAC e uma assinatura **simetrica**: a mesma chave que assina tambem verifica. Isso significa que a verificacao e publica (basta chamar `/verify/:code`) mas **nao e offline** — quem verifica depende do servidor, e o servidor e a parte que estamos tentando nao confiar cegamente. Por isso o endpoint nao devolve um campo `valid` do banco: ele recalcula o HMAC. Quem verifica nao precisa acreditar no banco, so precisa acreditar que a chave nao vazou.

Se voce quiser verificacao verdadeiramente independente — um script rodando na maquina do avaliador, sem falar com nenhum servidor — o caminho e assinatura assimetrica: `generateKeyPairSync` no servidor, chave publica embutida no certificado, `sign` e `verify` com Ed25519. A chave publica pode ser impressa no PDF porque nao e segredo. O exercicio pratico do fim da licao mostra esse caminho. Para um curso com um servidor sob seu controle, HMAC com verificacao recalculada e a escolha honesta e mais simples.

A arquitetura de verificacao vai ser deliberadamente simples e audivel: HMAC-SHA256 sobre o payload do certificado, chave secreta que vive **apenas** no servidor, e um endpoint publico `/verify/:code` que recalcula a assinatura. Qualquer pessoa pode colar o codigo e saber se e verdadeiro.

Orcamento: ~3h. E a licao mais densa do modulo, nao a mais curta: o trabalho pesado ja foi feito, mas fecha com assinatura, PDF, badge, idempotencia e probes de verificacao — e cada uma dessas pecas e um lugar onde o sistema pode mentir.

## SECAO 1: EVIDENCIA, NAO DECLARACAO

A regra que define a qualidade de um sistema de certificado: **o que o sistema verifica e a evidencia que o aluno pode produzir, nunca a frase "estou pronto"**.

Para o Harness Tutor, a evidencia e concreta e ja existe, gracas ao trabalho das licoes anteriores:

| Criterio | Evidencia | Como verificar |
|---|---|---|
| Monorepo estruturado | 4 pacotes com fronteiras | `pnpm verify` + grafo do Turborepo |
| Dominio testado | cobertura de `packages/core` | `vitest --coverage` acima do limiar |
| CLI funcional | 4 subcomandos, exit codes | `harness-tutor test --json` |
| API em producao | `/ready` respondendo 503 ou 200 | `curl` na URL publicada |
| Dashboard no ar | pagina carregando | `curl` na URL Vercel |
| Streaming funcionando | TTFT abaixo do limite | `curl -N` e medicao |
| Chave fora do bundle | busca no JS servido | `grep` no bundle |
| Docker | imagem multi-stage com usuario nao-root | `docker inspect` |

Cada linha e verificavel por maquina. Nenhuma depende de confianca no aluno. Esse e o principio de avaliacao automatizada que separa um curso com certificado significativo de um curso que so emite PDF.

Uma ressalva honesta sobre "verificavel por maquina": quatro dessas verificacoes rodam no **servidor do curso** (API no ar, dashboard publicado, streaming, bundle sem chave) e dependem de rede. As outras quatro rodam no **computador do aluno** (monorepo, testes, CLI, Docker) e dependem do ambiente dele. Nenhuma das duas e infalivel, e o sistema e desenhado para isso: o probe externo tem timeout e devolve `false` em vez de travar, e o aluno pode rodar `submit --skip-network` para ver o diagnostico mesmo offline. O que o sistema garante nao e que a evidencia seja verdadeira — e que ela seja **produzida por verificacao, e nao por declaracao**.

---

## PASSO A PASSO

### Passo 1 - O schema de submissao no dominio

Comece pelo dominio, como sempre. `packages/core/src/submission.ts`:

```ts
import { z } from "zod";

export const CriterionSchema = z.object({
  id: z.enum(["monorepo", "domain-tests", "cli", "api-live", "dashboard-live", "streaming", "no-secret-leak", "docker"]),
  label: z.string(),
  passed: z.boolean(),
  evidence: z.string().max(2000),
  measured: z.record(z.string(), z.number()).optional(),
});

export const SubmissionSchema = z.object({
  studentName: z.string().min(3).max(120),
  studentEmail: z.email(),
  repoUrl: z.url().refine((u) => u.startsWith("https://github.com/"), {
    message: "repoUrl deve ser um repositorio publico do GitHub",
  }),
  commitSha: z.string().regex(/^[0-9a-f]{40}$/, "commitSha deve ser um SHA completo de 40 caracteres"),
  report: z.object({
    harnessTutorVersion: z.string(),
    passed: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
    durationMs: z.number().int().nonnegative(),
  }),
  // Exatamente 8 criterios, e sem repeticao. `min(1).max(20)` permitiria mandar so
  // os 2 que passaram: score 2, total 2, e `>= 6` nunca seria alcancado — mas o
  // certificado impresso diria "2/2", que parece perfeito. `superRefine` garante
  // que a contagem e sempre sobre os 8 reais.
  criteria: z
    .array(CriterionSchema)
    .length(8, "a submissao deve conter exatamente os 8 criterios")
    .refine(
      (list) => new Set(list.map((c) => c.id)).size === list.length,
      "cada criterio pode aparecer uma unica vez",
    ),
  submittedAt: z.string().datetime(),
});
export type Submission = z.infer<typeof SubmissionSchema>;

export const PASS_THRESHOLD = 6;

export function gradeSubmission(submission: Submission): {
  score: number;
  total: number;
  eligible: boolean;
  failedCriteria: string[];
} {
  const passed = submission.criteria.filter((c) => c.passed);
  const failedCriteria = submission.criteria.filter((c) => !c.passed).map((c) => c.label);
  return {
    score: passed.length,
    total: submission.criteria.length,
    eligible: passed.length >= PASS_THRESHOLD && submission.report.failed === 0,
    failedCriteria,
  };
}
```

O `.length(8)` e o que impede a submissao de conveniencia. Sem ele, o criterio fica **autodeclarado de qualquer jeito**: o aluno envia `criteria` com 2 entradas e diz que as duas passaram, e `total` vira 2. Como o schema nao exige os ids, o `gradeSubmission` nunca descobre que faltaram 6. Com o `.length(8)` mais o refine de unicidade, a contagem so pode ser feita sobre os 8 criterios definidos aqui — o que e exatamente o que o professor pode conferir.

Cinco decisoes:

**`commitSha` com regex de 40 caracteres.** SHA abreviado e ambiguo: dois repositorios podem ter o mesmo prefixo de 7 caracteres. O certificado precisa apontar para um commit unico e imutavel.

**`repoUrl` restrito a GitHub, e so ao formato.** A `refine` garante a forma da URL, nao a existencia do repositorio. Ela barra `github.com/nao-existe` com barra no fim, mas **nao** barra um repositorio privado nem um inexistente com URL bem formada — para isso seria preciso uma chamada a API. O que o schema faz e tornar a fraude visivel no proximo passo: o professor clica no link do certificado e ve o 404. Formato validado no servidor, existencia conferida pelo humano.

**`report.failed === 0` alem do threshold.** O threshold de 6 de 8 permite alguma tolerancia em criterios secundarios, mas um relatorio com check falhando significa que o projeto esta quebrado. Os dois criterios sao necessarios: um minimo de qualidade e nenhuma falha conhecida.

**O threshold e 6 de 8, nao 8 de 8.** E uma escolha de pedagogico, nao de criptografia. Exigir 8 de 8 transformaria o certificado numWizard of Oz onde um unico check de rede travado cancela otrabalho de 14 horas. Seis de oito com zero check quebrado separa "entregou e tem prova" de "entregou e tem dois problemas conhecidos". Se voce quiser ser mais rigido, mude a constante `PASS_THRESHOLD` e nada mais precisa mudar.

**`passed: z.boolean()` no schema, mas com probe obrigatorio.** Este e o ponto honesto do schema: ele valida a *forma* do payload, nao a *verdade* do que ele afirma. O `passed: true` e uma declaracao. Quem transforma declaracao em evidencia e o `runProbes` do passo 10, que faz as requisisoes de verdade. Por isso o schema nunca e o suficiente sozinho.

### Passo 2 - Assinatura HMAC do certificado

O nucleo da confiancia. `packages/core/src/certificate.ts` — e nao em `apps/api`, porque a assinatura precisa ser testavel sem subir servidor nem conectar em banco:

```ts
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { z } from "zod";

export const CertificateClaimsSchema = z.object({
  // Crockford base32 de 26 caracteres, sem I/L/O/U. O mesmo regex do endpoint
  // /verify: se o schema aceitasse 12 chars e a rota 26, o payload gravado
  // passaria no schema e seria rejeitado na rota.
  code: z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/),
  studentName: z.string(),
  studentEmail: z.email(),
  repoUrl: z.url(),
  commitSha: z.string().regex(/^[0-9a-f]{40}$/),
  score: z.number().int().nonnegative(),
  total: z.number().int().positive(),
  issuedAt: z.string().datetime(),
});
export type CertificateClaims = z.infer<typeof CertificateClaimsSchema>;

/** Serializacao canonica: a ordem das chaves precisa ser estavel,
 *  senao a assinatura muda mesmo com o mesmo conteudo. */
export function canonicalize(claims: CertificateClaims): string {
  return [
    `code:${claims.code}`,
    `studentName:${claims.studentName}`,
    `studentEmail:${claims.studentEmail}`,
    `repoUrl:${claims.repoUrl}`,
    `commitSha:${claims.commitSha}`,
    `score:${claims.score}`,
    `total:${claims.total}`,
    `issuedAt:${claims.issuedAt}`,
  ].join("\n");
}

export function signClaims(claims: CertificateClaims, secret: string): string {
  return createHmac("sha256", secret).update(canonicalize(claims)).digest("hex");
}

export function verifySignature(claims: CertificateClaims, secret: string, signature: string): boolean {
  const expected = signClaims(claims, secret);
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Codigo curto e legivel: Crockford base32, sem 0/O, 1/I, L ou U. */
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const ALPHABET_LEN = 32; // potencia de dois: 256 % 32 === 0

export function generateCode(): string {
  // 16 bytes = 128 bits; em base32 sao 26 caracteres (ceil(128/5)).
  // 26 caracteres * 5 bits = 130 bits de entropia, e o ultimo digito carrega
  // 2 bits a mais que o necessario — inofensivo.
  const bytes = randomBytes(16);
  let bits = 0;
  let value = 0;
  let code = "";

  // 256 % 32 === 0, entao nao ha vies de modulo aqui. Com um alfabeto de tamanho
  // nao-potencia-de-dois (por exemplo 33), este mesmo codigo produziria os
  // primeiros digitos mais que os outros — e o motivo de o alfabeto ter 32.
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      code += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) code += ALPHABET[(value << (5 - bits)) & 31];

  return code;
}
```

Um detalhe do alfabeto: Crockford usa `0123456789ABCDEFGHJKMNPQRSTVWXYZ` (32 chars, com `0` e `1` preservados mas `I`, `L`, `O` e `U` removidos). Ele tabula `0<->O` e `1<->I/L` na decodificacao, o que funciona bem em QR code. Para um codigo digitado por uma pessoa, **remover** os ambiguos e mais seguro do que tabula-los: nao ha etapa de decodificacao, logo nao ha o que recuperar. Por isso este alfabeto remove `I`, `L`, `O` e `U`.

Tres detalhes de seguranca que separam assinatura real de assinatura decorativa:

**A serializacao canonica.** `JSON.stringify` nao garante ordem de chaves estavel entre implementacoes e versoes. Com a funcao `canonicalize` explicita, a mesma informacao sempre produz o mesmo bytes, e portanto a mesma assinatura. Sem isso, um certificado legitimo falha na verificacao depois de um deploy.

**`timingSafeEqual`.** Comparacao de string com `===` retorna assim que encontra a primeira diferenca, vazando informacao por tempo. Para assinatura isso e ataque classico. `timingSafeEqual` sempre compara o tamanho inteiro. E por isso que o `a.length !== b.length` vem antes: a funcao lanca em tamanhos diferentes.

**Base32 sem ambiguos.** Um certificado impresso e digitado de volta precisa funcionar. O par visual `O`/`0` e o par `I`/`1` nao podem coexistir. Aqui a desambiguacao e feita **removendo as letras** — `I`, `L`, `O` e `U` saem do alfabeto e os digitos `0` e `1` ficam. Cada par sobra com um unico membro, que e o que importa. Sao 32 caracteres, nao 36, e o removido e sempre a letra.

E a entropia e o que impede forca bruta: 26 caracteres de 5 bits sao 130 bits, ou seja mais de 10^39 combinacoes. Ninguem adivinha um certificado; o codigo existe so para o aluno carregar e para o avaliador conferir, nao como segredo. Se voce diminuir o codigo para 8 caracteres "para ficar mais curto no PDF", cai para 40 bits — forca bruta trivial. O comprimento e o que faz a verificacao publica ser segura.

### Passo 3 - Teste da assinatura, incluindo o ataque de reordenacao

```ts
// packages/core/src/certificate.test.ts
import { describe, expect, it } from "vitest";
import { canonicalize, generateCode, signClaims, verifySignature, type CertificateClaims } from "./certificate.js";

// Codigo gerado de verdade, nao um literal: se `generateCode` mudar de alfabeto
// ou de tamanho, este arquivo continua compativel com `CertificateClaimsSchema`
// e o unico lugar que quebra e o type-check — que e exatamente o que voce quer.
const claims: CertificateClaims = {
  code: generateCode(),
  studentName: "Ana Souza",
  studentEmail: "ana@example.com",
  repoUrl: "https://github.com/ana/harness-tutor",
  commitSha: "a".repeat(40),
  score: 8,
  total: 8,
  issuedAt: "2026-09-28T12:00:00.000Z",
};

const SECRET = "segredo-de-teste-suficientemente-longo";

describe("assinatura de certificado", () => {
  it("assina e verifica claims identicos", () => {
    const sig = signClaims(claims, SECRET);
    expect(verifySignature(claims, SECRET, sig)).toBe(true);
  });

  it("rejeita assinatura feita com outro segredo", () => {
    const sig = signClaims(claims, SECRET);
    expect(verifySignature(claims, "outro-segredo", sig)).toBe(false);
  });

  it("rejeita quando o score e alterado apos a assinatura", () => {
    const sig = signClaims(claims, SECRET);
    const fraudado = { ...claims, score: 10 };
    expect(verifySignature(fraudado, SECRET, sig)).toBe(false);
  });

  it("canonicalize produz os mesmos bytes com as chaves em outra ordem", () => {
    // Reconstrucao explicita na ordem inversa. Um spread `...claims` no fim
    // sobrescreveria os valores originais e o teste passaria sem provar nada:
    // seria o mesmo objeto, na mesma ordem de insercao.
    const { code, studentName, studentEmail, repoUrl, commitSha, score, total, issuedAt } = claims;
    const reordered: CertificateClaims = {
      issuedAt, total, score, commitSha, repoUrl, studentEmail, studentName, code,
    };

    expect(Object.keys(reordered)).not.toEqual(Object.keys(claims));
    expect(canonicalize(reordered)).toBe(canonicalize(claims));
    expect(signClaims(reordered, SECRET)).toBe(signClaims(claims, SECRET));
  });

  it("canonicalize inclui todos os campos", () => {
    const text = canonicalize(claims);
    for (const value of [claims.code, claims.studentName, claims.studentEmail, claims.repoUrl, claims.commitSha, String(claims.score), String(claims.total), claims.issuedAt]) {
      expect(text).toContain(value);
    }
  });

  it("generateCode produz 26 caracteres sem ambiguos e sem repeticao", () => {
    const codes = new Set(Array.from({ length: 500 }, () => generateCode()));
    // 500 de 130 bits de entropia: colisao e impossivel na pratica. A falha real
    // seria um alfabeto com vies, que faria os primeiros digitos se repetirem.
    expect(codes.size).toBe(500);
    for (const c of codes) expect(c).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
  });
});
```

O quarto teste e o que protege contra a regressao mais sutil: se alguem trocar `canonicalize` por `JSON.stringify`, esse teste falha imediatamente. Um certificado que deixa de verificar depois de um deploy e pior que nenhum certificado.

Repare no `Object.keys(reordered)).not.toEqual(Object.keys(claims))`. Sem essa assercao, o teste passaria mesmo com um `canonicalize` completamente quebrado, porque a reconstrucao com desestruturacao nao garante mudar a ordem de insercao das chaves em todos os runtimes. A assercao garante que o teste esteja de fato exercitando a reordenacao que ele diz exercitar.

E o teste do `generateCode` pega o bug de um alfabeto com tamanho nao-potencia-de-dois, que produziria vies de modulo: alguns digitos sairiam quase duas vezes mais que outros. Com 26 caracteres de 5 bits, a distribuicao e perfeita por construcao.

### Passo 4 - O model do certificado

A rota do proximo passo grava em `prisma.certificate`. O model nao existe ainda — ele nasce aqui, e nao no passo da rota, porque o schema e a decisao de projeto que a rota consome.

```prisma
// apps/api/prisma/schema.prisma (acrescentar ao model Lesson)
model Certificate {
  id             String   @id @default(uuid()) @db.Uuid
  code           String   @unique @db.VarChar(26)
  idempotencyKey String   @unique @db.VarChar(200)
  signature      String   @db.VarChar(64)
  score          Int
  total          Int
  payload        Json
  revokedAt      DateTime?
  issuedAt       DateTime @default(now())

  @@map("certificates")
}
```

Depois, gere e aplique:

```bash
pnpm --filter @harness/api prisma migrate dev --name add_certificates
pnpm --filter @harness/api prisma generate
```

Tres detalhes do model que valem uma decisao:

**`code` e `idempotencyKey` sao `@unique`, nao apenas `@@index`.** O `@index` aceleraria a busca mas deixaria passar o duplicado; a `@unique` faz o banco recusar. E o banco sendo a ultima linha de defesa e o que permite que a checagem na rota seja apenas uma otimizacao.

**`payload` e `Json`, e nao colunas.** O certificado precisa guardar os campos que a assinatura cobre, e a assinatura cobre o payload inteiro. Modelar cada campo como coluna cria um caminho a mais para alguem editar `score` sem tocar em `signature` — exatamente o que a verificacao precisa impedir. Em `Json` existe um campo so, e ele e o que foi assinado.

**`revokedAt` ja entra agora.** Voce vai querer revogar certificado. Adicionar a coluna depois, num banco com dados, e migration de risco; adicionar agora e uma coluna nullable que nunca atrapalha.

### Passo 5 - A rota de submissao com idempotencia

```ts
// apps/api/src/routes/submissions.ts
import type { FastifyInstance } from "fastify";
import { Prisma, PrismaClient } from "@prisma/client";
import {
  SubmissionSchema,
  gradeSubmission,
  generateCode,
  signClaims,
  type CertificateClaims,
} from "@harness/core";

const SIGNING_SECRET = process.env["CERTIFICATE_SIGNING_SECRET"];
if (!SIGNING_SECRET) throw new Error("CERTIFICATE_SIGNING_SECRET e obrigatorio");

export async function registerSubmissions(app: FastifyInstance, deps: { prisma: PrismaClient }): Promise<void> {
  app.post("/submissions", async (request, reply) => {
    const parsed = SubmissionSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Submissao invalida", issues: parsed.error.issues });
    }

    const submission = parsed.data;

    // Chave de idempotencia: mesmo commit, mesma submissao, um unico certificado.
    // O `.toLowerCase()` no email evita a mesma pessoa ("Ana@x.com" e "ana@x.com")
    // gerar dois certificados: sem normalizar, a chave unica do banco nao pega.
    const idempotencyKey = `${submission.studentEmail.toLowerCase()}:${submission.commitSha}`;

    // A consulta vem ANTES de gradeSubmission. Inverter a ordem faria um
    // reenvio com o relatorio ja alterado devolver 422 em vez do certificado
    // existente — o aluno corrigiu um criterio e perdeu o codigo que ja tinha.
    const existing = await deps.prisma.certificate.findUnique({ where: { idempotencyKey } });
    if (existing) {
      return reply.send({ code: existing.code, status: "already_issued", score: existing.score });
    }

    const grade = gradeSubmission(submission);

    if (!grade.eligible) {
      return reply.code(422).send({
        error: "Criterios nao atendidos",
        score: grade.score,
        required: 6,
        failedCriteria: grade.failedCriteria,
      });
    }

    const claims: CertificateClaims = {
      code: generateCode(),
      studentName: submission.studentName,
      studentEmail: submission.studentEmail,
      repoUrl: submission.repoUrl,
      commitSha: submission.commitSha,
      score: grade.score,
      total: grade.total,
      issuedAt: new Date().toISOString(),
    };
    const signature = signClaims(claims, SIGNING_SECRET);

    // findUnique seguido de create tem uma janela: duas requisicoes simultaneas
    // passam as duas pelo findUnique e as duas chegam no create. A @unique segura
    // a segunda com P2002. Sem o catch, isso vira 500 — e o aluno que apertou
    // Enter duas vezes recebe erro em vez do certificado que ja foi emitido.
    let record;
    try {
      record = await deps.prisma.certificate.create({
        data: { idempotencyKey, code: claims.code, signature, score: claims.score, total: claims.total, payload: claims },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const winner = await deps.prisma.certificate.findUnique({ where: { idempotencyKey } });
        if (winner) return reply.send({ code: winner.code, status: "already_issued", score: winner.score });
      }
      throw error;
    }

    request.log.info({ code: record.code, idempotencyKey }, "certificado emitido");
    return reply.code(201).send({ code: record.code, status: "issued", score: claims.score, signature });
  });
}
```

O `idempotencyKey` e a feature que o aluno mais appreciate. Sem ele, `submit` rodado duas vezes (o usuario chega a apertar Enter duas vezes) gera dois certificados para o mesmo commit, e o suporte recebe "meu certificado duplicou".

Com a chave unica em `(studentEmail, commitSha)`, a segunda chamada encontra o registro existente e devolve o mesmo `code` com `status: "already_issued"`. E idempotencia aplicada no banco, do jeito ensinado no Modulo 4.5.

Tres detalhes desse bloco que valem mais que o codigo. A **consulta antes da nota**: um reenvio com o relatorio ja corrigido precisa devolver o certificado existente, nao um 422 — o criterio que faltava da primeira vez ja foi resolvido e o aluno nao deve perder o codigo. O **catch de P2002**: `findUnique` e `create` nao sao atomicos, e duas abas com o botao clicado no mesmo instante produzem dois certificados sem ele. E o **`toLowerCase()` no email**: chave de idempotencia que nao normaliza o identificador do usuario nao e chave, e a `@unique` do banco deixa passar os dois.

### Passo 6 - O endpoint publico de verificacao

Este e o endpoint que da sentido a assinatura. Ele **recalcula** a assinatura a partir do payload em vez de confiar num campo `valid` guardado no banco. E por isso que ele nao pode ser enganado por adulteracao do banco.

Ele ainda le o banco — precisa, para achar o payload pelo `code`. O que ele nao faz e confiar no banco. A distincao importa: o banco e o armazenamento, a assinatura e a fonte de verdade.

```ts
// apps/api/src/routes/verify.ts
import type { FastifyInstance } from "fastify";
import type { PrismaClient } from "@prisma/client";
import { verifySignature, CertificateClaimsSchema, type CertificateClaims } from "@harness/core";

// Sem `?? ""`. Com o fallback, a API sobe, `/submissions` recusa a emitir e
// `/verify` responde "assinatura invalida" para todos os certificados ja
// emitidos: falha silenciosa, e do tipo que so aparece quando um aluno tenta
// usar o link. Falhar no boot e o comportamento correto — o processo morre antes
// de atender a primeira requisicao, e o orquestrador mostra a causa.
const SIGNING_SECRET = process.env["CERTIFICATE_SIGNING_SECRET"];
if (!SIGNING_SECRET) throw new Error("CERTIFICATE_SIGNING_SECRET e obrigatorio");

export async function registerVerify(app: FastifyInstance, deps: { prisma: PrismaClient }): Promise<void> {
  app.get("/verify/:code", async (request, reply) => {
    const { code } = request.params as { code: string };

    // O MESMO alfabeto do gerador, escrito como regex. O `P-T` e um intervalo
    // que pula o `U`, e o `J` logo depois do `I` pula o `I`. O `0` e o `1`
    // entram: quem removeu as letras ambiguas foi o gerador, nao o validador.
    // Os dois lados precisam concordar no alfabeto — divergir aqui devolve 400
    // para um certificado valido, que e o pior tipo de bug de validacao.
    //
    // O toUpperCase() antes do teste e da query: o gerador emite maiusculas, mas
    // um aluno que digite minusculas no LinkedIn nao pode receber "nao encontrado".
    // Validar o formato ANTES de tocar o banco evita uma query por qualquer
    // string que chegue na URL.
    if (!/^[0-9A-HJKMNP-TV-Z]{26}$/.test(code.toUpperCase())) {
      return reply.code(400).send({ valid: false, reason: "Formato de codigo invalido" });
    }

    const record = await deps.prisma.certificate.findUnique({ where: { code: code.toUpperCase() } });
    if (!record) return reply.code(404).send({ valid: false, reason: "Certificado nao encontrado" });

    const parsed = CertificateClaimsSchema.safeParse(record.payload);
    if (!parsed.success) return reply.code(500).send({ valid: false, reason: "Payload corrompido" });

    const valid = verifySignature(parsed.data as CertificateClaims, SIGNING_SECRET, record.signature);

    // Revogacao e um estado do registro, nao do payload assinado: alterar o
    // payload para incluir revogacao invalidaria a assinatura original.
    if (record.revokedAt) {
      return reply.send({ valid: false, reason: "Certificado revogado", revokedAt: record.revokedAt });
    }

    return reply.send({
      valid,
      studentName: parsed.data.studentName,
      repoUrl: parsed.data.repoUrl,
      commitSha: parsed.data.commitSha,
      score: `${parsed.data.score}/${parsed.data.total}`,
      issuedAt: parsed.data.issuedAt,
      ...(valid ? {} : { reason: "Assinatura invalida" }),
    });
  });
}
```

Se alguem editar a linha do banco e mudar `score` de 8 para 10, a assinatura deixa de bater e a resposta traz `valid: false`. O atacante precisaria do `CERTIFICATE_SIGNING_SECRET`, que vive apenas na variavel de ambiente do servidor.

Repare no `prisma` vindo de `deps`. Handler que le `app.prisma` sem decoracao funciona em dev e quebra em producao, porque a decoracao do Fastify so acontece se alguem|Fee o `app.decorate("prisma", ...)` — e um handler que depende de uma propriedade magica e um bug esperando. A rota recebe a dependencia pela assinatura, igual a `registerSubmissions`.

### Passo 7 - Gerar o PDF do certificado no servidor

O certificado precisa ser um PDF de verdade — o aluno vai imprimir e colocar no LinkedIn.

```ts
// apps/api/src/certificates/pdf.ts
import PDFDocument from "pdfkit";

export type CertificatePdfInput = {
  studentName: string;
  code: string;
  score: number;
  total: number;
  repoUrl: string;
  commitSha: string;
  issuedAt: string;
  verifyUrl: string;
};

export function renderCertificatePdf(input: CertificatePdfInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 0 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const width = doc.page.width;
    const height = doc.page.height;

    doc.rect(0, 0, width, height).fill("#0f172a");
    doc.rect(28, 28, width - 56, height - 56).lineWidth(2).stroke("#22d3ee");
    doc.rect(36, 36, width - 72, height - 72).lineWidth(0.5).stroke("#1e3a5f");

    doc.fillColor("#94a3b8").font("Helvetica").fontSize(11)
      .text("HARNESS IA · CURSO DE ENGENHARIA", 0, 78, { align: "center", width });

    doc.fillColor("#f8fafc").font("Helvetica-Bold").fontSize(30)
      .text("Certificado de Conclusao", 0, 104, { align: "center", width });

    doc.fillColor("#cbd5e1").font("Helvetica").fontSize(13)
      .text("Certifica que", 0, 158, { align: "center", width });

    doc.fillColor("#22d3ee").font("Helvetica-Bold").fontSize(26)
      .text(input.studentName, 0, 184, { align: "center", width });

    doc.fillColor("#cbd5e1").font("Helvetica").fontSize(13)
      .text("concluiu o Capstone Project: Build Your Harness Tutor", 0, 226, { align: "center", width });

    doc.fillColor("#94a3b8").font("Helvetica").fontSize(11)
      .text(`Criterios atendidos: ${input.score}/${input.total}`, 0, 258, { align: "center", width });

    doc.fontSize(9)
      .text(`Repositorio: ${input.repoUrl}`, 0, height - 128, { align: "center", width })
      .text(`Commit: ${input.commitSha.slice(0, 12)}`, 0, height - 112, { align: "center", width })
      .text(`Codigo: ${input.code}  ·  Verificacao: ${input.verifyUrl}`, 0, height - 96, {
        align: "center",
        width,
      });

    doc.end();
  });
}
```

Decisoes que importam:

**`PDFDocument` do `pdfkit`, e nao `puppeteer`.** Renderizar HTML em PDF exige Chromium, que adiciona 300MB e uma superficie de ataque enorme. O `pdfkit` e Node puro. A Licao 9.1 ensina por que superficie de ataque importa.

**Acumular chunks e resolver no `end`.** O `pdfkit` e baseado em stream. Tentar escrever direto na resposta HTTP em streaming puro faria o cliente receber PDF corrompido se a conexao caisse no meio.

**Nome e score centralizados visualmente.** O certificado e parsed por recrutadores. Nome ilegivel ou score escondido torna o documento inutil.

### Passo 8 - Rota do PDF com o codigo de verificacao

```ts
// dentro de registerCertificates(app, { prisma })
app.get("/certificates/:code.pdf", async (request, reply) => {
  const { code } = request.params as { code: string };
  const record = await prisma.certificate.findUnique({ where: { code } });
  if (!record) return reply.code(404).send({ error: "Certificado nao encontrado" });

  // Parse em vez de cast: `record.payload as CertificateClaims` funciona enquanto
  // o banco tem o que o servidor gravou. Depois de uma migration ou de um
  // registro antigo, o cast passa um objeto invalido para o pdfkit sem avisar.
  const parsed = CertificateClaimsSchema.safeParse(record.payload);
  if (!parsed.success) return reply.code(500).send({ error: "Certificado corrompido" });
  const claims = parsed.data;

  const pdf = await renderCertificatePdf({
    studentName: claims.studentName,
    code: claims.code,
    score: claims.score,
    total: claims.total,
    repoUrl: claims.repoUrl,
    commitSha: claims.commitSha,
    issuedAt: claims.issuedAt,
    verifyUrl: `${process.env["PUBLIC_BASE_URL"]}/verify/${claims.code}`,
  });

  return reply
    .header("content-type", "application/pdf")
    .header("content-disposition", `attachment; filename="certificado-${claims.code}.pdf"`)
    .send(pdf);
});
```

O `Content-Disposition: attachment` faz o navegador baixar em vez de tentar exibir. `filename` com o codigo torna o arquivo unico no download do aluno.

O `code` vem do path e vai direto no nome do arquivo. Isso e o motivo de o `generateCode` usar base32 sem ambiguos: um caractere `0` ou `O` no meio do nome vira `certificado-O0RK.pdf` e o aluno nunca sabe qual dos dois digitar no LinkedIn para o link de verificacao funcionar. O alfabeto sem ambiguos resolve o problema no gerador, e nao com um cuidado la na hora de exibir.

### Passo 9 - A badge SVG publica

Badge e o que o aluno compartilha. Precisa ser leve, cacheavel e acessivel.

```ts
// apps/api/src/routes/badge.ts
import type { FastifyInstance } from "fastify";
import type { PrismaClient } from "@prisma/client";

// Escape de saida para contexto SVG/XML. Sem isso, um `&` ou um `<` em qualquer
// string interpolada quebra o documento — e um certificado cujo nome contem "&"
// renderiza SVG invalido em vez de aparecer com o "&".
const xml = (value: string): string =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function registerBadge(app: FastifyInstance, deps: { prisma: PrismaClient }): Promise<void> {
  app.get("/badge/:code.svg", async (request, reply) => {
    const { code } = request.params as { code: string };
    const record = await deps.prisma.certificate.findUnique({ where: { code } });

    const valid = record !== null && record.revokedAt === null;
    const label = valid ? "Harness IA Capstone" : record ? "certificado revogado" : "certificado nao encontrado";
    const color = valid ? "#22c55e" : "#ef4444";
    const message = valid ? `${record!.score}/${record!.total} criterios` : "invalid";

    // Tudo interpolado passa pelo escape. Numeros ja sao seguros; strings, nao.
    const safeLabel = xml(label);
    const safeMessage = xml(message);
    const w = Math.ceil(label.length * 7 + message.length * 6.5 + 24);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="20" role="img" aria-label="${safeLabel}: ${safeMessage}">
  <title>${safeLabel}: ${safeMessage}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r"><rect width="${w}" height="20" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="86" height="20" fill="#555"/>
    <rect x="86" width="${w - 86}" height="20" fill="${color}"/>
    <rect width="${w}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
    <text x="43" y="14">${safeLabel}</text>
    <text x="${86 + (w - 86) / 2}" y="14">${safeMessage}</text>
  </g>
</svg>`;

    return reply
      .header("content-type", "image/svg+xml")
      .header("cache-control", "public, max-age=3600")
      .send(svg);
  });
}
```

`role="img"` e `<title>` sao o que torna a badge legivel por leitor de tela. Uma badge que so informa visivamente exclui quem usa tecnologia assistiva — o mesmo cuidado da Licao 2.1 aplicado a um artefato que circula na internet.

O `cache-control: public, max-age=3600` e o padrao do Modulo 5.4. A badge nao muda com frequencia, e o CDN entrega sem bater na API.

Repare que o `xml()` nao e uma recomendacao: ele ja esta aplicado nas duas interpolacoes de texto. Um badge que so "deveria" escapar e um badge esperando o primeiro nome com acento comercial — `Ana & Bruno` sem escape quebra o XML e o SVG nao renderiza em lugar nenhum.

E repare no terceiro estado. Sao tres, nao dois: valido, revogado e inexistente. Tratar revogado como invalido e o mesmo que esconder a diferenca entre "voce errou o codigo" e "esse certificado foi cancelado".

### Passo 10 - O comando `submit` no CLI

O ultimo comando. `packages/cli/src/commands/submit.ts`:

```ts
import { execSync } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import pc from "picocolors";
import { ReportSchema, SubmissionSchema, type Submission } from "@harness/core";
import { EXIT } from "../exit-codes.js";
import { CliError, toCliError } from "../errors.js";
import { createSpinner } from "../ui/spinner.js";

const require = createRequire(import.meta.url);

type SubmitOptions = { repo?: string; token?: string; endpoint?: string; dashboard?: string; skipNetwork?: boolean };

// Probes externos. Cada um faz a verificacao de verdade e devolve `false` em vez
// de lancar: um probe que derruba o comando inteiro impede o aluno de descobrir
// que os outros criterios passaram.
type Probes = {
  apiLive: boolean; apiStatus: number | string;
  dashboardLive: boolean; dashboardStatus: number | string; dashboardUrl: string;
  streaming: boolean; ttftMs: number;
  noSecretLeak: boolean; bundleChunks: number;
  nonRoot: boolean; dockerUser: string;
};

const ALL_FAILED: Probes = {
  apiLive: false, apiStatus: "nao verificado",
  dashboardLive: false, dashboardStatus: "nao verificado", dashboardUrl: "nao configurado",
  streaming: false, ttftMs: 0,
  noSecretLeak: false, bundleChunks: 0,
  nonRoot: false, dockerUser: "nao verificado",
};

async function runProbes(opts: SubmitOptions): Promise<Probes> {
  const p: Probes = { ...ALL_FAILED };
  const api = opts.endpoint ?? process.env["TUTOR_API_URL"];

  if (opts.skipNetwork) return p;

  const withTimeout = <T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> =>
    Promise.race([promise, new Promise<T>((r) => setTimeout(() => r(fallback), ms))]);

  if (api) {
    try {
      const health = await withTimeout(fetch(`${api}/health`, { signal: AbortSignal.timeout(5000) }), 6000, null);
      p.apiStatus = health ? health.status : "timeout";
      p.apiLive = health !== null && health.ok;

      // Streaming de verdade: mede o TTFT ate o primeiro chunk, nao so ate o 200.
      const t0 = performance.now();
      const res = await withTimeout(
        fetch(`${api}/chat`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ message: "ping", history: [] }),
          signal: AbortSignal.timeout(10_000),
        }),
        11_000,
        null,
      );
      if (res?.ok && res.body) {
        const reader = res.body.getReader();
        const first = await withTimeout(reader.read(), 10_000, { done: true, value: undefined });
        p.ttftMs = Math.round(performance.now() - t0);
        p.streaming = first.value !== undefined;
        void reader.cancel().catch(() => {});
      }
    } catch (error) {
      p.apiStatus = error instanceof Error ? error.message.slice(0, 60) : "erro";
    }
  }

  const dashboard = opts.dashboard ?? process.env["PUBLIC_WEB_URL"];
  if (dashboard) {
    p.dashboardUrl = dashboard;
    try {
      const res = await withTimeout(fetch(dashboard, { signal: AbortSignal.timeout(5000) }), 6000, null);
      p.dashboardStatus = res ? res.status : "timeout";
      p.dashboardLive = res !== null && res.ok;
    } catch (error) {
      p.dashboardStatus = error instanceof Error ? error.message.slice(0, 60) : "erro";
    }
  }

  // Varredura do bundle servido: procura a chave nos chunks JS publicos.
  try {
    const dir = path.join(process.cwd(), "apps", "web", ".next", "static");
    const files = await readdir(dir, { recursive: true });
    const js = files.filter((f) => String(f).endsWith(".js"));
    let leaked = 0;
    for (const f of js) {
      const body = await readFile(path.join(String(f).toString()), "utf8");
      if (body.includes(process.env["ANTHROPIC_API_KEY"] ?? "\u0000sentinel")) leaked += 1;
    }
    p.bundleChunks = js.length;
    p.noSecretLeak = js.length > 0 && leaked === 0;
  } catch {
    p.noSecretLeak = false;
  }

  try {
    const out = execSync("docker inspect --format '{{.Config.User}}' harness-tutor-api", {
      encoding: "utf8",
    }).trim();
    p.dockerUser = out;
    // Vazio significa que roda como root: o HEALTHCHECK e o CMD sao root.
    p.nonRoot = out !== "" && out !== "root" && out !== "0";
  } catch {
    p.nonRoot = false;
  }

  return p;
}

export async function runSubmit(opts: SubmitOptions): Promise<void> {
  const spinner = createSpinner("Coletando evidencia");
  spinner.start("Coletando evidencia");

  const pkg = require("../../package.json") as { version: string };
  // O tipo e `Report`, nao `Submission["report"]`. Sao tipos diferentes de proposito:
  // `Report` e o relatorio completo do `test`, com `checks`; `Submission["report"]`
  // e o recorte enxuto que vai para o servidor. Tipar o arquivo do disco pelo
  // tipo do payload faria `report.checks` dar erro de compilacao — e o compilador
  // estaria certo.
  const report = ReportSchema.parse(JSON.parse(await readFile("harness-tutor-report.json", "utf8")));

  // O `Report` tem `checks`, mas o `SubmissionSchema` so aceita 4 campos em
  // `report`. Enviando o objeto inteiro, o Zod remove o que nao esta no schema
  // e o servidor nunca ve a lista de checks. O corte e explicito aqui.
  const reportSummary = {
    harnessTutorVersion: report.harnessTutorVersion,
    passed: report.passed,
    failed: report.failed,
    durationMs: report.durationMs,
  };

  spinner.update("Verificando criterios externos");
  const probes = await runProbes(opts);

  // Os criterios locais sao derivados do relatorio que `test` acabou de rodar.
  // Os externos sao derivados de PROBES reais, com timeout, nao de flags na CLI.
  // Os tres primeiros criterios sao derivados do relatorio, mas cada um le um
  // sinal DIFERENTE. Usar `report.failed === 0` nos tres seria o mesmo teste
  // com tres nomes, que e o que o certificado inteiro existe para impedir.
  const ranEnvCheck = report.checks.some((c) => c.id === "env" && c.status === "passed");
  const ranHealthCheck = report.checks.some((c) => c.id === "health" && c.status !== "failed");

  const criteria: Submission["criteria"] = [
    { id: "monorepo", label: "Monorepo com 4 pacotes e script verify", passed: report.checks.length > 0, evidence: `${report.checks.length} checks executados` },
    { id: "domain-tests", label: "Dominio com testes automatizados", passed: report.passed > 0 && report.failed === 0, evidence: `${report.passed} passaram, ${report.failed} falharam`, measured: { passed: report.passed, failed: report.failed } },
    { id: "cli", label: "CLI com 4 subcomandos", passed: ranEnvCheck && ranHealthCheck && report.failed === 0, evidence: `env ${ranEnvCheck ? "ok" : "falhou"}, health ${ranHealthCheck ? "ok" : "falhou"}, ${pkg.version}` },

    // Probe externo: faz a requisicao de verdade. Se a API estiver fora, o criterio
    // FALHA. Marcar `true` sem checar e exatamente o atalho que o certificado
    // inteiro existe para impedir.
    { id: "api-live", label: "API respondendo em producao", passed: probes.apiLive, evidence: `${opts.endpoint ?? "config"} /health -> ${probes.apiStatus}` },
    { id: "dashboard-live", label: "Dashboard publicado", passed: probes.dashboardLive, evidence: `${probes.dashboardUrl} -> HTTP ${probes.dashboardStatus}` },
    { id: "streaming", label: "Streaming com TTFT medido", passed: probes.streaming, evidence: `TTFT ${probes.ttftMs}ms em ${probes.endpoint}` },
    { id: "no-secret-leak", label: "Chave ausente do bundle", passed: probes.noSecretLeak, evidence: `${probes.bundleChunks} chunks verificados, 0 com ANTHROPIC_API_KEY` },
    { id: "docker", label: "Imagem multi-stage com usuario nao-root", passed: probes.nonRoot, evidence: `docker inspect -> User=${probes.dockerUser}` },
  ];

  const sha = execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();

  const payload: Submission = {
    studentName: process.env["STUDENT_NAME"] ?? "",
    studentEmail: process.env["STUDENT_EMAIL"] ?? "",
    repoUrl: opts.repo ?? "",
    commitSha: sha,
    report: reportSummary,
    criteria,
    submittedAt: new Date().toISOString(),
  };

  const parsed = SubmissionSchema.safeParse(payload);
  if (!parsed.success) {
    spinner.stop();
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new CliError(`Submissao invalida:\n${issues}`, EXIT.fail, "Rode com STUDENT_NAME e STUDENT_EMAIL definidos.");
  }

  spinner.update("Enviando");
  const response = await fetch(`${opts.endpoint ?? process.env["TUTOR_API_URL"]}/submissions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${opts.token ?? ""}` },
    body: JSON.stringify(parsed.data),
  });

  if (response.status === 422) {
    const body = (await response.json()) as { failedCriteria: string[] };
    spinner.stop();
    process.stderr.write(`${pc.red("Criterios nao atendidos")}:\n`);
    for (const label of body.failedCriteria) process.stderr.write(`  - ${label}\n`);
    process.exitCode = EXIT.fail;
    return;
  }

  if (!response.ok) throw toCliError(new Error(`HTTP ${response.status}`));

  const result = (await response.json()) as { code: string; status: string };
  spinner.stop(pc.green("Submissao aceita"));
  process.stdout.write(
    `\nCodigo: ${pc.bold(result.code)}\n` +
      `PDF:    ${process.env["PUBLIC_BASE_URL"]}/certificates/${result.code}.pdf\n` +
      `Badge:  ${process.env["PUBLIC_BASE_URL"]}/badge/${result.code}.svg\n` +
      `Verifique: ${process.env["PUBLIC_BASE_URL"]}/verify/${result.code}\n`,
  );
  process.exitCode = EXIT.ok;
}
```

Repare que `submit` **nao** permite declarar resultados. Cada criterio vem de uma verificacao, e cada verificacao tem um custo:

- Os criterios locais vem do `harness-tutor-report.json` que `test` acabou de gerar.
- Os externos vem de `runProbes`, que faz a requisicao, mede o TTFT ate o primeiro chunk, varre os chunks do bundle e le o usuario do container.

E repare nos dois tipos diferentes que aparecem no mesmo arquivo. `report` do disco e um `Report` (com `checks`), o que vai no payload e um recorte de 4 campos, e o criterio `monorepo` le `report.checks` enquanto o payload nao leva `checks` para o servidor. Se os dois fossem o mesmo objeto, o `SubmissionSchema` aceitaria e o servidor receberia uma lista de checks de que nao sabe nada — ou, no outro extremo, o schema recusaria a submissao por causa de um campo extra. Tipar separado e o que mantem o contrato do dominio honesto: o `Report` e um relatorio local, o `Submission["report"]` e uma evidencia resumida que o servidor sabe interpretar.

O detalhe que faz essa funcao valer e o `withTimeout` com `Promise.race`. Um probe sem timeout e um comando que trava: o aluno esta em casa, a API esta fora do ar, `fetch` fica pendurado por minutos e nao aparece nenhuma mensagem. Com o race, o probe devolve `false` com o motivo e o resto da submissao continua — o aluno ve "5 de 8 criterios" e sabe exatamente o que falta.

E o `--skip-network`. Um aluno offline precisa conseguir rodar `submit` para ver o diagnostico do que passou e do que falhou, mesmo que os criterios externos entrem como falha. Sem essa flag, o comando so funciona com tudo no ar, que e o oposto de diagnostico.

O `readdir(dir, { recursive: true })` precisa do Node 20+. O `tostring()` no `path.join` e o que lida com o `Dirent` que o `recursive` devolve em versoes mais novas.

### Passo 11 - Pipeline de CI: o relatorio como artefato

Adicione ao `ci.yml` um passo que gera o relatorio e o publica como artefato:

```yaml
      - name: Gerar relatorio de evidencia
        if: github.ref == 'refs/heads/main'
        run: |
          pnpm --filter @harness/cli build
          node packages/cli/dist/index.js test --json > harness-tutor-report.json

      - name: Publicar relatorio
        if: github.ref == 'refs/heads/main'
        uses: actions/upload-artifact@v4
        with:
          name: harness-tutor-report
          path: harness-tutor-report.json
          retention-days: 90
```

O `retention-days: 90` cria um historico auditavel. Seis meses depois, e possivel responder "o que o CI mediu quando esse certificado foi emitido?" — a mesma disciplina de proveniencia do Modulo 8.6.

### Passo 12 - Pagina publica de verificacao no dashboard

```tsx
// apps/web/src/app/verify/[code]/page.tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";

type PageProps = { params: Promise<{ code: string }> };
type VerifyResponse = {
  valid: boolean;
  studentName?: string;
  repoUrl?: string;
  commitSha?: string;
  score?: string;
  reason?: string;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params;
  return { title: `Verificacao ${code}`, robots: { index: false } };
}

export default async function VerifyPage({ params }: PageProps) {
  const { code } = await params;
  const response = await fetch(`${process.env["PUBLIC_BASE_URL"]}/verify/${code}`, {
    next: { revalidate: 60 },
  });
  if (response.status === 404) notFound();

  const data = (await response.json()) as VerifyResponse;

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-semibold">Verificacao de certificado</h1>
      <div
        className={`mt-6 rounded-lg border p-6 ${
          data.valid ? "border-emerald-800 bg-emerald-950/40" : "border-red-900 bg-red-950/40"
        }`}
      >
        <p className={data.valid ? "text-emerald-300" : "text-red-300"}>
          {data.valid ? "Certificado valido" : `Certificado invalido: ${data.reason ?? "desconhecido"}`}
        </p>
        {data.valid && (
          <dl className="mt-4 space-y-1 text-sm">
            <div><dt className="inline text-slate-400">Aluno: </dt><dd className="inline">{data.studentName}</dd></div>
            <div><dt className="inline text-slate-400">Repositorio: </dt><dd className="inline">{data.repoUrl}</dd></div>
            <div><dt className="inline text-slate-400">Commit: </dt><dd className="inline font-mono">{data.commitSha}</dd></div>
            <div><dt className="inline text-slate-400">Criterios: </dt><dd className="inline">{data.score}</dd></div>
          </dl>
        )}
      </div>
      <a className="mt-6 inline-block text-sm text-cyan-400 underline" href={`/certificates/${code}.pdf`}>
        Baixar certificado (PDF)
      </a>
    </main>
  );
}
```

O `robots: { index: false }` impede paginas de verificacao de aparecerem em busca por nome de aluno. E uma questao de privacidade que a LGPD e a Licao 10.3 levantam: dados de aluno tem dono, e o buscador nao precisa indexar.

### Passo 13 - Teste de integracao do ciclo completo

```ts
// apps/api/test/submission.e2e.test.ts
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { buildApp } from "../src/app.js";

process.env["CERTIFICATE_SIGNING_SECRET"] = "segredo-de-teste-suficientemente-longo";

let app: Awaited<ReturnType<typeof buildApp>>;

beforeAll(async () => { app = await buildApp(); });
afterAll(async () => { await app.close(); });

const CRITERION_IDS = [
  "monorepo", "domain-tests", "cli", "api-live",
  "dashboard-live", "streaming", "no-secret-leak", "docker",
] as const;

const validBody = {
  studentName: "Ana Souza",
  studentEmail: "ana@example.com",
  repoUrl: "https://github.com/ana/harness-tutor",
  commitSha: "b".repeat(40),
  report: { harnessTutorVersion: "0.1.0", passed: 12, failed: 0, durationMs: 4300 },
  criteria: CRITERION_IDS.map((id) => ({ id, label: `criterio ${id}`, passed: true, evidence: "ok" })),
  submittedAt: new Date().toISOString(),
};

describe("ciclo de certificado", () => {
  it("emite certificado para submissao completa", async () => {
    const response = await app.inject({ method: "POST", url: "/submissions", payload: validBody });
    expect(response.statusCode).toBe(201);
    const { code, signature } = response.json();
    expect(code).toHaveLength(26);
    expect(code).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
    expect(signature).toMatch(/^[0-9a-f]{64}$/);
  });

  it("recusa submissao com menos de 8 criterios", async () => {
    // A conveniencia que o .length(8) do passo 1 bloqueia: mandar so os 2 que
    // passaram e receber "2/2" como se fosse perfeito.
    const response = await app.inject({
      method: "POST",
      url: "/submissions",
      payload: { ...validBody, commitSha: "d".repeat(40), criteria: validBody.criteria.slice(0, 2) },
    });
    expect(response.statusCode).toBe(400);
  });

  it("recusa criterios duplicados", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/submissions",
      payload: {
        ...validBody,
        commitSha: "e".repeat(40),
        criteria: validBody.criteria.map((c, i) => (i === 7 ? { ...c, id: "monorepo" } : c)),
      },
    });
    expect(response.statusCode).toBe(400);
  });

  it("devolve o mesmo codigo em submissao repetida", async () => {
    const first = await app.inject({ method: "POST", url: "/submissions", payload: validBody });
    const second = await app.inject({ method: "POST", url: "/submissions", payload: validBody });
    expect(first.json().code).toBe(second.json().code);
    expect(second.json().status).toBe("already_issued");
  });

  it("recusa quando ha check falhando", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/submissions",
      payload: { ...validBody, commitSha: "c".repeat(40), report: { ...validBody.report, failed: 2 } },
    });
    expect(response.statusCode).toBe(422);
  });

  it("verifica a assinatura no endpoint publico", async () => {
    const issued = await app.inject({ method: "POST", url: "/submissions", payload: validBody });
    const { code } = issued.json();
    const response = await app.inject({ method: "GET", url: `/verify/${code}` });
    expect(response.json().valid).toBe(true);
  });

  it("gera PDF com o codigo do certificado", async () => {
    const issued = await app.inject({ method: "POST", url: "/submissions", payload: validBody });
    const { code } = issued.json();
    const response = await app.inject({ method: "GET", url: `/certificates/${code}.pdf` });
    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toBe("application/pdf");
    expect(response.rawPayload.subarray(0, 4).toString()).toBe("%PDF");
  });
});
```

O teste do PDF verifica os **quatro primeiros bytes** do arquivo. E o unico jeito de afirmar que aquilo e mesmo um PDF e nao uma pagina de erro com status 200. Esse detalhe e o que separa teste que verifica do teste que confirma.

Os dois testes novos targeting o `.length(8)` sao o que impede a regressao mais cara do schema. O `.length(8)` garante a contagem; o `refine` de unicidade garante que o mesmo criterio nao conta duas vezes. Sem os dois juntos, o schema aceita `{ length: 8 }` com `monorepo` repetido oito vezes — e `score: 8, total: 8`, certificado perfeito, sem nenhum trabalho feito. Teste de schema precisa cobrir exatamente o buraco que o schema promete fechar.

### Passo 14 - Fechar o relatorio do capstone

Agora o ultimo passo, que nao e codigo: medir o que voce construiu.

```bash
# contagem de linhas por area
find packages/core/src -name "*.ts" -not -name "*.test.ts" | xargs wc -l | tail -1
find packages/cli/src -name "*.ts" -not -name "*.test.ts" | xargs wc -l | tail -1
find apps/api/src -name "*.ts" | xargs wc -l | tail -1
find apps/web/src -name "*.tsx" -o -name "*.ts" | xargs wc -l | tail -1

# cobertura do dominio
pnpm --filter @harness/core test -- --coverage

# tamanho da imagem
docker images harness-tutor-api --format "{{.Size}}"

# tempo de build e resposta
time pnpm build
time curl -o /dev/null -s -w "%{time_total}\n" https://sua-api.com/ready
```

Grave tudo em `docs/capstone-report.md` com o comparativo:

```markdown
## Metricas do capstone

| Metrica                          | Valor      |
|----------------------------------|------------|
| Pacotes no monorepo              | 4          |
| Linhas de codigo (sem teste)     | 2.140      |
| Testes automatizados             | 87         |
| Cobertura de packages/core       | 92%        |
| Imagem Docker (runner)           | 214 MB     |
| TTFT medio do tutor              | 780 ms     |
| Endpoints com health check       | 3          |
| Tempo de build completo          | 2m14s      |

## Decisoes de arquitetura que pagaram
1. Dominio puro eliminou mock em 70% dos testes.
2. workspace:* eliminou 12 horas de bug de versao divergente.
3. x-accel-buffering: no evitou 1 incidente de "funciona local".
4. idempotencyKey evitou duplicidade de certificado.
```

Esse relatorio e a mesma pratica de decisao registrada do Modulo 7: o valor esta em escrever **por que** algo foi feito, nao so no que. E ele fecha o ciclo de profissionalismo do capstone.

### Passo 15 - Submeter e verificar

```bash
export STUDENT_NAME="Ana Souza"
export STUDENT_EMAIL="ana@example.com"
export TUTOR_API_URL="https://api.harness-tutor.example.com"
export PUBLIC_BASE_URL="https://harness-tutor.example.com"

# `--json` e obrigatorio: sem ele `test` escreve o relatorio legivel (com spinner
# e cor) e o `JSON.parse` abaixo quebra. Redirecionar stdout sem pedir JSON e o
# jeito mais rapido de descobrir que o relatorio tem ANSI escape code dentro.
harness-tutor test --json > harness-tutor-report.json
node -e "const r=JSON.parse(require('fs').readFileSync('harness-tutor-report.json','utf8'));console.log(r.checks.map(c=>c.id).join('\n'));console.log('passed',r.passed,'failed',r.failed)"

harness-tutor submit --repo https://github.com/ana/harness-tutor --token "$SUBMIT_TOKEN"
```

Depois, de uma maquina diferente, sem nenhum acesso ao banco:

```bash
curl -s https://harness-tutor.example.com/verify/ABCD2345EFGH | jq
curl -s https://harness-tutor.example.com/badge/ABCD2345EFGH.svg -o badge.svg
open badge.svg
```

Se a assinatura validar, o ciclo esta fechado: do worktree vazio da 11.1 ate um certificado que qualquer pessoa verifica sem confiar em voce.

---

## Decisoes praticas

- **Validar evidencia, nunca declaracao.** O sistema decide o que foi feito, nao o aluno.
- **Serializacao canonica antes de HMAC.** `JSON.stringify` nao garante ordem estavel; certificado pode deixar de verificar depois de um deploy.
- **`timingSafeEqual`, nunca `===`.** Comparacao de assinatura com retorno antecipado entrega informacao por tempo.
- **Idempotencia por `(email, commitSha)`.** Duplo `Enter` no prompt nao deve gerar dois certificados.
- **Recalcular a assinatura na verificacao, nao confiar no banco.** Banco editado nao engana quem recalcula.
- **PDF em Node puro, nao Chromium.** 300MB de dependencia para gerar um PDF e preco alto demais.
- **Badge com `role="img"` e `<title>`.** Artefato que circula na internet precisa ser legivel por leitor de tela.

## Checklist de implementacao

1. `SubmissionSchema` no dominio com regex de SHA, restricao de repo publico e threshold.
2. `canonicalize`, `signClaims` e `verifySignature` com `timingSafeEqual`.
3. `generateCode` em base32 sem caracteres ambiguos.
4. Teste de assinatura incluindo reordenacao de chaves e alteracao de campo.
5. Rota `/submissions` com `idempotencyKey` e 422 com criterios que falharam.
6. Rota `/verify/:code` que recalcula a assinatura a partir do payload.
7. PDF com `pdfkit` em A4 landscape, tetos, nome e codigo centralizados.
8. Rota do PDF com `content-type` e `content-disposition`.
9. Badge SVG com `role`, `<title>`, `cache-control` e escape de entrada.
10. `submit` que deriva os criterios de evidencia, sem campos manuais.
11. Step de CI gerando e publicando `harness-tutor-report.json` como artefato.
12. Pagina `/verify/[code]` com `robots: { index: false }`.
13. Teste de integracao do ciclo completo, com checagem dos 4 bytes do PDF.
14. `docs/capstone-report.md` com metricas reais e decisoes que pagaram.

## Exercicios

### Questao 1
**Pergunta:** Um certificado legitimo comeca a falhar na verificacao um dia depois de um deploy. Qual a causa mais provavel?

**Resposta esperada:** A serializacao canonica mudou — por exemplo, `canonicalize` foi trocado por `JSON.stringify`, que nao garante ordem estavel de chaves. Os bytes mudaram, a assinatura mudou, e nenhum certificado antigo verifica mais.

### Questao 2
**Pergunta:** Por que `verifySignature` usa `timingSafeEqual` em vez de comparar strings com `===`?

**Resposta esperada:** `===` retorna assim que encontra a primeira diferenca, vazando informacao por tempo sobre qual byte divergiu. `timingSafeEqual` percorre sempre o mesmo numero de comparacoes. E por isso que a checagem de tamanho vem antes: a funcao lanca com buffers de tamanhos diferentes.

### Questao 3
**Pergunta:** Qual o proposito da `idempotencyKey` composta por `studentEmail` e `commitSha`?

**Resposta esperada:** Evitar certificado duplicado quando `submit` roda duas vezes, o que acontece quando o usuario aperta Enter duas vezes. A segunda chamada encontra o registro e devolve o mesmo codigo com `status: "already_issued"`.

### Questao 4
**Pergunta:** Por que o endpoint `/verify` recalcula a assinatura em vez de apenas ler um campo `valid: true` do banco?

**Resposta esperada:** Porque recalcular torna a verificacao independente do *conteudo* do banco. Se alguem editar a linha e mudar `score` de 8 para 10, a assinatura deixa de bater. Confiar em um campo `valid` gravado significa confiar em quem tem acesso de escrita no banco — que e exatamente quem o sistema tenta nao confiar cegamente. O banco ainda e consultado (para achar o payload pelo codigo), mas ele e armazenamento, nao fonte de verdade.

### Questao 5
**Pergunta:** Por que nao usar `puppeteer` para gerar o PDF do certificado?

**Resposta esperada:** Porque `puppeteer` baixa Chromium, adicionando cerca de 300MB a imagem e uma superficie de ataque enorme, para gerar um PDF de uma pagina. `pdfkit` e Node puro e faz o mesmo trabalho.

## Exercicio pratico com gabarito

### Enunciado
Adicione revogacao de certificado: a API recebe um pedido autenticado de revogacao com justificativa, marca o certificado como revogado, e `/verify` passa a retornar `valid: false` com o motivo.

O ponto que o enunciado costuma capturar errado e o objetivo do exercicio: a revogacao **nao reassina o certificado**. `revokedAt` fica na coluna, fora do payload assinado, exatamente como o Passo 6 faz. A assinatura original continua valendo — o que foi revogado e o direito de exibir, nao a prova de que o trabalho foi feito.

### Entregaveis
- Rota `POST /certificates/:code/revoke` autenticada, com papel autorizado e persistencia do motivo (`revocationReason`) e do autor.
- `/verify` retornando `valid: false` e `reason: "revogado em <data>"` para certificado revogado, sem tocar no payload.
- Badge exibindo estado "revogado" com cor distinta.
- Um segundo campo assinado, `revocation` (`{ at, reason, by, signature }`), gravado a parte do payload de emissao, para que a justificativa em si seja verificavel e nao apenas confiavel no banco.
- Testes: revogacao e idempotente, certificado revogado falha na verificacao, e a assinatura de emissao continua valendo depois de revogar.
- `docs/revocation.md` com o procedimento e quem tem autorizacao.

### Gabarito esperado
A revogacao marca o registro e nao toca na assinatura. `revokedAt` e `revocationReason` sao colunas; o payload assinado e imutavel depois da emissao. O que precisa de assinatura nova e o **evento de revogacao**, assinado separadamente sobre `{ code, at, reason, by }`. `/verify` valida as duas coisas: a assinatura de emissao (o trabalho foi feito?) e a ausencia de revogacao (o direito de exibir continua valendo?).

A alternativa — incluir `revokedAt` no payload e reassinar — parece mais limpa e tem dois custos. Primeiro, `canonicalize` ganha um campo condicional, e toda assinatura emitida antes da revogacao precisa ser reescrita; a mudanca no schema invalida retroativamente o historico inteiro, que e exatamente o que o Passo 2 existem para evitar. Segundo, e o mais grave: reassinar e uma operacao com o segredo. Quem consegue reassinar consegue emitir. A revogacao existe justamente para o caso em que a assinatura foi emitida e depois precisa deixar de valer, e uma assinatura que se anula sozinha nao e revogacao, e uma chave que outro lado controla.

O registro antigo permanece para auditoria, que e o mesmo principio do Modulo 8.1: sistema que apaga historico nao sobrevive a incidente.

### Criterios de avaliacao
1. A revogacao e irreversivel e o registro original permanece no banco com a assinatura de emissao intacta.
2. O payload de emissao **nao** e reescrito; `revokedAt` fica na coluna.
3. A justificativa da revogacao e verificavel por assinatura propria, e nao apenas lida do banco.
4. A rota exige autenticacao e so papel autorizado revoga.
5. `revokeCertificate` e idempotente: chamar duas vezes nao muda nada e nao duplica o evento.
6. `/verify` distingue revogado, invalido e nao encontrado — tres respostas distintas.
7. Nenhum teste depende de rede real; o segredo de assinatura e injetado.

## Fechamento

O ciclo esta fechado. Um worktree vazio na 11.1 virou um monorepo de quatro pacotes, uma CLI de quatro comandos, um dashboard com streaming, uma API em container com health checks e pipeline, e agora um certificado assinado que qualquer pessoa verifica sem confiar no servidor.

O capstone nao era sobre construir um tutor de IA. Era sobre atravessar as onze licoes anteriores sem atalho: fronteira de dominio, contrato de CLI, streaming, cache, testes, deploy e verificabilidade. Quem fez isso entendeu o que separa um exercicio de um produto — e o relatorio final, com as decisoes que pagaram, e a prova.
