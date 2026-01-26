import type { monaco } from '@osd/monaco';

export type Token = {
  value: string;
  start: number; // absolute offset
  end: number; // absolute offset (exclusive)
  kind: 'word' | 'string' | 'symbol' | 'space';
};

export type CompletionScope =
  | 'Start'
  | 'AfterPipe'
  | 'AfterSearch'
  | 'AfterFromOrSourceOrIndex'
  | 'AfterWhere'
  | 'AfterFields'
  | 'AfterStats'
  | 'AfterBy'
  | 'AfterSort'
  | 'Generic';

export type BuildSuggestionsArgs = {
  code: string;
  offset: number;
  scope: CompletionScope;
  range: monaco.IRange;
  monaco: typeof import('@osd/monaco').monaco;

  userFields?: string[];
  userIndices?: string[];
  extraKeywords?: string[];
};


