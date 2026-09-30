import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type LessonWithModule = {
  id: number;
  title: string;
  order: number;
  content: string | null;
  module: {
    title: string;
    order: number;
  };
};

type LessonContext = {
  title: string;
  moduleTitle: string;
  focus: string;
  concepts: string[];
};

const FALLBACK_CONCEPTS = [
  'modelo mental do problema',
  'responsabilidades e limites',
  'criterios de qualidade',
];

const ENHANCEMENT_MARKER = '<!-- enhanced-lessons-with-examples:v3 -->';

function cleanText(value: string | undefined): string {
  return (value ?? '')
    .replace(/\r/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^["'`]+|["'`]+$/g, '')
    .trim();
}

function sentenceCase(value: string): string {
  const cleaned = cleanText(value);
  return cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : cleaned;
}

function stripHeading(value: string): string {
  return cleanText(value.replace(/^#+\s*/, '').replace(/^\*\*|\*\*$/g, ''));
}

function extractTitle(content: string, fallbackTitle: string): string {
  const titleLine = content
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.startsWith('# '));

  return titleLine ? stripHeading(titleLine) : fallbackTitle;
}

function extractSection(content: string, heading: string): string {
  const pattern = new RegExp(
    `##\\s+${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+([\\s\\S]*?)(?=\\n##\\s|$)`,
    'i'
  );
  return cleanText(content.match(pattern)?.[1]);
}

function extractFocus(content: string, title: string): string {
  const context = extractSection(content, 'Contexto');
  if (context) {
    const firstSentence = context.split(/(?<=[.!?])\s+/)[0];
    return cleanText(
      firstSentence
        .replace(/^Esta aula organiza\s+/i, '')
        .replace(/^Esta aula\s+/i, '')
    );
  }

  const detailedMatch = content.match(/e uma aula sobre ([^.]+)\./i);
  if (detailedMatch) {
    return cleanText(detailedMatch[1]);
  }

  return `aplicar ${title} em decisoes reais de engenharia, com criterio tecnico e impacto pratico`;
}

function extractConcepts(content: string): string[] {
  const boldConcepts = Array.from(content.matchAll(/###\s+\*\*([^*\n]+)\*\*/g))
    .map((match) => cleanText(match[1]))
    .filter(Boolean);

  if (boldConcepts.length >= 3) {
    return boldConcepts.slice(0, 5);
  }

  const visualConcepts = Array.from(
    content.matchAll(/###\s+Conceito\s+\d+:\s*([^\n]+)/gi)
  )
    .map((match) => cleanText(match[1]))
    .filter(Boolean);

  if (visualConcepts.length >= 3) {
    return visualConcepts.slice(0, 5);
  }

  const summaryMatch = content.match(/Os conceitos de ([^.]+) oferecem/i);
  if (summaryMatch) {
    const summaryConcepts = summaryMatch[1]
      .split(/,\s*| e /)
      .map(cleanText)
      .filter(Boolean);

    if (summaryConcepts.length >= 3) {
      return summaryConcepts.slice(0, 5);
    }
  }

  const proseConcepts = [
    content.match(/O primeiro conceito central e ([^.]+)\./i)?.[1],
    content.match(/O segundo conceito e ([^.]+)\./i)?.[1],
    content.match(/O terceiro conceito e ([^.]+)\./i)?.[1],
  ]
    .map(cleanText)
    .filter(Boolean);

  return proseConcepts.length >= 3
    ? proseConcepts.slice(0, 5)
    : FALLBACK_CONCEPTS;
}

function normalizeConcepts(concepts: string[]): string[] {
  const unique = new Map<string, string>();

  for (const concept of concepts) {
    const cleaned = sentenceCase(
      concept
        .replace(/^Conceito\s+\d+:\s*/i, '')
        .replace(/\.$/, '')
        .trim()
    );
    const key = cleaned.toLowerCase();
    if (cleaned && !unique.has(key)) {
      unique.set(key, cleaned);
    }
  }

  for (const fallback of FALLBACK_CONCEPTS) {
    if (unique.size >= 3) {
      break;
    }
    unique.set(fallback, sentenceCase(fallback));
  }

  return Array.from(unique.values()).slice(0, 4);
}

function lessonContext(lesson: LessonWithModule): LessonContext {
  const content = lesson.content ?? '';
  const title = extractTitle(content, lesson.title);

  return {
    title,
    moduleTitle: lesson.module.title,
    focus: extractFocus(content, title),
    concepts: normalizeConcepts(extractConcepts(content)),
  };
}

function focusPhrase(ctx: LessonContext): string {
  return cleanText(ctx.focus).replace(/[.!?]+$/g, '');
}

function exampleKind(ctx: LessonContext): string {
  const haystack = `${ctx.title} ${ctx.moduleTitle} ${ctx.concepts.join(' ')}`.toLowerCase();

  if (/react|frontend|formulario|component|design system|acessibilidade|next\.js|dashboard/.test(haystack)) {
    return 'frontend';
  }
  if (/api|node|express|auth|controller|service|contrato|middleware/.test(haystack)) {
    return 'api';
  }
  if (/sql|banco|database|prisma|orm|mongodb|migration|backup|redis|cache/.test(haystack)) {
    return 'data';
  }
  if (/teste|testing|qa|debug|unitario|e2e|integracao|mock/.test(haystack)) {
    return 'testing';
  }
  if (/docker|deploy|devops|ci\/cd|pipeline|monitoramento|observabilidade|cdn|websocket|queue|fila/.test(haystack)) {
    return 'ops';
  }
  if (/claude|prompt|tutor|tokens|memory|streaming|hmac|pdf|cli|capstone/.test(haystack)) {
    return 'product';
  }
  if (/solid|responsibility|liskov|factory|adapter|strategy|observer|command|refatoracao|padroes/.test(haystack)) {
    return 'design';
  }
  if (/arquitetura|camadas|scaling|microservices|availability|consistency|estimations|spanner|netflix|linkedin|system design/.test(haystack)) {
    return 'architecture';
  }

  return 'engineering';
}

function conceptExplanation(concept: string, ctx: LessonContext, index: number): string {
  const focus = focusPhrase(ctx);
  const roles = [
    `Use ${concept} para transformar o tema da aula em uma decisao observavel, conectada ao objetivo: ${focus}.`,
    `${concept} define um limite pratico dentro de ${ctx.moduleTitle}: o que entra, o que sai e como saber se funcionou.`,
    `Com ${concept}, voce reduz ambiguidade e cria um criterio claro para revisar implementacao, risco e manutencao.`,
    `${concept} ajuda a comparar alternativas sem ficar preso a preferencia pessoal ou solucao bonita demais para o problema.`,
  ];

  return roles[index % roles.length];
}

function concreteExample(concept: string, ctx: LessonContext, index: number): string {
  const kind = exampleKind(ctx);
  const safeConcept = concept.replace(/'/g, '');
  const conceptSlug = safeConcept
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 34);

  if (kind === 'frontend') {
    return `Tela: painel do aluno em \`${ctx.title}\`.
- Estado concreto: \`lessonId = ${101 + index}\`, \`isSubmitting = false\`, \`progress = ${25 + index * 20}\`.
- Aplique ${concept} criando uma fronteira entre dados recebidos da API e estado visual.
- Exemplo de decisao: o botao "Concluir aula" fica disabled enquanto \`completeLesson(${101 + index})\` esta em andamento.
- Conclusao: a UI comunica progresso sem duplicar submit nem esconder erro do usuario.`;
  }

  if (kind === 'api') {
    return `Endpoint: \`POST /api/courses/1/lessons/${201 + index}/complete\`.
- Entrada: \`{ "userId": "aluno_42", "lessonId": ${201 + index} }\`.
- Aplique ${concept} validando payload, permissao e resposta antes de tocar no banco.
- Caso de erro: se \`userId\` nao pertence a matricula, retorne \`403\` com \`code: "COURSE_ACCESS_DENIED"\`.
- Conclusao: o contrato da API fica previsivel para frontend, testes e suporte.`;
  }

  if (kind === 'data') {
    return `Cenario: atualizar progresso no PostgreSQL com Prisma.
- Modelo: \`UserProgress(userId: 42, lessonId: ${301 + index}, completed: true)\`.
- Aplique ${concept} escolhendo \`select\`, indice ou transacao antes de otimizar por intuicao.
- Query guia: busque \`findFirst({ where: { userId: 42, lessonId: ${301 + index} } })\` e atualize ou crie dentro de \`$transaction\`.
- Conclusao: o dado permanece consistente mesmo com cliques repetidos ou requests simultaneas.`;
  }

  if (kind === 'testing') {
    if (index % 4 === 0) {
      return `Teste: reproducao controlada para \`${ctx.title}\`.
- Arrange: crie \`userId = 42\`, \`lessonId = ${401 + index}\` e estado inicial conhecido.
- Act: execute exatamente os passos do bug: abrir aula, clicar concluir duas vezes e recarregar dashboard.
- Assert: valide ${concept} com \`expect(progress.completedCount).toBe(1)\`.
- Conclusao: qualquer pessoa consegue ver a falha antes de discutir solucao.`;
    }

    if (index % 4 === 1) {
      return `Investigacao: isolar uma variavel por vez.
- Hipotese A: problema no \`userId = 42\`; Hipotese B: duplo clique; Hipotese C: atraso do banco.
- Act: rode o mesmo teste trocando apenas uma variavel por execucao.
- Assert: valide ${concept} comparando logs \`requestId\`, tempo entre cliques e quantidade de updates.
- Conclusao: a causa provavel aparece por eliminacao, nao por palpite.`;
    }

    if (index % 4 === 2) {
      return `Correcao: confirmar causa raiz com teste vermelho-verde.
- Antes: duas requests concorrentes gravam progresso duas vezes.
- Mudanca: envolver leitura e escrita em uma transacao ou tornar a operacao idempotente.
- Assert: valide ${concept} com \`Promise.all([complete(), complete()])\` retornando progresso unico.
- Conclusao: a correcao prova que a falha desapareceu no ponto certo.`;
    }

    return `Suite de regressao: proteger a jornada completa.
- Cenario: aluno conclui aula, recebe feedback e volta ao dashboard.
- Act: simule sucesso, erro 500 e retry manual.
- Assert: valide ${concept} com estado visual, resposta da API e dado persistido no banco.
- Conclusao: o teste cobre a experiencia, nao apenas uma funcao isolada.`;
  }

  if (kind === 'ops') {
    return `Operacao: deploy de uma mudanca em \`${ctx.title}\`.
- Sinal observado: \`p95_latency_ms = ${180 + index * 40}\`, \`error_rate = 0.${index + 1}%\`.
- Aplique ${concept} definindo alerta, rollback e evidencia antes de promover para producao.
- Checklist: build verde, variaveis conferidas, health check \`/api/health\` OK e logs com \`requestId\`.
- Conclusao: a equipe consegue agir com dados quando algo degrada.`;
  }

  if (kind === 'product') {
    return `Produto: tutor IA respondendo uma duvida do aluno.
- Entrada: \`question = "Como concluo esta aula sem duplicar progresso?"\`.
- Aplique ${concept} separando instrucao do sistema, contexto da aula e resposta final.
- Medida: registre \`model\`, \`inputTokens\`, \`outputTokens\` e \`latencyMs\` para cada conversa.
- Conclusao: a experiencia fica util para o aluno e auditavel para o time.`;
  }

  if (kind === 'design') {
    return `Refatoracao: service \`CompleteLessonService\` crescendo demais.
- Antes: uma funcao valida usuario, atualiza banco, envia email e grava analytics.
- Aplique ${concept} extraindo \`${conceptSlug || 'regra'}Policy\` ou uma estrategia pequena com contrato explicito.
- Verificacao: os testes de conclusao de aula continuam passando sem alterar o controller.
- Conclusao: a mudanca reduz acoplamento sem criar arquitetura artificial.`;
  }

  if (kind === 'architecture') {
    return `Sistema: plataforma com 100.000 alunos ativos.
- Carga estimada: \`300 req/s\` em leitura de aulas e \`40 req/s\` em progresso.
- Aplique ${concept} decidindo entre cache, fila, replica de leitura ou simplificacao do dominio.
- Trade-off: progresso pode ser eventual por alguns segundos; pagamento e certificado precisam consistencia forte.
- Conclusao: a arquitetura nasce do risco real, nao de copiar empresas grandes.`;
  }

  if (index % 4 === 0) {
    return `Situacao real: transformar uma demanda vaga em entrega verificavel.
- Demanda: "melhorar ${ctx.title}".
- Aplique ${concept} escrevendo uma decisao, uma restricao e uma evidencia mensuravel.
- Exemplo: \`criterioAceite = "aluno conclui aula e ve progresso atualizado em ate 1s"\`.
- Conclusao: o conceito vira acao concreta para implementar, revisar e testar.`;
  }

  if (index % 4 === 1) {
    return `Cenario de produto: revisar uma historia antes de implementar.
- Historia: "Como aluno, quero retomar a ultima aula aberta".
- Aplique ${concept} separando regra principal, casos de borda e o que fica fora do escopo.
- Exemplo: \`lastLessonId = 33\`, \`completedLessons = [29, 30, 31, 32]\`, resultado esperado: abrir aula 33.
- Conclusao: a discussao sai do abstrato e vira contrato verificavel.`;
  }

  if (index % 4 === 2) {
    return `Cenario de revisao tecnica: PR com mudanca em progresso de aula.
- Arquivo afetado: \`app/api/courses/[courseId]/progress/route.ts\`.
- Aplique ${concept} procurando uma evidencia objetiva: teste, log, constraint ou criterio de aceite.
- Pergunta guia: "o que quebra se duas requests chegarem ao mesmo tempo para \`userId = 42\`?"
- Conclusao: a revisao identifica risco concreto antes de virar incidente.`;
  }

  return `Cenario de decisao: escolher entre solucao simples e robusta.
- Opcao A: salvar tudo em uma tabela \`LessonEvent\`; Opcao B: manter \`UserProgress\` agregado.
- Aplique ${concept} comparando manutencao, consulta e risco de inconsistencia.
- Registro: \`decision = "usar agregado agora, guardar eventos apenas para auditoria futura"\`.
- Conclusao: a escolha fica documentada e pode ser revisitada com dados reais.`;
}

function exercise(ctx: LessonContext): string {
  const [first, second, third] = ctx.concepts;

  return `Pegue um fluxo real relacionado a ${ctx.title} e desenhe uma mini-solucao em 20 minutos: defina entradas, saidas, risco principal e um teste de validacao. Use ${first}, ${second} e ${third} para justificar 3 decisoes tecnicas. Termine escrevendo uma mudanca pequena que voce faria primeiro no codigo ou no processo.`;
}

function buildLessonContent(lesson: LessonWithModule): string {
  const ctx = lessonContext(lesson);
  const conceptBlocks = ctx.concepts
    .map((concept, index) => {
      return `### **${concept}**
${conceptExplanation(concept, ctx, index)}

**Exemplo Prático:**
${concreteExample(concept, ctx, index)}`;
    })
    .join('\n\n');

  return `${ENHANCEMENT_MARKER}
# ${ctx.title}

## Contexto
${sentenceCase(focusPhrase(ctx))}.

Dentro do módulo ${ctx.moduleTitle}, esta aula deve ser estudada como uma prática aplicável: você entende o conceito, testa em um cenário pequeno e sai com um critério para revisar código, arquitetura ou operação.

## Conceitos Centrais

${conceptBlocks}

## Exercício Final
${exercise(ctx)}
`;
}

function hasEnhancedPattern(content: string | null): boolean {
  if (!content) {
    return false;
  }

  if (!content.includes(ENHANCEMENT_MARKER)) {
    return false;
  }

  const conceptCount = (content.match(/###\s+\*\*[^*\n]+\*\*/g) ?? []).length;
  const exampleCount = (content.match(/\*\*Exemplo Prático:\*\*/g) ?? []).length;
  const hasExercise = /##\s+Exercício Final/i.test(content);

  return conceptCount >= 3 && exampleCount >= conceptCount && hasExercise;
}

function validateLessonContent(content: string, lesson: LessonWithModule): void {
  const conceptCount = (content.match(/###\s+\*\*[^*\n]+\*\*/g) ?? []).length;
  const exampleCount = (content.match(/\*\*Exemplo Prático:\*\*/g) ?? []).length;

  const requiredPatterns = [
    /^#\s+.+/m,
    /##\s+Contexto/,
    /##\s+Conceitos Centrais/,
    /##\s+Exercício Final/,
  ];

  for (const pattern of requiredPatterns) {
    if (!pattern.test(content)) {
      throw new Error(`Lesson ${lesson.id} is missing required pattern: ${pattern}`);
    }
  }

  if (conceptCount < 3) {
    throw new Error(`Lesson ${lesson.id} has only ${conceptCount} concepts.`);
  }

  if (exampleCount < conceptCount) {
    throw new Error(
      `Lesson ${lesson.id} has ${conceptCount} concepts but ${exampleCount} examples.`
    );
  }

  const conceptNames = Array.from(content.matchAll(/###\s+\*\*([^*\n]+)\*\*/g)).map(
    (match) => match[1].toLowerCase()
  );
  if (new Set(conceptNames).size !== conceptNames.length) {
    throw new Error(`Lesson ${lesson.id} has repeated concept titles.`);
  }
}

async function main() {
  const lessons = await prisma.lesson.findMany({
    where: { module: { courseId: 1 } },
    include: { module: { select: { title: true, order: true } } },
    orderBy: [{ module: { order: 'asc' } }, { order: 'asc' }],
  });

  if (lessons.length !== 58) {
    throw new Error(`Expected 58 lessons for course 1, found ${lessons.length}.`);
  }

  let updated = 0;
  let skipped = 0;

  for (const lesson of lessons) {
    if (hasEnhancedPattern(lesson.content)) {
      skipped += 1;
      console.log(`Skipped lesson ${lesson.id}: ${lesson.title}`);
      continue;
    }

    const content = buildLessonContent(lesson);
    validateLessonContent(content, lesson);

    await prisma.lesson.update({
      where: { id: lesson.id },
      data: { content },
    });

    updated += 1;
    console.log(`Enhanced lesson ${lesson.id}: ${lesson.title}`);
  }

  const refreshedLessons = await prisma.lesson.findMany({
    where: { module: { courseId: 1 } },
    include: { module: { select: { title: true, order: true } } },
    orderBy: [{ module: { order: 'asc' } }, { order: 'asc' }],
  });

  for (const lesson of refreshedLessons) {
    validateLessonContent(lesson.content ?? '', lesson);
  }

  console.log(
    `Done. Enhanced ${updated} lessons, skipped ${skipped} already formatted lessons.`
  );
}

main()
  .catch((error) => {
    console.error('Failed to enhance lesson content:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
