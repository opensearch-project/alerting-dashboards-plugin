/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { EuiCallOut, EuiMarkdownEditor, EuiPanel, EuiText } from '@elastic/eui';
import Mustache from 'mustache';
import { flattenKeys } from './flattenKeys';
import { getUISettings } from '../../services';
import { findMustachePrefix, filterSuggestions, buildSuggestionText } from './suggestionUtils';

const MustacheAutocompleteTextArea = ({ value, onChange, context, height = 200, ...rest }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cursorInfo, setCursorInfo] = useState({ start: 0, prefix: '' });
  const [isPreviewing, setIsPreviewing] = useState(false);
  const containerRef = useRef(null);

  let isDarkMode = false;
  try {
    isDarkMode = getUISettings().get('theme:darkMode') || false;
  } catch (_) {}
  const allPaths = useMemo(() => flattenKeys(context), [context]);

  const renderedValue = useMemo(() => {
    const raw = value || '';
    if (!raw || !context) return raw;
    const originalEscape = Mustache.escape;
    try {
      Mustache.escape = (text) => {
        if (text && typeof text === 'object') return JSON.stringify(text, null, 2);
        return String(text);
      };
      return Mustache.render(raw, context);
    } catch (e) {
      return raw;
    } finally {
      Mustache.escape = originalEscape;
    }
  }, [value, context]);

  // Observe DOM to detect preview/editing mode toggle
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new MutationObserver(() => {
      const hasPreview = !!container.querySelector('.euiMarkdownFormat');
      setIsPreviewing(hasPreview);
    });

    observer.observe(container, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  const updateSuggestions = useCallback(
    (text, cursorPos) => {
      const result = findMustachePrefix(text, cursorPos);
      if (result) {
        const filtered = filterSuggestions(allPaths, result.prefix);
        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
        setSelectedIndex(0);
        setCursorInfo({ start: result.start, prefix: result.prefix });
      } else {
        setShowSuggestions(false);
      }
    },
    [allPaths]
  );

  const handleChange = useCallback(
    (newValue) => {
      if (isPreviewing) return;
      onChange({ target: { value: newValue } });

      const textarea = containerRef.current?.querySelector('.euiMarkdownEditorTextArea');
      const cursorPos = textarea?.selectionStart ?? newValue.length;
      updateSuggestions(newValue, cursorPos);
    },
    [onChange, updateSuggestions, isPreviewing]
  );

  const applySuggestion = useCallback(
    (path) => {
      const raw = value || '';
      const { newValue, hasChildren, newCursorPos } = buildSuggestionText(
        raw,
        cursorInfo.start,
        cursorInfo.prefix.length,
        path,
        allPaths
      );
      onChange({ target: { value: newValue } });
      setShowSuggestions(false);

      setTimeout(() => {
        const textarea = containerRef.current?.querySelector('.euiMarkdownEditorTextArea');
        if (textarea) {
          textarea.setSelectionRange(newCursorPos, newCursorPos);
          textarea.focus();
          if (hasChildren) {
            updateSuggestions(newValue, newCursorPos);
          }
        }
      }, 0);
    },
    [cursorInfo, value, onChange, allPaths, updateSuggestions]
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (!showSuggestions) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, suggestions.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        if (suggestions[selectedIndex]) {
          e.preventDefault();
          applySuggestion(suggestions[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    },
    [showSuggestions, suggestions, selectedIndex, applySuggestion]
  );

  return (
    <div ref={containerRef} style={{ position: 'relative' }} onKeyDownCapture={handleKeyDown}>
      <EuiCallOut
        size={'s'}
        title={
          'The receiving webhook must support Markdown rendering for formatting to display correctly.'
        }
        iconType={'iInCircle'}
      />
      <EuiMarkdownEditor
        value={isPreviewing ? renderedValue : value || ''}
        onChange={handleChange}
        height={height}
        initialViewMode="editing"
        {...rest}
      />
      {showSuggestions && !isPreviewing && (
        <EuiPanel
          paddingSize="none"
          style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            zIndex: 9999,
            maxHeight: 200,
            overflowY: 'auto',
            width: '100%',
            boxShadow: '0 -2px 8px rgba(0,0,0,0.15)',
            marginBottom: 4,
          }}
        >
          {suggestions.map((path, i) => (
            <div
              key={path}
              onMouseDown={(e) => {
                e.preventDefault();
                applySuggestion(path);
              }}
              style={{
                padding: '4px 8px',
                cursor: 'pointer',
                backgroundColor:
                  i === selectedIndex ? (isDarkMode ? '#2a3a5c' : '#e6f0ff') : 'transparent',
                fontSize: '13px',
                fontFamily: 'monospace',
              }}
            >
              <EuiText size="xs">
                <code>{`{{${path}}}`}</code>
              </EuiText>
            </div>
          ))}
        </EuiPanel>
      )}
    </div>
  );
};

export default MustacheAutocompleteTextArea;
