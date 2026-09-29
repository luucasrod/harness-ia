import type { ReactNode } from 'react';

export type CodeLanguage =
  | 'typescript'
  | 'tsx'
  | 'javascript'
  | 'json'
  | 'bash'
  | 'sql'
  | 'yaml'
  | 'python'
  | 'dockerfile'
  | 'hcl'
  | 'prisma'
  | 'css'
  | 'html'
  | 'markdown'
  | 'text';

type TokenKind =
  | 'plain'
  | 'comment'
  | 'string'
  | 'number'
  | 'keyword'
  | 'builtin'
  | 'function'
  | 'type'
  | 'operator'
  | 'punctuation'
  | 'tag'
  | 'attribute'
  | 'variable';

type Token = {
  kind: TokenKind;
  text: string;
};

const TOKEN_CLASS: Record<TokenKind, string> = {
  plain: 'text-[#E6EDF3]',
  comment: 'text-[#7D8A99] italic',
  string: 'text-[#9AE6B4]',
  number: 'text-[#F2CC8F]',
  keyword: 'text-[#7CA9FF]',
  builtin: 'text-[#6BD1D9]',
  function: 'text-[#D2A8FF]',
  type: 'text-[#6BD1D9]',
  operator: 'text-[#8B98A5]',
  punctuation: 'text-[#7E8B99]',
  tag: 'text-[#7CA9FF]',
  attribute: 'text-[#C3E88D]',
  variable: 'text-[#F2CC8F]',
};

const LANGUAGE_ALIASES: Record<string, CodeLanguage> = {
  ts: 'typescript',
  typescript: 'typescript',
  tsx: 'tsx',
  js: 'javascript',
  jsx: 'javascript',
  javascript: 'javascript',
  node: 'javascript',
  json: 'json',
  jsonc: 'json',
  bash: 'bash',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  console: 'bash',
  sql: 'sql',
  postgres: 'sql',
  prisma: 'prisma',
  yaml: 'yaml',
  yml: 'yaml',
  py: 'python',
  python: 'python',
  dockerfile: 'dockerfile',
  docker: 'dockerfile',
  hcl: 'hcl',
  terraform: 'hcl',
  tf: 'hcl',
  css: 'css',
  scss: 'css',
  html: 'html',
  xml: 'html',
  md: 'markdown',
  markdown: 'markdown',
  text: 'text',
  txt: 'text',
  plain: 'text',
  mermaid: 'text',
  diff: 'text',
  gitignore: 'text',
};

const JS_KEYWORDS = new Set([
  'abstract', 'as', 'async', 'await', 'break', 'case', 'catch', 'class', 'const',
  'continue', 'declare', 'default', 'delete', 'do', 'else', 'enum', 'export',
  'extends', 'finally', 'for', 'from', 'function', 'get', 'if', 'implements',
  'import', 'in', 'instanceof', 'interface', 'is', 'keyof', 'let', 'namespace',
  'new', 'of', 'private', 'protected', 'public', 'readonly', 'return', 'satisfies',
  'set', 'static', 'super', 'switch', 'this', 'throw', 'try', 'type', 'typeof',
  'var', 'void', 'while', 'yield', 'override', 'infer', 'asserts',
]);

const JS_BUILTINS = new Set([
  'Array', 'Boolean', 'Date', 'Error', 'JSON', 'Map', 'Math', 'Number', 'Object',
  'Promise', 'Proxy', 'RegExp', 'Set', 'String', 'Symbol', 'WeakMap', 'WeakSet',
  'BigInt', 'console', 'document', 'fetch', 'globalThis', 'navigator', 'process',
  'window',
]);

const SQL_KEYWORDS = new Set([
  'add', 'all', 'alter', 'and', 'as', 'asc', 'begin', 'between', 'by', 'case',
  'column', 'commit', 'constraint', 'create', 'cross', 'database', 'default',
  'delete', 'desc', 'distinct', 'drop', 'else', 'end', 'exists', 'foreign',
  'from', 'full', 'group', 'having', 'if', 'in', 'index', 'inner', 'insert',
  'into', 'is', 'join', 'key', 'left', 'like', 'limit', 'not', 'null', 'offset',
  'on', 'or', 'order', 'outer', 'primary', 'references', 'right', 'rollback',
  'select', 'set', 'table', 'then', 'transaction', 'union', 'unique', 'update',
  'using', 'values', 'view', 'when', 'where', 'with',
]);

const SQL_BUILTINS = new Set([
  'avg', 'boolean', 'count', 'current_timestamp', 'date', 'integer', 'jsonb',
  'max', 'min', 'now', 'numeric', 'serial', 'sum', 'text', 'timestamp', 'uuid',
  'varchar',
]);

const PRISMA_KEYWORDS = new Set([
  'datasource', 'generator', 'model', 'enum', 'type', 'view', 'provider',
  'url', 'relation', 'onDelete', 'onUpdate', 'default', 'unique', 'id',
  'createdAt', 'updatedAt', 'map', 'db', 'env',
]);

const BASH_BUILTINS = new Set([
  'cd', 'echo', 'exit', 'export', 'source', 'set', 'unset', 'read', 'local',
  'return', 'function', 'if', 'then', 'else', 'elif', 'fi', 'for', 'while',
  'do', 'done', 'case', 'esac', 'in', 'sudo', 'apt', 'apt-get', 'npm', 'npx',
  'node', 'pnpm', 'yarn', 'git', 'docker', 'docker-compose', 'curl', 'mkdir',
  'rm', 'cp', 'mv', 'ls', 'cd', 'cat', 'grep', 'chmod', 'chown', 'make',
]);

const PYTHON_KEYWORDS = new Set([
  'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue', 'def',
  'del', 'elif', 'else', 'except', 'finally', 'for', 'from', 'global', 'if',
  'import', 'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise',
  'return', 'try', 'while', 'with', 'yield', 'match', 'case',
]);

const PYTHON_BUILTINS = new Set([
  'True', 'False', 'None', 'self', 'print', 'len', 'range', 'dict', 'list',
  'set', 'tuple', 'str', 'int', 'float', 'bool', 'open', 'super', 'enumerate',
  'isinstance', 'Exception',
]);

type Rule = {
  kind: TokenKind;
  pattern: RegExp;
};

const NUMBER = /\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/;

const JS_RULES: Rule[] = [
  { kind: 'comment', pattern: /\/\/[^\n]*/g },
  { kind: 'comment', pattern: /\/\*[\s\S]*?\*\//g },
  { kind: 'string', pattern: /`(?:\\[\s\S]|[^\\`])*`/g },
  { kind: 'string', pattern: /"(?:\\[\s\S]|[^\\"\n])*"/g },
  { kind: 'string', pattern: /'(?:\\[\s\S]|[^\\'\n])*'/g },
  { kind: 'number', pattern: NUMBER },
  { kind: 'keyword', pattern: new RegExp(`\\b(?:${[...JS_KEYWORDS].join('|')})\\b`, 'g') },
  { kind: 'type', pattern: new RegExp(`\\b(?:${[...JS_BUILTINS].join('|')})\\b`, 'g') },
  { kind: 'function', pattern: /(?<=\b(?:function|class|interface|type|enum)\s)[A-Za-z_$][\w$]*/g },
  { kind: 'function', pattern: /[A-Za-z_$][\w$]*(?=\s*\()/g },
  { kind: 'tag', pattern: /<\/?[A-Za-z][\w.-]*/g },
  { kind: 'variable', pattern: /[$][\w$]+/g },
  { kind: 'operator', pattern: /=>|[+\-*/%<>=!&|?:~^]+/g },
  { kind: 'punctuation', pattern: /[{}[\]();,.]/g },
];

const JSON_RULES: Rule[] = [
  { kind: 'attribute', pattern: /"(?:\\[\s\S]|[^\\"])*"(?=\s*:)/g },
  { kind: 'string', pattern: /"(?:\\[\s\S]|[^\\"])*"/g },
  { kind: 'number', pattern: /-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g },
  { kind: 'keyword', pattern: /\b(?:true|false|null)\b/g },
  { kind: 'punctuation', pattern: /[{}[\],:]/g },
];

const SQL_RULES: Rule[] = [
  { kind: 'comment', pattern: /--[^\n]*/g },
  { kind: 'comment', pattern: /\/\*[\s\S]*?\*\//g },
  { kind: 'string', pattern: /'(?:''|[^'])*'/g },
  { kind: 'string', pattern: /"(?:[^"])*"/g },
  { kind: 'number', pattern: NUMBER },
  { kind: 'keyword', pattern: new RegExp(`\\b(?:${[...SQL_KEYWORDS].join('|')})\\b`, 'gi') },
  { kind: 'type', pattern: new RegExp(`\\b(?:${[...SQL_BUILTINS].join('|')})\\b`, 'gi') },
  { kind: 'variable', pattern: /@\w+/g },
  { kind: 'function', pattern: /[A-Za-z_][\w$]*(?=\s*\()/g },
  { kind: 'operator', pattern: /[+\-*/%<>=!|]+/g },
  { kind: 'punctuation', pattern: /[()[\];,.]/g },
];

const PRISMA_RULES: Rule[] = [
  { kind: 'comment', pattern: /\/\/[^\n]*/g },
  { kind: 'comment', pattern: /\/\*[\s\S]*?\*\//g },
  { kind: 'string', pattern: /"(?:\\[\s\S]|[^\\"])*"/g },
  { kind: 'attribute', pattern: /@[A-Za-z_][\w.]*/g },
  { kind: 'number', pattern: NUMBER },
  {
    kind: 'keyword',
    pattern: new RegExp(`\\b(?:${[...PRISMA_KEYWORDS].join('|')})\\b`, 'g'),
  },
  { kind: 'type', pattern: /\b(?:[A-Z][A-Za-z0-9]*)(?=\[|\s|$)/g },
  { kind: 'function', pattern: /[A-Za-z_][\w$]*(?=\s*\()/g },
  { kind: 'operator', pattern: /\?|\|/g },
  { kind: 'punctuation', pattern: /[{}[\]();,.:]/g },
];

const BASH_RULES: Rule[] = [
  { kind: 'comment', pattern: /#[^\n]*/g },
  { kind: 'string', pattern: /"(?:\\[\s\S]|[^\\"])*"/g },
  { kind: 'string', pattern: /'[^']*'/g },
  { kind: 'variable', pattern: /\$(?:\{[^}]*\}|\w+|[?@#*!$0-9-])/g },
  { kind: 'keyword', pattern: new RegExp(`\\b(?:${[...BASH_BUILTINS].join('|')})\\b`, 'g') },
  { kind: 'operator', pattern: /&&|\|\||[|><]/g },
  { kind: 'function', pattern: /^[ \t]*[a-zA-Z_][\w-]*(?=[ \t]*\(\))|(?<=[|&;]\s)[a-zA-Z_][\w-]*/g },
  { kind: 'operator', pattern: /=/g },
  { kind: 'punctuation', pattern: /[{}[\];()]/g },
];

const YAML_RULES: Rule[] = [
  { kind: 'comment', pattern: /#[^\n]*/g },
  { kind: 'attribute', pattern: /^[ \t]*[-\s]*[A-Za-z_][\w.-]*(?=\s*:)/gm },
  { kind: 'string', pattern: /"(?:\\[\s\S]|[^\\"])*"/g },
  { kind: 'string', pattern: /'(?:''|[^'])*'/g },
  { kind: 'keyword', pattern: /\b(?:true|false|null|yes|no|on|off)\b/g },
  { kind: 'number', pattern: NUMBER },
  { kind: 'variable', pattern: /\$\{[^}]*\}/g },
  { kind: 'punctuation', pattern: /[-:[\]{},|]/g },
];

const PYTHON_RULES: Rule[] = [
  { kind: 'comment', pattern: /#[^\n]*/g },
  { kind: 'string', pattern: /[fFrRbB]{0,2}"""[\s\S]*?"""/g },
  { kind: 'string', pattern: /[fFrRbB]{0,2}'''[\s\S]*?'''/g },
  { kind: 'string', pattern: /[fFrRbB]{0,2}"(?:\\[\s\S]|[^\\"\n])*"/g },
  { kind: 'string', pattern: /[fFrRbB]{0,2}'(?:\\[\s\S]|[^\\'\n])*'/g },
  { kind: 'keyword', pattern: new RegExp(`\\b(?:${[...PYTHON_KEYWORDS].join('|')})\\b`, 'g') },
  { kind: 'type', pattern: new RegExp(`\\b(?:${[...PYTHON_BUILTINS].join('|')})\\b`, 'g') },
  { kind: 'function', pattern: /[A-Za-z_][\w]*(?=\s*\()/g },
  { kind: 'number', pattern: NUMBER },
  { kind: 'operator', pattern: /[+\-*/%<>=!&|^~]+/g },
  { kind: 'punctuation', pattern: /[()[\]{}:,.]/g },
];

const HCL_RULES: Rule[] = [
  { kind: 'comment', pattern: /#[^\n]*/g },
  { kind: 'comment', pattern: /\/\*[\s\S]*?\*\//g },
  { kind: 'string', pattern: /"(?:\\[\s\S]|[^\\"])*"/g },
  { kind: 'attribute', pattern: /^[ \t]*[A-Za-z_][\w-]*(?=\s*=\s*)/gm },
  { kind: 'keyword', pattern: /\b(?:resource|variable|output|provider|module|locals|terraform|for_each|count|depends_on)\b/g },
  { kind: 'number', pattern: NUMBER },
  { kind: 'variable', pattern: /\$\{[^}]*\}/g },
  { kind: 'punctuation', pattern: /[{}[\]():=]/g },
];

const DOCKERFILE_RULES: Rule[] = [
  { kind: 'comment', pattern: /#[^\n]*/g },
  { kind: 'keyword', pattern: /^[ \t]*(?:FROM|RUN|CMD|LABEL|MAINTAINER|EXPOSE|ENV|ADD|COPY|ENTRYPOINT|VOLUME|USER|WORKDIR|ARG|ONBUILD|STOPSIGNAL|HEALTHCHECK|SHELL)\b/gim },
  { kind: 'variable', pattern: /\$\{[^}]*\}|\$[\w]+/g },
  { kind: 'string', pattern: /"(?:\\[\s\S]|[^\\"])*"/g },
  { kind: 'string', pattern: /'(?:[^'])*'/g },
  { kind: 'attribute', pattern: /^[ \t]*--[a-z-]+/gm },
];

const CSS_RULES: Rule[] = [
  { kind: 'comment', pattern: /\/\*[\s\S]*?\*\//g },
  { kind: 'string', pattern: /"(?:\\[\s\S]|[^\\"])*"|'(?:\\[\s\S]|[^\\'])*'/g },
  { kind: 'keyword', pattern: /@[\w-]+/g },
  { kind: 'tag', pattern: /(?<=^|\n)\s*[-a-zA-Z*][^{}\n]*(?=\{)/gm },
  { kind: 'attribute', pattern: /[-a-zA-Z]+(?=\s*:)/g },
  { kind: 'number', pattern: /-?\d*\.?\d+(?:px|rem|em|%|vh|vw|s|ms|deg|fr)?\b/g },
  { kind: 'function', pattern: /[a-zA-Z-]+(?=\()/g },
  { kind: 'variable', pattern: /--[\w-]+|\$[\w-]+/g },
  { kind: 'punctuation', pattern: /[{}();:,]/g },
];

const HTML_RULES: Rule[] = [
  { kind: 'comment', pattern: /<!--[\s\S]*?-->/g },
  { kind: 'tag', pattern: /<\/?[A-Za-z][\w.:-]*/g },
  { kind: 'attribute', pattern: /[A-Za-z_:][\w.:-]*(?==)/g },
  { kind: 'string', pattern: /"(?:[^"])*"|'(?:[^'])*'/g },
  { kind: 'punctuation', pattern: /\/?>|[{}]/g },
];

const MARKDOWN_RULES: Rule[] = [
  { kind: 'keyword', pattern: /^#{1,6}[^\n]*/gm },
  { kind: 'string', pattern: /`[^`\n]+`/g },
  { kind: 'attribute', pattern: /\*\*[^*\n]+\*\*|__[^_\n]+__/g },
  { kind: 'comment', pattern: /\*[^*\n]+\*|_[^_\n]+_/g },
  { kind: 'type', pattern: /\[[^\]\n]*\]\([^\)\n]*\)/g },
  { kind: 'keyword', pattern: /^[ \t]*[-*+][ \t]/gm },
  { kind: 'keyword', pattern: /^[ \t]*\d+\.[ \t]/gm },
  { kind: 'keyword', pattern: /^>[^\n]*/gm },
  { kind: 'punctuation', pattern: /^\s*---+\s*$/gm },
];

const RULES_BY_LANGUAGE: Record<CodeLanguage, Rule[]> = {
  typescript: JS_RULES,
  tsx: JS_RULES,
  javascript: JS_RULES,
  json: JSON_RULES,
  sql: SQL_RULES,
  prisma: PRISMA_RULES,
  bash: BASH_RULES,
  yaml: YAML_RULES,
  python: PYTHON_RULES,
  hcl: HCL_RULES,
  dockerfile: DOCKERFILE_RULES,
  css: CSS_RULES,
  html: HTML_RULES,
  markdown: MARKDOWN_RULES,
  text: [],
};

export function resolveLanguage(language: string | undefined): CodeLanguage {
  if (!language) {
    return 'text';
  }

  return LANGUAGE_ALIASES[language.trim().toLowerCase()] ?? 'text';
}

type Match = {
  index: number;
  end: number;
  kind: TokenKind;
};

/**
 * Single left-to-right pass over the source. Every rule pattern is scanned once
 * and the earliest match wins, so the result does not depend on rule order the
 * way a sequential replace loop would.
 */
function collectMatches(code: string, rules: Rule[]): Match[] {
  const matches: Match[] = [];

  for (const rule of rules) {
    const pattern = new RegExp(rule.pattern.source, rule.pattern.flags.replace('g', '') + 'g');
    let result = pattern.exec(code);

    while (result !== null) {
      const text = result[0];

      if (text.length > 0) {
        matches.push({ index: result.index, end: result.index + text.length, kind: rule.kind });
      }

      if (result.index === pattern.lastIndex) {
        pattern.lastIndex += 1;
      }

      result = pattern.exec(code);
    }
  }

  return matches.sort((left, right) => left.index - right.index || right.end - left.end);
}

function resolveConflicts(matches: Match[]): Match[] {
  const accepted: Match[] = [];
  let furthestEnd = 0;

  // `matches` is sorted by start index, so a candidate only conflicts with the
  // last accepted token when it starts before that token ends.
  for (const match of matches) {
    if (match.index >= furthestEnd) {
      accepted.push(match);
      furthestEnd = match.end;
    }
  }

  return accepted;
}

export function tokenizeCode(code: string, language: CodeLanguage): Token[] {
  const rules = RULES_BY_LANGUAGE[language];

  if (rules.length === 0 || code.length === 0) {
    return [{ kind: 'plain', text: code }];
  }

  const accepted = resolveConflicts(collectMatches(code, rules));
  const tokens: Token[] = [];
  let cursor = 0;

  for (const match of accepted) {
    if (match.index > cursor) {
      tokens.push({ kind: 'plain', text: code.slice(cursor, match.index) });
    }

    tokens.push({ kind: match.kind, text: code.slice(match.index, match.end) });
    cursor = match.end;
  }

  if (cursor < code.length) {
    tokens.push({ kind: 'plain', text: code.slice(cursor) });
  }

  return tokens;
}

export function highlightCode(code: string, language: CodeLanguage): ReactNode[] {
  return tokenizeCode(code, language).map((token, index) => (
    <span className={TOKEN_CLASS[token.kind]} key={`${index}-${token.text.length}`}>
      {token.text}
    </span>
  ));
}

type CodeBlockProps = {
  code: string;
  language?: string;
  /** Rendered instead of the raw source when the snippet is an ASCII diagram. */
  caption?: string;
};

export default function CodeBlock({ code, language, caption }: CodeBlockProps) {
  const resolved = resolveLanguage(language);
  const label = language ? language.toUpperCase() : 'TEXTO';

  return (
    <figure className="code-block group my-6 overflow-hidden rounded-xl border border-line bg-surface">
      <figcaption className="code-block__bar flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
        <span className="font-mono text-xs font-semibold tracking-widest text-muted">
          {label}
        </span>
        {caption ? (
          <span className="truncate text-xs text-muted">{caption}</span>
        ) : null}
      </figcaption>
      <pre className="code-block__body overflow-x-auto px-4 py-4 font-mono text-[13px] leading-6">
        <code className="whitespace-pre">{highlightCode(code, resolved)}</code>
      </pre>
    </figure>
  );
}
