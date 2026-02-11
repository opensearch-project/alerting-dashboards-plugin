import { BuildSuggestionsArgs } from './types';
import {
  COMMANDS,
  CLAUSE,
  LOGICAL,
  BOOL_FUNCS,
  OPERATORS,
  CONVERTED_TYPES,
  INTERVAL_UNITS,
  SPAN_UNITS,
  AGGS,
  MATH_FUNCS,
  DATE_FUNCS,
  TEXT_FUNCS,
  RELEVANCE_FUNCS,
  RELEVANCE_ARGS,
  FIELD_KEYWORDS,
  DATASET_TYPES,
  KMEANS_ARGS,
  AD_ARGS,
  CMD_ARGS_MISC,
  DEFAULT_FIELDS,
} from './pplDictionary';

type Item = {
  label: string;
  kind?: number;
  insertText?: string;
  detail?: string;
  documentation?: string;
  sortText?: string;
  insertTextRules?: number;
  command?: { id: string; title: string };
};

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

// STRICT prefix filter (case-insensitive)
function startsWithInsensitive(label: string, prefix: string): boolean {
  if (!prefix) return true;
  return label.toLowerCase().startsWith(prefix.toLowerCase());
}

function sanitizeLabel(label: string) {
  // strip paired quotes/backticks for prefix compare
  if (
    (label.startsWith('`') && label.endsWith('`')) ||
    (label.startsWith('"') && label.endsWith('"')) ||
    (label.startsWith("'") && label.endsWith("'"))
  ) {
    return label.slice(1, -1);
  }
  return label;
}

function filterByPrefixStrict(list: string[], prefix: string): string[] {
  const p = prefix ?? '';
  return list.filter((s) => startsWithInsensitive(sanitizeLabel(s), p));
}

function currentPrefix(code: string, offset: number): string {
  let i = offset - 1;
  while (i >= 0) {
    const ch = code[i];
    if (!/[A-Za-z0-9_@.`]/.test(ch)) break;
    i--;
  }
  return code.slice(i + 1, offset);
}

function asKind(monaco: any, label: string): number {
  const U = label.toUpperCase();
  if (
    COMMANDS.includes(U) ||
    CLAUSE.includes(U) ||
    LOGICAL.includes(U) ||
    DATASET_TYPES.includes(U)
  ) {
    return monaco.languages.CompletionItemKind.Keyword;
  }
  if (
    AGGS.includes(U) ||
    MATH_FUNCS.includes(U) ||
    DATE_FUNCS.includes(U) ||
    TEXT_FUNCS.includes(U) ||
    RELEVANCE_FUNCS.includes(U)
  ) {
    return monaco.languages.CompletionItemKind.Function;
  }
  if (FIELD_KEYWORDS.includes(U)) return monaco.languages.CompletionItemKind.Keyword;
  if (OPERATORS.includes(label)) return monaco.languages.CompletionItemKind.Operator;
  if (CONVERTED_TYPES.includes(U)) return monaco.languages.CompletionItemKind.TypeParameter;
  if (label.startsWith('_') || label.includes('.')) return monaco.languages.CompletionItemKind.Field;
  return monaco.languages.CompletionItemKind.Text;
}

function snip(label: string, body: string, detail: string): Item {
  return {
    label,
    insertText: body,
    detail,
    sortText: '0000', // boost snippets
  } as Item;
}

function wrapAsMonaco(items: Item[], range: any, monaco: any): any[] {
  return items.map((it, i) => {
    const hasSnippet = !!it.insertText && it.insertText.includes('$');
    return {
      label: it.label,
      kind: asKind(monaco, it.label),
      range,
      detail: it.detail,
      documentation: it.documentation,
      insertText: it.insertText ?? it.label,
      sortText: it.sortText ?? String(1000 + i),
      insertTextRules: hasSnippet
        ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
        : undefined,
      command: { id: 'editor.action.triggerSuggest', title: 'Trigger Next Suggestion' },
    };
  });
}

export function buildSuggestions({
  code,
  offset,
  scope,
  range,
  monaco,
  userFields = [],
  userIndices = [],
  extraKeywords = [],
}: BuildSuggestionsArgs) {
  const prefix = currentPrefix(code, offset);

  // reusable pools
  const FIELDS = uniq([...DEFAULT_FIELDS, ...userFields]);
  const INDICES = uniq(userIndices);

  // helpful snippets (grammar-aware)
  const SNIPPETS: Item[] = [
    snip('SEARCH SOURCE =', 'SEARCH SOURCE = ${1:index-*}', 'Start a search from a source'),
    snip('SEARCH INDEX =', 'SEARCH INDEX = ${1:index-*}', 'Start a search from an index'),
    snip('WHERE …', 'WHERE ${1:field} = ${2:value}', 'Filter rows'),
    snip('FIELDS …', 'FIELDS ${1:field1}, ${2:field2}', 'Project fields'),
    snip('RENAME …', 'RENAME ${1:old} AS ${2:new}', 'Rename a field'),
    snip('STATS COUNT()', 'STATS COUNT() BY ${1:field}', 'Aggregation with grouping'),
    snip(
      'STATS PERCENTILE',
      'STATS PERCENTILE<${1:95}>(${2:field}) BY ${3:field}',
      'Percentile agg'
    ),
    snip('BY SPAN()', 'BY SPAN(${1:@timestamp}, ${2:1}, ${3:MINUTE})', 'Time bucketing'),
    snip('SORT +field', 'SORT +${1:field}', 'Sort ascending (+)'),
    snip('SORT -field', 'SORT -${1:field}', 'Sort descending (-)'),
    snip('TOP N BY', 'TOP ${1:10} ${2:field} BY ${3:field}', 'Top-N'),
    snip('HEAD N', 'HEAD ${1:100}', 'Limit rows'),
    snip('DEDUP field', 'DEDUP ${1:field}', 'Remove duplicates'),
    snip('EVAL new = expr', 'EVAL ${1:new_field} = ${2:expression}', 'Compute field'),
    snip('PARSE', 'PARSE ${1:message} ${2:"pattern"}', 'Parse values from text'),
    snip('GROK', 'GROK ${1:message} ${2:"%{COMBINEDAPACHELOG}"}', 'Grok parse'),
    snip('MATCH', 'MATCH(${1:field}, ${2:"query"})', 'Relevance query'),
    snip(
      'SIMPLE_QUERY_STRING',
      'SIMPLE_QUERY_STRING([${1:field}^${2:1}], ${3:"query"}, ${4:OPERATOR}=${5:AND})',
      'Relevance (multi-field)'
    ),
  ];

  // Base dictionaries by scope (kept broad but grammar-aligned)
  let pool: string[] = [];
  let extra: Item[] = [];

  switch (scope) {
    case 'Start':
    case 'AfterPipe':
      pool = uniq([...COMMANDS, ...CLAUSE, 'DESC', 'DATASOURCES']);
      extra = SNIPPETS.filter((s) =>
        ['SEARCH SOURCE =', 'SEARCH INDEX =', 'HEAD N', 'TOP N BY'].some((x) =>
          s.label.startsWith(x)
        )
      );
      break;

    case 'AfterSearch':
      // SEARCH … → FROM/SOURCE/INDEX or start logical expression
      pool = uniq(['SOURCE', 'INDEX', 'WHERE', ...LOGICAL, ...FIELDS, ...INDICES]);
      extra = SNIPPETS.filter((s) => s.label.startsWith('SEARCH ')).concat(
        SNIPPETS.filter((s) => s.label.startsWith('WHERE'))
      );
      break;

    case 'AfterFromOrSourceOrIndex':
      // Expect table sources, then either WHERE or pipe commands
      pool = uniq([...INDICES, ...DATASET_TYPES, 'WHERE', '|']);
      extra = SNIPPETS.filter((s) => s.label.startsWith('WHERE')).concat(
        SNIPPETS.filter((s) => s.label === 'BY SPAN()')
      );
      break;

    case 'AfterWhere':
      // Expressions: fields + funcs + operators + booleans
      pool = uniq([
        ...FIELDS,
        ...MATH_FUNCS,
        ...DATE_FUNCS,
        ...TEXT_FUNCS,
        ...RELEVANCE_FUNCS,
        ...BOOL_FUNCS,
        ...CONVERTED_TYPES,
      ]);
      extra = SNIPPETS.filter((s) => s.label.startsWith('MATCH'));
      break;

    case 'AfterFields':
      pool = uniq(['+', '-', '*', ...FIELDS]);
      break;

    case 'AfterStats':
      pool = uniq([...AGGS, 'BY', ...FIELDS]);
      extra = SNIPPETS.filter((s) => s.label.startsWith('STATS'));
      break;

    case 'AfterBy':
      pool = uniq(['SPAN', ...FIELDS, ...SPAN_UNITS]);
      extra = SNIPPETS.filter((s) => s.label === 'BY SPAN()');
      break;

    case 'AfterSort':
      pool = uniq(['+', '-', 'AUTO', 'STR', 'IP', 'NUM', ...FIELDS]);
      extra = SNIPPETS.filter((s) => s.label.startsWith('SORT '));
      break;

    case 'Generic':
    default:
      pool = uniq([
        ...COMMANDS,
        ...CLAUSE,
        ...LOGICAL,
        ...AGGS,
        ...MATH_FUNCS,
        ...DATE_FUNCS,
        ...TEXT_FUNCS,
        ...RELEVANCE_FUNCS,
        ...RELEVANCE_ARGS,
        ...CONVERTED_TYPES,
        ...INTERVAL_UNITS,
        ...SPAN_UNITS,
        ...FIELDS,
        ...DATASET_TYPES,
        ...KMEANS_ARGS,
        ...AD_ARGS,
        ...CMD_ARGS_MISC,
        ...extraKeywords,
      ]);
      break;
  }

  // STRICT prefix filter for both plain words and snippets
  const filteredWords = filterByPrefixStrict(pool, prefix);
  const filteredSnips = SNIPPETS.concat(extra).filter((s) =>
    startsWithInsensitive(s.label, prefix)
  );

  const wordItems: Item[] = filteredWords.map((w, idx) => ({
    label: w,
    sortText: String(2000 + idx),
  }));

  const items = wrapAsMonaco(uniq([...filteredSnips, ...wordItems]), range, monaco).slice(0, 200);
  return items;
}


