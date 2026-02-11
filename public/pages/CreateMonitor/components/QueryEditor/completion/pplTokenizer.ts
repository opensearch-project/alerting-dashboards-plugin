import { CompletionScope, Token } from './types';

const isWordChar = (ch: string) =>
  /[A-Za-z0-9_@.]/.test(ch) || ch === '*' || ch === '`' || ch === '\'' || ch === '"';

export function tokenize(input: string): Token[] {
  const tks: Token[] = [];
  let i = 0;

  while (i < input.length) {
    const ch = input[i];

    if (/\s/.test(ch)) {
      const start = i;
      while (i < input.length && /\s/.test(input[i])) i++;
      tks.push({ value: input.slice(start, i), start, end: i, kind: 'space' });
      continue;
    }

    if (ch === '"' || ch === '\'' || ch === '`') {
      const quote = ch;
      const start = i++;
      while (i < input.length) {
        const c = input[i++];
        if (c === quote) break;
        if (c === '\\') i++;
      }
      tks.push({ value: input.slice(start, i), start, end: i, kind: 'string' });
      continue;
    }

    if (isWordChar(ch)) {
      const start = i;
      while (i < input.length && isWordChar(input[i])) i++;
      tks.push({ value: input.slice(start, i), start, end: i, kind: 'word' });
      continue;
    }

    const start = i++;
    tks.push({ value: input.slice(start, i), start, end: i, kind: 'symbol' });
  }

  return tks;
}

function lastNonSpace(tokens: Token[], beforeOffset?: number): Token | undefined {
  for (let i = tokens.length - 1; i >= 0; i--) {
    const t = tokens[i];
    if (beforeOffset != null && t.end > beforeOffset) continue;
    if (t.kind !== 'space') return t;
  }
  return undefined;
}

function prevWord(tokens: Token[], fromIdx: number): string | undefined {
  for (let i = fromIdx; i >= 0; i--) {
    if (tokens[i].kind === 'word') return tokens[i].value;
  }
  return undefined;
}

export function getContextForCompletion(tokens: Token[], offset: number): CompletionScope {
  let idx = -1;
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].end >= offset) {
      idx = i;
      break;
    }
  }
  if (idx === -1) idx = tokens.length;

  const leftTokens = tokens.slice(0, idx);
  const lastTok = lastNonSpace(leftTokens);
  if (!lastTok) return 'Start';

  const lastValue = lastTok.value.toUpperCase();
  if (lastValue === '|') return 'AfterPipe';

  const back = leftTokens.slice(-6).map((t) => t.value.toUpperCase());
  const backStr = back.join(' ');

  if (/(^| )SEARCH$/.test(backStr)) return 'AfterSearch';
  if (/(^| )(FROM|SOURCE|INDEX)(=|$)/.test(backStr)) return 'AfterFromOrSourceOrIndex';
  if (/(^| )WHERE$/.test(backStr)) return 'AfterWhere';
  if (/(^| )FIELDS$/.test(backStr)) return 'AfterFields';
  if (/(^| )STATS$/.test(backStr)) return 'AfterStats';
  if (/(^| )BY$/.test(backStr)) return 'AfterBy';
  if (/(^| )SORT$/.test(backStr)) return 'AfterSort';

  const prev = prevWord(leftTokens, leftTokens.length - 1) || '';
  if (['SEARCH'].includes(prev.toUpperCase())) return 'AfterSearch';
  if (['FROM', 'SOURCE', 'INDEX'].includes(prev.toUpperCase())) return 'AfterFromOrSourceOrIndex';
  if (['WHERE'].includes(prev.toUpperCase())) return 'AfterWhere';
  if (['FIELDS'].includes(prev.toUpperCase())) return 'AfterFields';
  if (['STATS'].includes(prev.toUpperCase())) return 'AfterStats';
  if (['BY'].includes(prev.toUpperCase())) return 'AfterBy';
  if (['SORT'].includes(prev.toUpperCase())) return 'AfterSort';

  return 'Generic';
}


