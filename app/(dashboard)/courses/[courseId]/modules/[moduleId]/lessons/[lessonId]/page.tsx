import { headers } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import CodeBlock from '@/app/components/CodeBlock';
import LessonSidebar, {
  type LessonSidebarItem,
} from '@/app/components/LessonSidebar';
import QuizCard from '@/app/components/QuizCard';
import '@/app/styles/course.css';

type LessonExample = {
  title: string;
  description: string;
  code_or_diagram: string;
};

type LessonExercise = {
  id: string;
  type: string;
  question: string;
  options?: string[];
  correct_answer: string;
  explanation: string;
};

type Lesson = {
  lesson_id: string;
  title: string;
  description: string;
  learning_objectives: string[];
  content: string;
  examples?: LessonExample[];
  exercises?: LessonExercise[];
  isCompleted?: boolean;
};

type LessonNavigationItem = {
  id: string;
  title: string;
  href: string;
};

type LessonResponse = {
  course: { id: string; title: string };
  module: { id: string; sourceId: string; title: string; description: string };
  lesson: Lesson;
  outline: LessonSidebarItem[];
  navigation: {
    previous: LessonNavigationItem | null;
    next: LessonNavigationItem | null;
  };
};

type Heading = { id: string; text: string; level: number };

type TableRow = string[];

type MarkdownBlock =
  | { type: 'heading'; level: number; text: string; id: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'code'; language: string; code: string }
  | { type: 'quote'; items: string[] }
  | { type: 'image'; alt: string; src: string }
  | { type: 'table'; header: TableRow; rows: TableRow[] }
  | { type: 'divider' };

const HEADING_PATTERN = /^(#{1,4})\s+(.+)/;
const IMAGE_PATTERN = /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)$/;
const UNORDERED_PATTERN = /^[-*+]\s+(.+)/;
const ORDERED_PATTERN = /^\d+[.)]\s+(.+)/;
const TABLE_DIVIDER_PATTERN = /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?$/;
const FENCE_PATTERN = /^```(\S*)/;
const DIVIDER_PATTERN = /^(?:-{3,}|\*{3,}|_{3,})$/;

const INLINE_PATTERN =
  /(`[^`]+`)|(!\[[^\]]*\]\([^)]*\))|(\[[^\]]+\]\([^)]*\))|(\*\*[^*]+\*\*)|(__[^_]+__)|(\*[^*\n]+\*)|(_[^_\n]+_)/g;

function createSlug(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Lesson bodies are authored by a language model, so any URL that reaches the
 * DOM goes through here first. Only http(s), mailto and site-relative targets
 * are allowed; `javascript:` and `data:` payloads are dropped.
 */
function safeUrl(value: string): string | null {
  const target = value.trim();

  if (target.startsWith('/') && !target.startsWith('//')) {
    return target;
  }

  if (target.startsWith('#')) {
    return target;
  }

  try {
    const url = new URL(target);
    return url.protocol === 'http:' ||
      url.protocol === 'https:' ||
      url.protocol === 'mailto:'
      ? target
      : null;
  } catch {
    return null;
  }
}

function splitTableRow(line: string): TableRow {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

function isTableDivider(line: string) {
  return line.includes('-') && TABLE_DIVIDER_PATTERN.test(line.trim());
}

function parseMarkdown(markdown: string) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks: MarkdownBlock[] = [];
  const headings: Heading[] = [];
  let index = 0;

  const isBlockStart = (line: string) =>
    line.trim().length > 0 &&
    (HEADING_PATTERN.test(line) ||
      FENCE_PATTERN.test(line) ||
      UNORDERED_PATTERN.test(line) ||
      ORDERED_PATTERN.test(line) ||
      line.startsWith('>') ||
      DIVIDER_PATTERN.test(line.trim()) ||
      IMAGE_PATTERN.test(line.trim()));

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    const fenceMatch = line.match(FENCE_PATTERN);

    if (fenceMatch) {
      const codeLines: string[] = [];
      index += 1;

      while (index < lines.length && !lines[index].startsWith('```')) {
        codeLines.push(lines[index]);
        index += 1;
      }

      blocks.push({
        type: 'code',
        language: fenceMatch[1] ?? '',
        code: codeLines.join('\n'),
      });
      index += 1;
      continue;
    }

    const headingMatch = line.match(HEADING_PATTERN);

    if (headingMatch) {
      const text = headingMatch[2].trim();
      const level = headingMatch[1].length;
      const id = createSlug(text);

      headings.push({ id, text, level });
      blocks.push({ type: 'heading', level, text, id });
      index += 1;
      continue;
    }

    if (DIVIDER_PATTERN.test(line.trim())) {
      blocks.push({ type: 'divider' });
      index += 1;
      continue;
    }

    const imageMatch = line.trim().match(IMAGE_PATTERN);

    if (imageMatch) {
      blocks.push({ type: 'image', alt: imageMatch[1], src: imageMatch[2] });
      index += 1;
      continue;
    }

    if (
      line.includes('|') &&
      index + 1 < lines.length &&
      isTableDivider(lines[index + 1])
    ) {
      const header = splitTableRow(line);
      const rows: TableRow[] = [];
      index += 2;

      while (index < lines.length && lines[index].includes('|') && lines[index].trim()) {
        rows.push(splitTableRow(lines[index]));
        index += 1;
      }

      blocks.push({ type: 'table', header, rows });
      continue;
    }

    if (line.startsWith('>')) {
      const items: string[] = [];

      while (index < lines.length && lines[index].startsWith('>')) {
        items.push(lines[index].replace(/^>\s?/, ''));
        index += 1;
      }

      blocks.push({ type: 'quote', items });
      continue;
    }

    const unorderedMatch = line.match(UNORDERED_PATTERN);
    const orderedMatch = line.match(ORDERED_PATTERN);

    if (unorderedMatch || orderedMatch) {
      const ordered = Boolean(orderedMatch);
      const items: string[] = [];

      while (index < lines.length) {
        const itemMatch = ordered
          ? lines[index].match(ORDERED_PATTERN)
          : lines[index].match(UNORDERED_PATTERN);

        if (!itemMatch) {
          break;
        }

        items.push(itemMatch[1]);
        index += 1;
      }

      blocks.push({ type: 'list', ordered, items });
      continue;
    }

    const paragraphLines = [line.trim()];
    index += 1;

    while (index < lines.length && lines[index].trim() && !isBlockStart(lines[index])) {
      paragraphLines.push(lines[index].trim());
      index += 1;
    }

    blocks.push({ type: 'paragraph', text: paragraphLines.join(' ') });
  }

  return { blocks, headings };
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];

  text.split(INLINE_PATTERN).forEach((part, index) => {
    if (!part) {
      return;
    }

    const key = `${keyPrefix}-${index}`;

    if (part.startsWith('`') && part.endsWith('`')) {
      nodes.push(<code key={key}>{part.slice(1, -1)}</code>);
      return;
    }

    const imageMatch = part.match(/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)$/);

    if (imageMatch) {
      const src = safeUrl(imageMatch[2]);

      if (src) {
        nodes.push(
          // eslint-disable-next-line @next/next/no-img-element -- lesson markdown may reference arbitrary remote images that are not known at build time
          <img
            alt={imageMatch[1]}
            decoding="async"
            key={key}
            loading="lazy"
            src={src}
          />
        );
      } else if (imageMatch[1]) {
        nodes.push(imageMatch[1]);
      }

      return;
    }

    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)$/);

    if (linkMatch) {
      const href = safeUrl(linkMatch[2]);

      if (!href) {
        nodes.push(linkMatch[1]);
        return;
      }

      const isExternal = href.startsWith('http');

      nodes.push(
        <a
          href={href}
          key={key}
          {...(isExternal
            ? { target: '_blank', rel: 'noopener noreferrer' }
            : {})}
        >
          {linkMatch[1]}
        </a>
      );
      return;
    }

    if (
      (part.startsWith('**') && part.endsWith('**')) ||
      (part.startsWith('__') && part.endsWith('__'))
    ) {
      nodes.push(<strong key={key}>{part.slice(2, -2)}</strong>);
      return;
    }

    if (
      (part.startsWith('*') && part.endsWith('*')) &&
      part.length > 2
    ) {
      nodes.push(<em key={key}>{part.slice(1, -1)}</em>);
      return;
    }

    nodes.push(part);
  });

  return nodes;
}

function MarkdownContent({ markdown }: { markdown: string }) {
  const { blocks } = parseMarkdown(markdown);

  return (
    <div className="course-content">
      {blocks.map((block, index) => {
        const key = `block-${index}`;

        if (block.type === 'heading') {
          const Tag = (block.level <= 2 ? 'h2' : 'h3') as 'h2' | 'h3';
          return (
            <Tag id={block.id} key={key}>
              {block.text}
            </Tag>
          );
        }

        if (block.type === 'list') {
          const Tag = block.ordered ? 'ol' : 'ul';
          return (
            <Tag key={key}>
              {block.items.map((item, itemIndex) => (
                <li key={`${key}-${itemIndex}`}>{renderInline(item, key)}</li>
              ))}
            </Tag>
          );
        }

        if (block.type === 'code') {
          return <CodeBlock code={block.code} language={block.language} key={key} />;
        }

        if (block.type === 'quote') {
          return (
            <blockquote key={key}>
              {block.items.map((item, itemIndex) => (
                <p key={`${key}-${itemIndex}`}>{renderInline(item, key)}</p>
              ))}
            </blockquote>
          );
        }

        if (block.type === 'image') {
          const src = safeUrl(block.src);

          if (!src) {
            return null;
          }

          return (
            // eslint-disable-next-line @next/next/no-img-element -- lesson markdown may reference arbitrary remote images that are not known at build time
            <img
              alt={block.alt}
              decoding="async"
              key={key}
              loading="lazy"
              src={src}
            />
          );
        }

        if (block.type === 'table') {
          return (
            <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0" key={key}>
              <table>
                <thead>
                  <tr>
                    {block.header.map((cell, cellIndex) => (
                      <th key={`${key}-h-${cellIndex}`} scope="col">
                        {renderInline(cell, key)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, rowIndex) => (
                    <tr key={`${key}-r-${rowIndex}`}>
                      {row.map((cell, cellIndex) => (
                        <td key={`${key}-c-${rowIndex}-${cellIndex}`}>
                          {renderInline(cell, key)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        if (block.type === 'divider') {
          return <hr key={key} />;
        }

        return <p key={key}>{renderInline(block.text, key)}</p>;
      })}
    </div>
  );
}

async function getBaseUrl() {
  const headerList = await headers();
  const host = headerList.get('host');
  const protocol = headerList.get('x-forwarded-proto') ?? 'http';

  if (!host) {
    return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  }

  return `${protocol}://${host}`;
}

async function getLessonData(
  courseId: string,
  moduleId: string,
  lessonId: string
) {
  const baseUrl = await getBaseUrl();
  const headerList = await headers();
  const cookie = headerList.get('cookie');
  const response = await fetch(
    `${baseUrl}/api/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`,
    {
      cache: 'no-store',
      headers: cookie ? { cookie } : undefined,
    }
  );

  if (response.status === 404) {
    notFound();
  }

  if (!response.ok) {
    throw new Error('Não foi possível carregar o conteúdo da aula.');
  }

  return (await response.json()) as LessonResponse;
}

function LessonToc({ headings }: { headings: Heading[] }) {
  if (headings.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Seções desta aula"
      className="mt-4 rounded-xl border border-line bg-ink-raised p-4"
    >
      <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted">
        Nesta aula
      </h2>
      <ul className="mt-3 space-y-1">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              className={`block rounded px-2 py-1.5 text-sm text-muted transition-colors duration-200 hover:bg-surface hover:text-white ${
                heading.level > 2 ? 'pl-5' : ''
              }`}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export const dynamicParams = true;

export default async function LessonPage(
  props: PageProps<'/courses/[courseId]/modules/[moduleId]/lessons/[lessonId]'>
) {
  const { courseId, moduleId, lessonId } = await props.params;
  const lessonData = await getLessonData(courseId, moduleId, lessonId);
  const { lesson, module, course, outline, navigation } = lessonData;
  const { headings } = parseMarkdown(lesson.content ?? '');

  const completedCount = outline.filter((item) => item.isCompleted).length;
  const progress = outline.length === 0 ? 0 : completedCount / outline.length;
  const isCompleted = Boolean(lesson.isCompleted);

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
      <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
        <LessonSidebar
          lessons={outline}
          moduleTitle={module.title}
          progress={progress}
        />
        <LessonToc headings={headings} />
      </div>

      <main className="min-w-0">
        <header className="course-reveal rounded-xl border border-line bg-ink-raised p-6 sm:p-8">
          <nav
            aria-label="Trilha"
            className="text-sm font-medium text-brand-text"
          >
            <Link href="/dashboard" className="hover:underline">
              {course.title}
            </Link>
            <span aria-hidden="true" className="px-2 text-muted">
              /
            </span>
            <span className="text-muted">{module.title}</span>
          </nav>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {lesson.title}
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-muted">
            {lesson.description}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {isCompleted ? (
              <span className="inline-flex items-center gap-2 rounded-lg border border-brand/40 bg-brand/10 px-4 py-2.5 text-sm font-semibold text-brand-text">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="M4.5 10.5 8 14l7.5-8" />
                </svg>
                Aula concluída
              </span>
            ) : (
              <form
                action={`/api/courses/${course.id}/modules/${module.id}/lessons/${lesson.lesson_id}/complete`}
                method="post"
              >
                <button
                  type="submit"
                  className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-[background-color,transform] duration-200 ease-out-soft hover:scale-[1.02] hover:bg-brand-strong active:scale-[0.98]"
                >
                  Marcar como concluída
                </button>
              </form>
            )}

            <p className="text-sm text-muted">
              {completedCount} de {outline.length} aulas concluídas
            </p>
          </div>
        </header>

        {lesson.learning_objectives?.length ? (
          <section className="course-reveal course-reveal-1 mt-6 rounded-xl border border-line bg-ink-raised p-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-brand-text">
              Objetivos de aprendizagem
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {lesson.learning_objectives.map((objective) => (
                <li
                  className="flex items-start gap-3 rounded-lg border border-line bg-surface px-4 py-3 text-sm leading-6 text-muted"
                  key={objective}
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mt-1 h-4 w-4 shrink-0 text-brand"
                  >
                    <path d="M4.5 10.5 8 14l7.5-8" />
                  </svg>
                  {objective}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <article className="course-reveal course-reveal-2 mt-6">
          <MarkdownContent markdown={lesson.content ?? ''} />
        </article>

        {lesson.examples?.length ? (
          <section className="course-reveal course-reveal-3 mt-8">
            <h2 className="text-sm font-bold uppercase tracking-widest text-brand-text">
              Exemplos
            </h2>
            <div className="mt-4 space-y-4">
              {lesson.examples.map((example) => (
                <section
                  className="rounded-xl border border-line bg-ink-raised p-5 sm:p-6"
                  key={example.title}
                >
                  <h3 className="text-lg font-bold text-white">
                    {example.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    {example.description}
                  </p>
                  <CodeBlock
                    code={example.code_or_diagram}
                    caption="Exemplo"
                  />
                </section>
              ))}
            </div>
          </section>
        ) : null}

        {lesson.exercises?.length ? (
          <section className="course-reveal course-reveal-4 mt-8">
            <h2 className="text-sm font-bold uppercase tracking-widest text-brand-text">
              Quiz
            </h2>
            <div className="mt-4 space-y-4">
              {lesson.exercises.map((exercise, index) => (
                <QuizCard
                  exercise={{
                    id: exercise.id,
                    question: exercise.question,
                    type: exercise.type,
                    options: exercise.options,
                    correctAnswer: exercise.correct_answer,
                    explanation: exercise.explanation,
                  }}
                  index={index}
                  key={exercise.id}
                />
              ))}
            </div>
          </section>
        ) : null}

        <nav
          aria-label="Navegação entre aulas"
          className="mt-8 grid gap-3 sm:grid-cols-2"
        >
          {navigation.previous ? (
            <Link
              className="rounded-xl border border-line bg-ink-raised p-4 text-sm transition-colors duration-200 hover:border-brand"
              href={navigation.previous.href}
            >
              <span className="block text-muted">Aula anterior</span>
              <span className="mt-1 block font-semibold text-white">
                {navigation.previous.title}
              </span>
            </Link>
          ) : (
            <p className="rounded-xl border border-line bg-ink-raised p-4 text-sm text-muted/70">
              Esta é a primeira aula do módulo.
            </p>
          )}

          {navigation.next ? (
            <Link
              className="rounded-xl border border-line bg-ink-raised p-4 text-right text-sm transition-colors duration-200 hover:border-brand sm:col-start-2"
              href={navigation.next.href}
            >
              <span className="block text-muted">Próxima aula</span>
              <span className="mt-1 block font-semibold text-white">
                {navigation.next.title}
              </span>
            </Link>
          ) : (
            <p className="rounded-xl border border-line bg-ink-raised p-4 text-right text-sm text-muted/70 sm:col-start-2">
              Você chegou ao fim do módulo.
            </p>
          )}
        </nav>
      </main>
    </div>
  );
}
