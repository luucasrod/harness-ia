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

type LessonProfile = {
  focus: string;
  concepts: string[];
  example: string;
  practice: string;
};

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

function stripMarkdownHeading(value: string): string {
  return cleanText(value.replace(/^#+\s*/, ''));
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
    return cleanText(
      visualMatch[1].replace(/^Esta aula organiza\s+/i, '').replace(/\.+$/g, '')
    );
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

  return `compreender ${title} como uma competencia pratica de engenharia`;
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
    return cleanText(
      guidedMatch[1].replace(/^Imagine\s+/i, '').replace(/\.+$/g, '')
    );
  }

  const oldMatch = content.match(/Um exemplo pratico seria ([^.]+)\./i);
  if (oldMatch) {
    return cleanText(oldMatch[1]);
  }

  const visualMatch = content.match(
    /### Exemplo 1:[^\n]*\n+([\s\S]*?)(?=\n### Exemplo 2:|\n##\s|$)/i
  );
  if (visualMatch) {
    return cleanText(
      visualMatch[1].replace(/```[\s\S]*?```/g, '').replace(/^- .+$/gm, '')
    );
  }

  return `um fluxo real em que ${title} precisa ser aplicado com dados, regras e feedback claros`;
}

function extractPractice(content: string): string {
  const reviewMatch = content.match(
    /### Exemplo 2:[^\n]*\n+Use a aula como revisao de engenharia:\s+([\s\S]*?)\.\s+Em seguida/i
  );
  if (reviewMatch) {
    return cleanText(reviewMatch[1].replace(/\.+$/g, ''));
  }

  const oldMatch = content.match(/Como exercicio, ([^.]+)\./i);
  if (oldMatch) {
    return cleanText(oldMatch[1]);
  }

  const checklistMatch = content.match(/## Checklist \/ Resumo\s+([\s\S]*?)$/i);
  if (checklistMatch) {
    const firstItem = checklistMatch[1]
      .split(/\r?\n/)
      .map((line) => line.replace(/^-\s*✓\s*/, '').trim())
      .find(Boolean);

    if (firstItem) {
      return cleanText(firstItem);
    }
  }

  return 'revise a solucao, transforme decisoes importantes em criterios verificaveis e registre o que precisa ser testado';
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

function diagramName(pattern: VisualPattern, title: string): string {
  if (pattern === 'architecture') {
    return `Camadas de ${title}`;
  }

  if (pattern === 'process') {
    return `Fluxo de ${title}`;
  }

  if (pattern === 'tools') {
    return `Estados e Decisoes de ${title}`;
  }

  return `Mapa Conceitual de ${title}`;
}

function diagramDescription(
  pattern: VisualPattern,
  concepts: string[]
): string {
  const [firstConcept, secondConcept, thirdConcept] = concepts;

  if (pattern === 'architecture') {
    return `O diagrama mostra uma leitura em camadas: entrada do usuario ou sistema, regras de negocio, persistencia e operacao. ${sentenceCase(
      firstConcept
    )} fica no centro da decisao, enquanto ${secondConcept} define limites entre componentes e ${thirdConcept} ajuda a validar se a arquitetura suporta mudanca.`;
  }

  if (pattern === 'process') {
    return `O flowchart descrito segue cinco etapas: entender o objetivo, mapear entradas, aplicar ${firstConcept}, validar ${secondConcept} e fechar com ${thirdConcept}. A ideia visual e mostrar que cada etapa gera evidencias antes da proxima decisao.`;
  }

  if (pattern === 'tools') {
    return `A tabela visual separa estados, sinais e acoes. ${sentenceCase(
      firstConcept
    )} indica quando usar a ferramenta, ${secondConcept} mostra os limites de configuracao e ${thirdConcept} orienta como observar resultado, erro e custo.`;
  }

  return `O mapa conceitual coloca o tema no centro e abre tres ramos: ${firstConcept}, ${secondConcept} e ${thirdConcept}. Cada ramo conecta definicao, impacto pratico e criterio de revisao.`;
}

function conceptBullets(
  concept: string,
  pattern: VisualPattern,
  lesson: LessonWithModule
): string[] {
  if (pattern === 'architecture') {
    return [
      `${sentenceCase(concept)} define uma responsabilidade clara dentro de ${lesson.module.title}.`,
      'A pergunta visual e: esta parte sabe demais sobre as outras camadas?',
    ];
  }

  if (pattern === 'process') {
    return [
      `${sentenceCase(concept)} funciona como uma etapa verificavel, nao como uma intuicao solta.`,
      'O resultado esperado deve poder virar checklist, teste ou criterio de aceite.',
    ];
  }

  if (pattern === 'tools') {
    return [
      `${sentenceCase(concept)} ajuda a escolher configuracoes, limites e sinais de saude.`,
      'A ferramenta deve ser observada por entrada, saida, erro, custo e impacto no usuario.',
    ];
  }

  return [
    `${sentenceCase(concept)} transforma uma ideia ampla em partes menores e explicaveis.`,
    'Use este conceito para comparar alternativas e justificar a decisao tecnica.',
  ];
}

function codeExample(pattern: VisualPattern, concepts: string[]): string {
  if (pattern === 'architecture') {
    return [
      '```ts',
      'type Entrada = { usuarioId: string; payload: unknown };',
      '',
      'async function executarCasoDeUso(entrada: Entrada) {',
      '  validarContrato(entrada.payload);',
      '  const resultado = await aplicarRegraDeNegocio(entrada);',
      '  return apresentarResposta(resultado);',
      '}',
      '```',
    ].join('\n');
  }

  if (pattern === 'process') {
    return [
      '1. Definir objetivo e restricoes.',
      '2. Mapear entradas, saidas e riscos.',
      `3. Aplicar ${concepts[0]} com evidencias.`,
      `4. Validar ${concepts[1]} antes de concluir.`,
      `5. Registrar ${concepts[2]} como criterio de revisao.`,
    ].join('\n');
  }

  if (pattern === 'tools') {
    return [
      '| Estado | Sinal observado | Acao recomendada |',
      '| --- | --- | --- |',
      '| Saudavel | Latencia e erros dentro do esperado | Manter monitoramento |',
      '| Atencao | Crescimento de custo, fila ou cache miss | Ajustar limite e medir novamente |',
      '| Critico | Falha repetida ou dado inconsistente | Acionar fallback e investigar causa |',
    ].join('\n');
  }

  return [
    '```ts',
    'const decisaoTecnica = {',
    `  conceito: '${concepts[0]}',`,
    '  criterio: "clareza, risco e manutencao",',
    '  evidencia: "teste, log ou exemplo reproduzivel",',
    '};',
    '```',
  ].join('\n');
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
  const focus = extractFocus(sourceContent, title);
  const example = extractExample(sourceContent, title);
  const practice = extractPractice(sourceContent);
  const diagram = diagramName(pattern, title);

  return `# ${title}

## Contexto
Esta aula organiza ${focus}. O objetivo e transformar o tema em um modelo visual, facil de revisar, aplicar e explicar para outra pessoa.

Dentro do modulo ${lesson.module.title}, o conteudo funciona como uma peca pratica: voce entende o conceito, visualiza o fluxo e sai com criterios para usar em codigo, arquitetura ou operacao.

## Conceitos Centrais

### Conceito 1: ${sentenceCase(firstConcept)}
- ${conceptBullets(firstConcept, pattern, lesson)[0]}
- ${conceptBullets(firstConcept, pattern, lesson)[1]}

### Conceito 2: ${sentenceCase(secondConcept)}
- ${conceptBullets(secondConcept, pattern, lesson)[0]}
- ${conceptBullets(secondConcept, pattern, lesson)[1]}

### Conceito 3: ${sentenceCase(thirdConcept)}
- ${conceptBullets(thirdConcept, pattern, lesson)[0]}
- ${conceptBullets(thirdConcept, pattern, lesson)[1]}

## [Diagrama: ${diagram}]
${diagramDescription(pattern, concepts)}

## Exemplos Praticos

### Exemplo 1: Cenario guiado
Imagine ${example}. Primeiro descreva o comportamento em linguagem simples, depois separe dados de entrada, regra principal, fronteiras externas e sinais de sucesso.

${codeExample(pattern, concepts)}

### Exemplo 2: Revisao aplicada
Use a aula como revisao de engenharia: ${practice}. Em seguida, compare a solucao com uma alternativa mais simples e uma alternativa mais robusta.

- O que precisa ficar explicito para outro desenvolvedor?
- Qual erro seria mais caro em producao?
- Que teste, log ou checklist provaria que a solucao esta correta?

## Checklist / Resumo
- ✓ Expliquei ${firstConcept} com impacto pratico.
- ✓ Conectei ${secondConcept} a uma decisao verificavel.
- ✓ Usei ${thirdConcept} para revisar qualidade, risco ou operacao.
- ✓ Tenho um exemplo pequeno que pode virar codigo, teste ou checklist.
`;
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

    await prisma.lesson.update({
      where: { id: lesson.id },
      data: { content },
    });

    updated += 1;
    console.log(`Updated lesson ${lesson.id}: ${lesson.title}`);
  }

  console.log(
    `Done. Reformatted ${updated} lessons for course 1 with visual pedagogy.`
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
