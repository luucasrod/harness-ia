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

type VisualPattern = 'concepts' | 'architecture' | 'process' | 'tools';

const LESSON_STYLE = `<style>
.lesson-concept {
  margin: 2rem 0;
}

.lesson-concept h3 {
  font-size: 1.8em;
  font-weight: 900;
  color: #ffffff;
  margin: 1.5rem 0 0.8rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #0066ff;
}

.lesson-concept .explanation {
  font-size: 0.95em;
  color: #d0d0d0;
  line-height: 1.7;
  margin: 1rem 0;
}

.lesson-concept .example {
  background: rgba(0, 102, 255, 0.08);
  border-left: 4px solid #0066ff;
  padding: 1.2rem;
  margin: 1.5rem 0;
  border-radius: 4px;
}

.lesson-concept .example h4 {
  font-weight: 700;
  font-size: 1.05em;
  margin: 0 0 0.8rem 0;
  color: #ffffff;
}

.lesson-concept .example li {
  margin: 0.6rem 0;
  line-height: 1.6;
  font-size: 0.95em;
}

.lesson-concept .application {
  font-size: 0.95em;
  color: #d0d0d0;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255,255,255,0.1);
}

.concept-separator {
  border: none;
  border-top: 1px solid rgba(255,255,255,0.2);
  margin: 2.5rem 0;
}
</style>`;

const FALLBACK_CONCEPTS = [
  'modelo mental do problema',
  'responsabilidades e limites',
  'criterios de qualidade',
];

function cleanText(value: string | undefined): string {
  return (value ?? '')
    .replace(/\s+/g, ' ')
    .replace(/^["'`]+|["'`]+$/g, '')
    .trim();
}

function sentenceCase(value: string): string {
  const cleaned = cleanText(value);

  if (!cleaned) {
    return cleaned;
  }

  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function compactPhrase(
  value: string,
  fallback: string,
  maxLength = 54
): string {
  const cleaned = cleanText(value)
    .replace(/^#+\s*/, '')
    .replace(/[.;:!?]+$/g, '')
    .replace(/\s+na pratica$/i, '');

  if (!cleaned) {
    return fallback;
  }

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  const selected: string[] = [];

  for (const word of cleaned.split(' ')) {
    const candidate = [...selected, word].join(' ');

    if (candidate.length > maxLength - 3) {
      break;
    }

    selected.push(word);
  }

  return selected.length > 0 ? `${selected.join(' ')}...` : fallback;
}

function stripMarkdownHeading(value: string): string {
  return cleanText(value.replace(/^#+\s*/, ''));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function createSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function extractTitleFromContent(
  content: string,
  fallbackTitle: string
): string {
  const titleLine = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.startsWith('# '));

  return titleLine ? stripMarkdownHeading(titleLine) : fallbackTitle;
}

function extractFocus(content: string, title: string): string {
  const visualMatch = content.match(
    /Esta aula organiza\s+([\s\S]*?)\.\s+O objetivo/i
  );

  if (visualMatch) {
    return cleanText(visualMatch[1]);
  }

  const oldMatch = content.match(/e uma aula sobre ([^.]+)\./i);

  if (oldMatch) {
    return cleanText(oldMatch[1]);
  }

  const contextMatch = content.match(/## Contexto\s+([\s\S]*?)(?=\n##\s|$)/i);

  if (contextMatch) {
    const firstSentence = cleanText(contextMatch[1]).split(/(?<=[.!?])\s+/)[0];

    return cleanText(
      firstSentence.replace(new RegExp(`^${escapeRegExp(title)}\\s+`, 'i'), '')
    );
  }

  return `compreender ${title} como competencia pratica`;
}

function extractConcepts(content: string): string[] {
  const oldMatch = content.match(/Os conceitos de ([^.]+) oferecem/i);

  if (oldMatch) {
    return oldMatch[1]
      .split(/,\s*| e /)
      .map(cleanText)
      .filter(Boolean)
      .slice(0, 3);
  }

  const conceptMatches = Array.from(
    content.matchAll(/### Conceito \d+:\s*([^\n]+)/gi)
  )
    .map((match) => cleanText(match[1]))
    .filter(Boolean);

  if (conceptMatches.length > 0) {
    return conceptMatches.slice(0, 3);
  }

  const oldConcepts = [
    content.match(/O primeiro conceito central e ([^.]+)\./i)?.[1],
    content.match(/O segundo conceito e ([^.]+)\./i)?.[1],
    content.match(/O terceiro conceito e ([^.]+)\./i)?.[1],
  ]
    .map(cleanText)
    .filter(Boolean);

  return oldConcepts.length > 0 ? oldConcepts.slice(0, 3) : FALLBACK_CONCEPTS;
}

function extractExample(content: string, title: string): string {
  const guidedMatch = content.match(
    /### Exemplo 1:[^\n]*\n+Imagine\s+([\s\S]*?)\.\s+Primeiro descreva/i
  );

  if (guidedMatch) {
    return cleanText(guidedMatch[1]);
  }

  const oldMatch = content.match(/Um exemplo pratico seria ([^.]+)\./i);

  if (oldMatch) {
    return cleanText(oldMatch[1]);
  }

  return `um caso real em que ${title} precisa ser aplicado`;
}

function extractPractice(content: string): string {
  const reviewMatch = content.match(
    /### Exemplo 2:[^\n]*\n+Use a aula como revisao de engenharia:\s+([\s\S]*?)\.\s+Em seguida/i
  );

  if (reviewMatch) {
    return cleanText(reviewMatch[1]);
  }

  const oldMatch = content.match(/Como exercicio, ([^.]+)\./i);

  if (oldMatch) {
    return cleanText(oldMatch[1]);
  }

  return 'revisar a solucao e registrar criterios verificaveis';
}

function chooseVisualPattern(lesson: LessonWithModule): VisualPattern {
  const haystack = `${lesson.module.title} ${lesson.title}`.toLowerCase();

  if (
    /arquitetura|camadas|\bapi\b|node|express|microservices|system design|scaling|availability|backup|\bha\b|solid|patterns|capstone|dashboard/.test(
      haystack
    )
  ) {
    return 'architecture';
  }

  if (
    /pipeline|deploy|devops|docker|testing|testes|qa|debugging|migrations|ci\/cd|submission|certificate|requisitos|escopo|criteria|criterios/.test(
      haystack
    )
  ) {
    return 'process';
  }

  if (
    /prisma|redis|websockets|queues|cdn|monitoring|observabilidade|claude|prompt|memory|tokens|custos|orm|mongodb|sql|database|docker compose/.test(
      haystack
    )
  ) {
    return 'tools';
  }

  return 'concepts';
}

function explanationFor(pattern: VisualPattern): string {
  if (pattern === 'architecture') {
    return 'Separe fronteiras, dados e regras antes de escolher a solucao.';
  }

  if (pattern === 'process') {
    return 'Transforme a decisao em etapas visiveis, testaveis e revisaveis.';
  }

  if (pattern === 'tools') {
    return 'Use a ferramenta com sinais claros de entrada, saida, erro e custo.';
  }

  return 'Quebre a ideia em partes pequenas para comparar alternativas tecnicas.';
}

function scenarioFor(pattern: VisualPattern, lessonTitle: string): string {
  const title = compactPhrase(lessonTitle, 'a aula', 42);

  if (pattern === 'architecture') {
    return `Um time precisa organizar ${title} sem misturar responsabilidades.`;
  }

  if (pattern === 'process') {
    return `Um fluxo de ${title} precisa sair do improviso e virar rotina.`;
  }

  if (pattern === 'tools') {
    return `A equipe quer usar ${title} com criterio e medir impacto real.`;
  }

  return `Voce precisa explicar ${title} para tomar uma decisao tecnica.`;
}

function actionFor(pattern: VisualPattern): string {
  if (pattern === 'architecture') {
    return 'Desenhe camadas, entradas, saidas e pontos de integracao.';
  }

  if (pattern === 'process') {
    return 'Liste etapas, responsaveis, evidencias e criterios de aceite.';
  }

  if (pattern === 'tools') {
    return 'Configure o menor caso util e observe logs, erros e latencia.';
  }

  return 'Compare duas alternativas usando risco, clareza e manutencao.';
}

function resultFor(pattern: VisualPattern): string {
  if (pattern === 'architecture') {
    return 'Arquitetura mais simples de revisar, testar e evoluir.';
  }

  if (pattern === 'process') {
    return 'Fluxo repetivel, com menos ambiguidade e melhor feedback.';
  }

  if (pattern === 'tools') {
    return 'Decisao baseada em sinais, nao em tentativa solta.';
  }

  return 'Escolha tecnica mais clara, defensavel e facil de revisar.';
}

function conceptBlock(
  index: number,
  concept: string,
  pattern: VisualPattern,
  lessonTitle: string
): string {
  const fallback = FALLBACK_CONCEPTS[index - 1] ?? FALLBACK_CONCEPTS[0];
  const name = escapeHtml(sentenceCase(compactPhrase(concept, fallback)));
  const explanation = escapeHtml(explanationFor(pattern));
  const scenario = escapeHtml(scenarioFor(pattern, lessonTitle));
  const action = escapeHtml(actionFor(pattern));
  const result = escapeHtml(resultFor(pattern));

  const heading = `Conceito ${index}: ${sentenceCase(compactPhrase(concept, fallback))}`;

  return `<div class="lesson-concept">
  <h3 id="${createSlug(heading)}">Conceito ${index}: ${name}</h3>
  <p class="explanation">${explanation}</p>

  <div class="example">
    <h4>Exemplo Pratico:</h4>
    <ul>
      <li><strong>Cenario:</strong> ${scenario}</li>
      <li><strong>Acao:</strong> ${action}</li>
      <li><strong>Resultado:</strong> ${result}</li>
    </ul>
  </div>

  <p class="application"><strong>Aplicacao:</strong> Use este conceito para montar uma parte do exercicio final.</p>
</div>

<hr class="concept-separator" />`;
}

function buildVisualContent(lesson: LessonWithModule): string {
  const sourceContent = lesson.content ?? '';
  const title = extractTitleFromContent(sourceContent, lesson.title);
  const pattern = chooseVisualPattern(lesson);
  const concepts = [
    ...extractConcepts(sourceContent),
    ...FALLBACK_CONCEPTS,
  ].slice(0, 3);
  const [firstConcept, secondConcept, thirdConcept] = concepts;
  const focus = compactPhrase(extractFocus(sourceContent, title), title, 58);
  const example = compactPhrase(
    extractExample(sourceContent, title),
    'um caso real do tema',
    58
  );
  const practice = compactPhrase(
    extractPractice(sourceContent),
    'revisar a solucao com criterio',
    58
  );

  return `${LESSON_STYLE}

<section class="lesson-overview">
  <h2 id="contexto">Contexto</h2>
  <ul>
    <li><strong>Tema:</strong> ${escapeHtml(sentenceCase(focus))}.</li>
    <li><strong>Objetivo:</strong> entender, aplicar e revisar sem texto corrido.</li>
    <li><strong>Ritmo:</strong> leia um conceito, veja o exemplo e avance para o proximo.</li>
  </ul>
</section>

<h2 id="conceitos-centrais">Conceitos Centrais</h2>

${conceptBlock(1, firstConcept, pattern, title)}

${conceptBlock(2, secondConcept, pattern, title)}

${conceptBlock(3, thirdConcept, pattern, title)}

<section class="lesson-exercise">
  <h2 id="exercicio-final">Exercicio Final</h2>
  <p><strong>Entrega:</strong> produza um mapa curto sobre ${escapeHtml(
    sentenceCase(compactPhrase(title, 'o tema'))
  )}.</p>
  <ul>
    <li><strong>Cenario:</strong> ${escapeHtml(sentenceCase(example))}.</li>
    <li><strong>Acao:</strong> aplique os tres conceitos em bullets curtos.</li>
    <li><strong>Resultado:</strong> registre decisoes, riscos e criterio de revisao.</li>
    <li><strong>Revisao:</strong> ${escapeHtml(sentenceCase(practice))}.</li>
  </ul>
</section>

<section class="lesson-summary">
  <h2 id="checklist-resumo">Checklist / Resumo</h2>
  <ul>
    <li>Cada conceito tem H3 proprio.</li>
    <li>Explicacoes ficam curtas e respiraveis.</li>
    <li>Exemplos usam cenario, acao e resultado.</li>
    <li>Separadores mantem a leitura em blocos leves.</li>
  </ul>
</section>`;
}

function validateHtmlContent(content: string, lesson: LessonWithModule): void {
  const styleCount = (content.match(/<style>/g) ?? []).length;
  const conceptCount = (content.match(/<div class="lesson-concept">/g) ?? [])
    .length;
  const separatorCount = (
    content.match(/<hr class="concept-separator" \/>/g) ?? []
  ).length;

  if (styleCount !== 1) {
    throw new Error(`Lesson ${lesson.id} must contain exactly one style tag.`);
  }

  if (conceptCount !== 3) {
    throw new Error(`Lesson ${lesson.id} must contain 3 lesson-concept divs.`);
  }

  if (separatorCount !== conceptCount) {
    throw new Error(
      `Lesson ${lesson.id} must contain one separator per concept.`
    );
  }

  if (/^#{1,6}\s/m.test(content) || /\*\*[^*]+\*\*/.test(content)) {
    throw new Error(`Lesson ${lesson.id} still contains markdown formatting.`);
  }
}

async function main() {
  const lessons = await prisma.lesson.findMany({
    where: { module: { courseId: 1 } },
    include: { module: { select: { title: true, order: true } } },
    orderBy: [{ module: { order: 'asc' } }, { order: 'asc' }],
  });

  if (lessons.length !== 58) {
    throw new Error(
      `Expected 58 lessons for course 1, found ${lessons.length}.`
    );
  }

  let updated = 0;

  for (const lesson of lessons) {
    const content = buildVisualContent(lesson);
    validateHtmlContent(content, lesson);

    await prisma.lesson.update({
      where: { id: lesson.id },
      data: { content },
    });

    updated += 1;
    console.log(`Updated lesson ${lesson.id}: ${lesson.title}`);
  }

  console.log(
    `Done. Reformatted ${updated} lessons for course 1 with embedded HTML styling.`
  );
}

main()
  .catch((error) => {
    console.error('Failed to reformat lesson content:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
