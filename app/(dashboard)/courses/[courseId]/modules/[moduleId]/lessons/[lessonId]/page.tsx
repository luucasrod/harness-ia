import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

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
};

type LessonOutlineItem = {
  id: string;
  title: string;
  description: string;
  order: number;
  isCurrent: boolean;
  href: string;
};

type LessonNavigationItem = {
  id: string;
  title: string;
  href: string;
};

type LessonResponse = {
  course: {
    id: string;
    title: string;
  };
  module: {
    id: string;
    sourceId: string;
    title: string;
    description: string;
  };
  lesson: Lesson;
  outline: LessonOutlineItem[];
  navigation: {
    previous: LessonNavigationItem | null;
    next: LessonNavigationItem | null;
  };
};

type MarkdownBlock =
  | { type: "heading"; level: number; text: string; id: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "code"; language: string; code: string };

type Heading = {
  id: string;
  text: string;
  level: number;
};

function createSlug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function parseMarkdown(markdown: string) {
  const lines = markdown.split(/\r?\n/);
  const blocks: MarkdownBlock[] = [];
  const headings: Heading[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    const fenceMatch = line.match(/^```(\w+)?/);
    if (fenceMatch) {
      const codeLines: string[] = [];
      index += 1;

      while (index < lines.length && !lines[index].startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }

      blocks.push({
        type: "code",
        language: fenceMatch[1] ?? "",
        code: codeLines.join("\n"),
      });
      index += 1;
      continue;
    }

    const headingMatch = line.match(/^(#{2,3})\s+(.+)/);
    if (headingMatch) {
      const text = headingMatch[2].trim();
      const id = createSlug(text);
      const heading = { id, text, level: headingMatch[1].length };

      headings.push(heading);
      blocks.push({ type: "heading", ...heading });
      index += 1;
      continue;
    }

    const unorderedMatch = line.match(/^-\s+(.+)/);
    const orderedMatch = line.match(/^\d+\.\s+(.+)/);
    if (unorderedMatch || orderedMatch) {
      const ordered = Boolean(orderedMatch);
      const items: string[] = [];

      while (index < lines.length) {
        const itemMatch = ordered
          ? lines[index].match(/^\d+\.\s+(.+)/)
          : lines[index].match(/^-\s+(.+)/);

        if (!itemMatch) {
          break;
        }

        items.push(itemMatch[1]);
        index += 1;
      }

      blocks.push({ type: "list", ordered, items });
      continue;
    }

    const paragraphLines = [line.trim()];
    index += 1;

    while (
      index < lines.length &&
      lines[index].trim() &&
      !lines[index].match(/^(#{2,3})\s+(.+)/) &&
      !lines[index].match(/^(-|\d+\.)\s+/) &&
      !lines[index].startsWith("```")
    ) {
      paragraphLines.push(lines[index].trim());
      index += 1;
    }

    blocks.push({ type: "paragraph", text: paragraphLines.join(" ") });
  }

  return { blocks, headings };
}

function renderInline(text: string) {
  return text.split(/(`[^`]+`)/g).map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          className="rounded bg-slate-800 px-1.5 py-0.5 text-[0.85em] text-cyan-200"
          key={`${part}-${index}`}
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    return part;
  });
}

function MarkdownContent({ markdown }: { markdown: string }) {
  const { blocks } = parseMarkdown(markdown);

  return (
    <div className="space-y-5">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          const HeadingTag = block.level === 2 ? "h2" : "h3";
          const className =
            block.level === 2
              ? "scroll-mt-24 pt-3 text-2xl font-semibold text-white"
              : "scroll-mt-24 pt-2 text-xl font-semibold text-slate-100";

          return (
            <HeadingTag className={className} id={block.id} key={block.id}>
              {block.text}
            </HeadingTag>
          );
        }

        if (block.type === "list") {
          const ListTag = block.ordered ? "ol" : "ul";

          return (
            <ListTag
              className={`space-y-2 pl-5 text-sm leading-7 text-slate-300 ${
                block.ordered ? "list-decimal" : "list-disc"
              }`}
              key={`list-${index}`}
            >
              {block.items.map((item) => (
                <li key={item}>{renderInline(item)}</li>
              ))}
            </ListTag>
          );
        }

        if (block.type === "code") {
          return (
            <div
              className="overflow-hidden rounded-lg border border-slate-800 bg-slate-950"
              key={`code-${index}`}
            >
              {block.language ? (
                <div className="border-b border-slate-800 px-4 py-2 text-xs font-semibold uppercase text-cyan-300">
                  {block.language}
                </div>
              ) : null}
              <pre className="overflow-x-auto p-4 text-sm leading-6 text-slate-200">
                <code>{block.code}</code>
              </pre>
            </div>
          );
        }

        return (
          <p
            className="text-sm leading-7 text-slate-300"
            key={`paragraph-${index}`}
          >
            {renderInline(block.text)}
          </p>
        );
      })}
    </div>
  );
}

async function getBaseUrl() {
  const headerList = await headers();
  const host = headerList.get("host");
  const protocol = headerList.get("x-forwarded-proto") ?? "http";

  if (!host) {
    return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  }

  return `${protocol}://${host}`;
}

async function getLessonData(
  courseId: string,
  moduleId: string,
  lessonId: string,
) {
  const baseUrl = await getBaseUrl();
  const response = await fetch(
    `${baseUrl}/api/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`,
    { cache: "no-store" },
  );

  if (response.status === 404) {
    notFound();
  }

  if (!response.ok) {
    throw new Error("Unable to load lesson data.");
  }

  return (await response.json()) as LessonResponse;
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900 p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-cyan-300">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default async function LessonPage(
  props: PageProps<
    "/courses/[courseId]/modules/[moduleId]/lessons/[lessonId]"
  >,
) {
  const { courseId, moduleId, lessonId } = await props.params;
  const lessonData = await getLessonData(courseId, moduleId, lessonId);
  const { lesson, module, course, outline, navigation } = lessonData;
  const { headings } = parseMarkdown(lesson.content);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <main className="min-w-0 space-y-6">
        <section className="rounded-lg border border-slate-800 bg-slate-900 p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-medium text-cyan-300">
                {course.title} / {module.title}
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-white">
                {lesson.title}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                {lesson.description}
              </p>
            </div>

            <form
              action={`/api/courses/${course.id}/modules/${module.id}/lessons/${lesson.lesson_id}/complete`}
              method="post"
            >
              <button
                type="submit"
                className="h-11 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-md shadow-blue-950/30 transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                Complete lesson
              </button>
            </form>
          </div>
        </section>

        <Panel title="Learning objectives">
          <ul className="grid gap-3 sm:grid-cols-2">
            {lesson.learning_objectives.map((objective) => (
              <li
                className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-sm leading-6 text-slate-300"
                key={objective}
              >
                {objective}
              </li>
            ))}
          </ul>
        </Panel>

        <article className="rounded-lg border border-slate-800 bg-slate-900 p-6">
          <MarkdownContent markdown={lesson.content} />
        </article>

        {lesson.examples?.length ? (
          <Panel title="Examples">
            <div className="space-y-4">
              {lesson.examples.map((example) => (
                <section
                  className="rounded-lg border border-slate-800 bg-slate-950 p-4"
                  key={example.title}
                >
                  <h3 className="text-base font-semibold text-white">
                    {example.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {example.description}
                  </p>
                  <pre className="mt-4 overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm leading-6 text-slate-200">
                    <code>{example.code_or_diagram}</code>
                  </pre>
                </section>
              ))}
            </div>
          </Panel>
        ) : null}

        {lesson.exercises?.length ? (
          <Panel title="Exercises">
            <div className="space-y-4">
              {lesson.exercises.map((exercise) => (
                <section
                  className="rounded-lg border border-slate-800 bg-slate-950 p-4"
                  key={exercise.id}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-base font-semibold text-white">
                      {exercise.question}
                    </h3>
                    <span className="w-fit rounded bg-slate-800 px-2 py-1 text-xs font-semibold uppercase text-cyan-300">
                      {exercise.type.replaceAll("_", " ")}
                    </span>
                  </div>
                  {exercise.options?.length ? (
                    <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                      {exercise.options.map((option) => (
                        <li
                          className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-300"
                          key={option}
                        >
                          {option}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <p className="mt-4 text-sm leading-6 text-slate-400">
                    {exercise.explanation}
                  </p>
                </section>
              ))}
            </div>
          </Panel>
        ) : null}

        <nav
          aria-label="Lesson navigation"
          className="grid gap-3 sm:grid-cols-2"
        >
          {navigation.previous ? (
            <Link
              className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-sm transition hover:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              href={navigation.previous.href}
            >
              <span className="block text-slate-400">Previous</span>
              <span className="mt-1 block font-semibold text-white">
                {navigation.previous.title}
              </span>
            </Link>
          ) : (
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-sm text-slate-500">
              No previous lesson
            </div>
          )}

          {navigation.next ? (
            <Link
              className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-right text-sm transition hover:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              href={navigation.next.href}
            >
              <span className="block text-slate-400">Next</span>
              <span className="mt-1 block font-semibold text-white">
                {navigation.next.title}
              </span>
            </Link>
          ) : (
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-right text-sm text-slate-500">
              No next lesson
            </div>
          )}
        </nav>
      </main>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <section className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-cyan-300">
            Lesson outline
          </h2>
          <nav className="mt-4 space-y-2" aria-label="Module lessons">
            {outline.map((item) => (
              <Link
                aria-current={item.isCurrent ? "page" : undefined}
                className={`block rounded-lg border p-3 text-sm transition focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
                  item.isCurrent
                    ? "border-blue-500 bg-blue-600/20 text-white"
                    : "border-slate-800 bg-slate-950 text-slate-300 hover:border-cyan-400"
                }`}
                href={item.href}
                key={item.id}
              >
                <span className="text-xs font-semibold text-cyan-300">
                  Lesson {item.order}
                </span>
                <span className="mt-1 block font-semibold">{item.title}</span>
              </Link>
            ))}
          </nav>
        </section>

        {headings.length ? (
          <section className="rounded-lg border border-slate-800 bg-slate-900 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-cyan-300">
              On this page
            </h2>
            <nav className="mt-4 space-y-2" aria-label="Lesson sections">
              {headings.map((heading) => (
                <a
                  className={`block rounded px-2 py-1.5 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
                    heading.level === 3 ? "ml-3" : ""
                  }`}
                  href={`#${heading.id}`}
                  key={heading.id}
                >
                  {heading.text}
                </a>
              ))}
            </nav>
          </section>
        ) : null}
      </aside>
    </div>
  );
}
