import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export type LessonExample = {
  title: string;
  description: string;
  code_or_diagram: string;
};

export type LessonExercise = {
  id: string;
  type: string;
  question: string;
  options?: string[];
  correct_answer: string;
  explanation: string;
};

export type Lesson = {
  lesson_id: string;
  title: string;
  description: string;
  learning_objectives: string[];
  content: string;
  examples?: LessonExample[];
  exercises?: LessonExercise[];
};

export type ModuleContent = {
  module_id: string;
  title: string;
  description: string;
  lessons: Lesson[];
};

const MODULE_CONTENT_FILE = 'module-1-content.json';

/**
 * The seed files in `public/` are model output that may be prefixed and
 * suffixed with prose before/after the JSON payload, and they use CRLF line
 * endings. Locating the payload with a fixed string therefore breaks on
 * checkout. Scan for the first balanced object instead.
 */
function extractJsonPayload(rawContent: string): string {
  const marker = rawContent.indexOf('"module_id"');

  if (marker === -1) {
    throw new Error('Module content JSON payload was not found.');
  }

  const start = rawContent.lastIndexOf('{', marker);

  if (start === -1) {
    throw new Error('Module content JSON payload was not found.');
  }

  let depth = 0;
  let isInsideString = false;
  let isEscaped = false;

  for (let index = start; index < rawContent.length; index += 1) {
    const character = rawContent[index];

    if (isEscaped) {
      isEscaped = false;
      continue;
    }

    if (character === '\\') {
      isEscaped = true;
      continue;
    }

    if (character === '"') {
      isInsideString = !isInsideString;
      continue;
    }

    if (isInsideString) {
      continue;
    }

    if (character === '{') {
      depth += 1;
    } else if (character === '}') {
      depth -= 1;

      if (depth === 0) {
        return rawContent.slice(start, index + 1);
      }
    }
  }

  throw new Error('Module content JSON payload is not balanced.');
}

export async function readModuleContent(): Promise<ModuleContent> {
  const filePath = join(process.cwd(), 'public', MODULE_CONTENT_FILE);
  const rawContent = await readFile(filePath, 'utf8');

  return JSON.parse(extractJsonPayload(rawContent)) as ModuleContent;
}

export function normalizeTitle(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}
