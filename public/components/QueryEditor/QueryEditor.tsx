/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { monaco } from '@osd/monaco';
import { useDispatch, useSelector } from 'react-redux';
import { DEFAULT_DATA } from '../../../../../src/plugins/data/common';
import { selectQueryLanguage, selectIsQueryEditorDirty } from '../../redux/selectors';
import { setIsQueryEditorDirty, setDataset } from '../../redux/slices';

type Editor = monaco.editor.IStandaloneCodeEditor;

// Match explore plugin's trigger characters exactly
const TRIGGER_CHARACTERS = [' ', '=', "'", '"', '`'];

interface QueryEditorProps {
  value: string;
  onChange: (value: string) => void;
  services: any;
  height?: number;
  readOnly?: boolean;
  placeholder?: string;
  indexPatternId?: string;
  indices?: string[];
  autoExpand?: boolean; // Enable auto-expanding height based on content
}

export const QueryEditor: React.FC<QueryEditorProps> = ({
  value,
  onChange,
  services,
  height = 220,
  readOnly = false,
  placeholder,
  indexPatternId,
  indices = [],
  autoExpand = false,
}) => {
  const dispatch = useDispatch();
  const queryLanguage = useSelector(selectQueryLanguage);
  const isQueryEditorDirty = useSelector(selectIsQueryEditorDirty);
  
  const rootRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<Editor | null>(null);
  const providerRef = useRef<monaco.IDisposable | null>(null);
  const onChangeRef = useRef(onChange);
  const indicesRef = useRef(indices);
  const indexPatternIdRef = useRef(indexPatternId);
  const servicesRef = useRef(services);
  const [editorHeight, setEditorHeight] = React.useState(height);

  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  useEffect(() => { indicesRef.current = indices; }, [indices]);
  useEffect(() => { indexPatternIdRef.current = indexPatternId; }, [indexPatternId]);
  useEffect(() => { servicesRef.current = services; }, [services]);

  // Initialize dataset in queryString service - EXACTLY like explore does
  const isDatasetInitialized = useRef(false);
  useEffect(() => {
    const initializeDataset = async () => {
      if (isDatasetInitialized.current) {
        return;
      }
      
      if (!services?.data?.dataViews || !services?.data?.query?.queryString) {
        return;
      }

      try {
        const { data } = services;
        
        // Check if dataset already set
        const existingQuery = data.query.queryString.getQuery();
        
        if (existingQuery?.dataset) {
          dispatch(setDataset(existingQuery.dataset));
          isDatasetInitialized.current = true;
          return;
        }

        // IMPORTANT: Set language to 'ppl' FIRST to avoid toast notification
        // This ensures that when we set the dataset, the current language is already 'ppl'
        data.query.queryString.setQuery({
          language: 'PPL',
        });

        // Fetch first available index pattern
        const indexPatterns = await data.dataViews.getIdsWithTitle();

        let dataset = null;

        const indexPatternId = indexPatternIdRef.current;
        const indices = indicesRef.current || [];

        if (indexPatterns && indexPatterns.length > 0) {
          const firstPattern = indexPatterns[0];
          
          const dataView = await data.dataViews.get(firstPattern.id);
          
          dataset = {
            id: dataView.id,
            title: dataView.title,
            type: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
            timeFieldName: dataView.timeFieldName,
          };
        } else if (indices && indices.length > 0) {
          const dataView = await data.dataViews.create({
            title: indices.join(','),
          }, false, true);
          
          dataset = {
            id: dataView.id!,
            title: dataView.title,
            type: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
            timeFieldName: dataView.timeFieldName,
          };
        }

        if (dataset) {
          // THIS IS THE KEY: Set dataset in queryString service like explore does
          // Set the language to 'ppl' directly in the query to avoid language change toast
          data.query.queryString.setQuery({
            query: '',
            language: 'PPL',
            dataset,
          });

          dispatch(setDataset(dataset));
          isDatasetInitialized.current = true;
        }
      } catch (error) {
        // Silent fail - dataset initialization is not critical
      }
    };

    initializeDataset();
  }, [services, indices, dispatch]);

  // Completion provider
  const suggestionProvider = useMemo<monaco.languages.CompletionItemProvider>(() => {
    return {
      triggerCharacters: TRIGGER_CHARACTERS,
      provideCompletionItems: async (
        model: monaco.editor.ITextModel,
        position: monaco.Position,
        context: monaco.languages.CompletionContext,
        token: monaco.CancellationToken
      ): Promise<monaco.languages.CompletionList> => {
        if (token.isCancellationRequested) {
          return { suggestions: [], incomplete: false };
        }

        try {
          const currentServices = servicesRef.current;

          if (!currentServices?.data?.autocomplete?.getQuerySuggestions) {
            return { suggestions: [], incomplete: false };
          }

          const {
            data: { dataViews, query: { queryString } },
          } = currentServices;
          
          if (!currentServices.appName) {
            currentServices.appName = 'alerting';
          }

          // Use PPL directly - don't use getEffectiveLanguageForAutoComplete for alerting
          const effectiveLanguage = queryLanguage === 'ppl' ? 'PPL' : queryLanguage;

          // Get dataset from queryString service - EXACTLY like explore does
          const currentDataset = queryString.getQuery().dataset;
          
          let currentDataView = null;
          if (currentDataset?.id) {
            try {
              currentDataView = await dataViews.get(
                currentDataset.id,
                currentDataset.type !== DEFAULT_DATA.SET_TYPES.INDEX_PATTERN
              );
            } catch (dvError) {
              // Silent fail - continue without dataView
            }
          }

          const queryValue = model.getValue();
          const offset = model.getOffsetAt(position);

          // Call autocomplete exactly like discover/explore does
          let suggestions = await currentServices?.data?.autocomplete?.getQuerySuggestions({
            query: queryValue,
            selectionStart: offset,
            selectionEnd: offset,
            language: effectiveLanguage,
            indexPattern: currentDataView,
            datasetType: currentDataset?.type,
            position,
            services: currentServices as any,
          });

          // Fallback: Provide basic PPL keywords when no dataset/indexPattern is available
          if ((!suggestions || suggestions.length === 0) && !currentDataView && effectiveLanguage === 'PPL') {
            suggestions = [
              { text: 'source', type: 2, insertText: 'source = ', detail: 'Keyword' },
              { text: 'where', type: 2, insertText: 'where ', detail: 'Keyword' },
              { text: 'fields', type: 2, insertText: 'fields ', detail: 'Keyword' },
              { text: 'rename', type: 2, insertText: 'rename ', detail: 'Keyword' },
              { text: 'stats', type: 2, insertText: 'stats ', detail: 'Keyword' },
              { text: 'dedup', type: 2, insertText: 'dedup ', detail: 'Keyword' },
              { text: 'sort', type: 2, insertText: 'sort ', detail: 'Keyword' },
              { text: 'eval', type: 2, insertText: 'eval ', detail: 'Keyword' },
              { text: 'head', type: 2, insertText: 'head ', detail: 'Keyword' },
              { text: 'top', type: 2, insertText: 'top ', detail: 'Keyword' },
              { text: 'rare', type: 2, insertText: 'rare ', detail: 'Keyword' },
              { text: 'parse', type: 2, insertText: 'parse ', detail: 'Keyword' },
            ];
          }

          // current completion item range being given as last 'word' at pos
          const wordUntil = model.getWordUntilPosition(position);

          const defaultRange = new monaco.Range(
            position.lineNumber,
            wordUntil.startColumn,
            position.lineNumber,
            wordUntil.endColumn
          );

          const filteredSuggestions = suggestions || [];

          const monacoSuggestions = filteredSuggestions.map((s: any) => ({
            label: s.text,
            kind: s.type as monaco.languages.CompletionItemKind,
            insertText: s.insertText ?? s.text,
            insertTextRules: s.insertTextRules ?? undefined,
            range: defaultRange,
            detail: s.detail,
            sortText: s.sortText,
            documentation: s.documentation
              ? {
                  value: s.documentation,
                  isTrusted: true,
                }
              : '',
            command: {
              id: 'editor.action.triggerSuggest',
              title: 'Trigger Next Suggestion',
            },
          }));

          return {
            suggestions: monacoSuggestions,
            incomplete: false,
          };
        } catch (autocompleteError) {
          return { suggestions: [], incomplete: false };
        }
      },
    };
  }, [queryLanguage, services]);

  // Register language ONCE
  useEffect(() => {
    try {
      monaco.languages.register({ id: 'ppl' });
      monaco.languages.setLanguageConfiguration('ppl', {
        autoClosingPairs: [
          { open: '(', close: ')' },
          { open: '[', close: ']' },
          { open: '{', close: '}' },
          { open: '"', close: '"' },
          { open: "'", close: "'" },
          { open: '`', close: '`' },
        ],
        comments: {
          lineComment: '//',
          blockComment: ['/*', '*/'],
        },
        wordPattern: /@?\w[\w@'.-]*[?!,;:]*/,
      });
    } catch (e) {
      // Language already registered, which is fine
    }
  }, []);

  // Create the editor ONCE
  useEffect(() => {
    if (!rootRef.current) return;
    
    const editor = monaco.editor.create(rootRef.current, {
      value,
      language: queryLanguage,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      automaticLayout: true,
      fontSize: 14,
      lineNumbers: 'on',
      readOnly,
      suggest: {
        showWords: false,
        showSnippets: false,
        snippetsPreventQuickSuggestions: false,
        filterGraceful: false,
      },
      quickSuggestions: {
        other: true,
        comments: false,
        strings: false,
      },
      suggestOnTriggerCharacters: true,
      wordBasedSuggestions: false,
      tabCompletion: 'on',
    });
    
    editorRef.current = editor;

    // Auto-adjust height based on content (only if autoExpand is enabled)
    const updateHeight = () => {
      if (!autoExpand) return;
      const contentHeight = Math.min(Math.max(editor.getContentHeight(), 60), 400);
      if (contentHeight !== editorHeight) {
        setEditorHeight(contentHeight);
      }
    };

    // Initial height calculation (only if autoExpand is enabled)
    if (autoExpand) {
      setTimeout(updateHeight, 100);
    }

    // Register completion provider
    providerRef.current = monaco.languages.registerCompletionItemProvider(
      queryLanguage,
      suggestionProvider
    );

    // Handle content changes
    const sub = editor.onDidChangeModelContent(() => {
      const v = editor.getValue();
      onChangeRef.current?.(v);
      
      if (!isQueryEditorDirty) {
        dispatch(setIsQueryEditorDirty(true));
      }
      
      // Update height when content changes (only if autoExpand is enabled)
      if (autoExpand) {
        updateHeight();
      }
      
      // Trigger suggestions after change
      editor.trigger('typing', 'editor.action.triggerSuggest', {});
    });

    const focus = editor.onDidFocusEditorWidget(() => {
      editor.trigger('focus', 'editor.action.triggerSuggest', {});
    });

    return () => {
      sub.dispose();
      focus.dispose();
      providerRef.current?.dispose();
      editor.dispose();
      editorRef.current = null;
      providerRef.current = null;
    };
  }, []); // Empty dependency: don't recreate editor for value changes

  // Sync external value into the model WITHOUT recreating the editor
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const model = editor.getModel();
    if (!model) return;

    const current = model.getValue();
    if (current === value) return;

    // Preserve selection & undo stack
    const fullRange = model.getFullModelRange();
    const selection = editor.getSelection();

    editor.executeEdits('prop-sync', [
      { range: fullRange, text: value },
    ]);

    if (selection) editor.setSelection(selection);
    
    // Update height when value changes externally (only if autoExpand is enabled)
    if (autoExpand) {
      setTimeout(() => {
        const contentHeight = Math.min(Math.max(editor.getContentHeight(), 60), 400);
        if (contentHeight !== editorHeight) {
          setEditorHeight(contentHeight);
        }
      }, 50);
    }
  }, [value, editorHeight, autoExpand]);

  return (
    <div
      ref={rootRef}
      style={{ width: '100%', height: editorHeight, border: '1px solid #d3dae6', borderRadius: 6 }}
      data-test-subj="queryEditor"
    />
  );
};
