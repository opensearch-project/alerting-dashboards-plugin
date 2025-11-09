import { monaco } from '@osd/monaco';

type LanguageConfiguration = Parameters<typeof monaco.languages.setLanguageConfiguration>[1];

/** Basic editor config: pairs, comments, word pattern */
export const DEFAULT_PPL_LANGUAGE_CONFIG: LanguageConfiguration = {
  autoClosingPairs: [
    { open: '(', close: ')' },
    { open: '[', close: ']' },
    { open: '{', close: '}' },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
    { open: '`', close: '`' },
  ],
  comments: { lineComment: '//', blockComment: ['/*', '*/'] },
  wordPattern: /@?\w[\w@'.-]*[?!,;:"]*/,
};


