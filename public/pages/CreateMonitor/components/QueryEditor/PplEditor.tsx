import React, { useEffect, useMemo, useRef } from 'react';
import { monaco } from '@osd/monaco';
import { buildSuggestions } from './completion/pplCompletionEngine';
import { tokenize, getContextForCompletion } from './completion/pplTokenizer';
import { DEFAULT_PPL_LANGUAGE_CONFIG } from './completion/pplLanguageConfig';
import { CompletionScope } from './completion/types';

type Editor = monaco.editor.IStandaloneCodeEditor;

type Props = {
  value: string;
  onChange: (v: string) => void;
  height?: number;
  fields?: string[];
  indices?: string[];
  extraKeywords?: string[];
};

const TRIGGER_CHARS =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_`\'".=:-|,()[]%*/+!<>^&~ '.split('');

export const PplEditor: React.FC<Props> = ({
  value,
  onChange,
  height = 220,
  fields = ['_source', '_score', '@timestamp', '@message'],
  indices = [],
  extraKeywords = [],
}) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<Editor | null>(null);
  const providerRef = useRef<monaco.IDisposable | null>(null);
  const onChangeRef = useRef(onChange);
  const fieldsRef = useRef(fields);
  const indicesRef = useRef(indices);
  const extraKeywordsRef = useRef(extraKeywords);

  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  useEffect(() => { fieldsRef.current = fields; }, [fields]);
  useEffect(() => { indicesRef.current = indices; }, [indices]);
  useEffect(() => { extraKeywordsRef.current = extraKeywords; }, [extraKeywords]);

  // Register language once
  useEffect(() => {
    try {
      monaco.languages.register({ id: 'ppl' });
      monaco.languages.setLanguageConfiguration('ppl', DEFAULT_PPL_LANGUAGE_CONFIG);
    } catch {}
  }, []);

  // Create the editor ONCE (← important)
  useEffect(() => {
    if (!rootRef.current) return;
    const editor = monaco.editor.create(rootRef.current, {
      value, // initial value only
      language: 'ppl',
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: 'off',
      automaticLayout: true,
      fontSize: 13,
      lineNumbers: 'on',
      suggestOnTriggerCharacters: true,
      quickSuggestions: { other: true, comments: true, strings: true },
      quickSuggestionsDelay: 0,
      wordBasedSuggestions: false,
      tabCompletion: 'on',
    });
    editorRef.current = editor;

    // Re-open suggestions after each keystroke
    const sub = editor.onDidChangeModelContent(() => {
      const v = editor.getValue();
      onChangeRef.current?.(v);
      // Keep focus, just re-open the suggest widget
      editor.trigger('typing', 'editor.action.triggerSuggest', {});
    });

    const focus = editor.onDidFocusEditorWidget(() => {
      editor.trigger('focus', 'editor.action.triggerSuggest', {});
    });

    return () => {
      sub.dispose();
      focus.dispose();
      editor.dispose();
      editorRef.current = null;
    };
  }, []); // ← empty dependency: don’t recreate editor for value changes

  // Sync external value into the model WITHOUT recreating the editor
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const model = editor.getModel();
    if (!model) return;

    const current = model.getValue();
    if (current === value) return;

    // Preserve selection & undo stack nicely
    const fullRange = model.getFullModelRange();
    const selection = editor.getSelection();

    editor.executeEdits('prop-sync', [
      { range: fullRange, text: value },
    ]);

    if (selection) editor.setSelection(selection);
  }, [value]);

  // Completion provider (register once; read latest refs inside)
  const suggestionProvider = useMemo<monaco.languages.CompletionItemProvider>(() => ({
    triggerCharacters: TRIGGER_CHARS,
    provideCompletionItems: (model, position, _ctx, token) => {
      if (token.isCancellationRequested) return { suggestions: [], incomplete: false };

      const code = model.getValue();
      const offset = model.getOffsetAt(position);
      const tks = tokenize(code);
      const scope: CompletionScope = getContextForCompletion(tks, offset);

      const word = model.getWordUntilPosition(position);
      const range = new monaco.Range(
        position.lineNumber,
        word.startColumn,
        position.lineNumber,
        word.endColumn
      );

      const items = buildSuggestions({
        code,
        offset,
        scope,
        range,
        monaco,
        userFields: fieldsRef.current,
        userIndices: indicesRef.current,
        extraKeywords: extraKeywordsRef.current,
      });

      return { suggestions: items, incomplete: false };
    },
  }), []);

  useEffect(() => {
    providerRef.current?.dispose();
    providerRef.current = monaco.languages.registerCompletionItemProvider('ppl', suggestionProvider);
    return () => {
      providerRef.current?.dispose();
      providerRef.current = null;
    };
  }, [suggestionProvider]);

  return (
    <div
      ref={rootRef}
      style={{ width: '100%', height, border: '1px solid #d3dae6', borderRadius: 6 }}
    />
  );
};
