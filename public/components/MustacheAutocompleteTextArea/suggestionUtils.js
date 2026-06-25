/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Find the mustache prefix at the cursor position.
 * Returns { prefix, start } if inside a `{{...` expression, or null otherwise.
 */
const findMustachePrefix = (text, cursorPos) => {
  const before = text.slice(0, cursorPos);
  const match = before.match(/\{\{([^{}]*)$/);
  if (match) return { prefix: match[1], start: match.index + 2 };
  return null;
};

/**
 * Filter allPaths to only show one level deeper than the typed prefix.
 * Handles trailing-dot edge case (e.g. "ctx." should show ctx.monitor, not ctx.monitor.name).
 */
const filterSuggestions = (allPaths, prefix, maxResults = 15) => {
  const lower = prefix.toLowerCase();
  const segments = lower.split('.').filter(Boolean);
  const targetDepth = segments.length + 1;
  return allPaths
    .filter((p) => {
      if (!p.toLowerCase().startsWith(lower)) return false;
      return p.split('.').length <= targetDepth;
    })
    .slice(0, maxResults);
};

/**
 * Build the new text value after applying a suggestion.
 * Handles:
 * - Leaf nodes: appends `}}` closing braces
 * - Parent nodes: appends `.` for drill-down
 * - Existing `}}`: strips trailing braces to avoid doubling
 */
const buildSuggestionText = (raw, cursorStart, prefixLength, path, allPaths) => {
  const before = raw.slice(0, cursorStart);
  const after = raw.slice(cursorStart + prefixLength);
  const hasChildren = allPaths.some((p) => p.startsWith(path + '.'));
  const closingSuffix = hasChildren ? '.' : '}}';
  const trimmedAfter = !hasChildren && after.startsWith('}}') ? after.slice(2) : after;
  const newValue = `${before}${path}${closingSuffix}${trimmedAfter}`;
  const newCursorPos = cursorStart + path.length + (hasChildren ? 1 : 2);
  return { newValue, hasChildren, newCursorPos };
};

module.exports = { findMustachePrefix, filterSuggestions, buildSuggestionText };
