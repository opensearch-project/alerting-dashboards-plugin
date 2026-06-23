/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const INDEX_PATTERN_TYPE = 'index-pattern';

const PPL_KEYWORD_SUGGESTIONS = [
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

/**
 * Resolves the dataset to use for the query editor's autocomplete provider.
 *
 * Checks the following sources in order:
 * 1. Existing dataset already configured on the queryString service
 * 2. First available index pattern from the data views service
 * 3. A dynamically created data view from the provided indices array
 *
 * Sets the query language to PPL on the queryString service as a side effect
 * when no existing dataset is found.
 *
 * @param {object} dataViews - The OSD data views service (data.dataViews)
 * @param {object} queryString - The OSD query string service (data.query.queryString)
 * @param {string[]} indices - Fallback index names to use if no index patterns exist
 * @returns {Promise<{dataset: object|null, initialized: boolean}>} The resolved dataset
 *   and whether initialization completed successfully
 */
async function resolveDataset(dataViews, queryString, indices) {
  // Check if dataset already set — but allow re-initialization when indices are explicitly provided
  const existingQuery = queryString.getQuery();
  if (existingQuery?.dataset && (!indices || indices.length === 0)) {
    return { dataset: existingQuery.dataset, initialized: true, alreadyConfigured: true };
  }

  // Set language first
  queryString.setQuery({ language: 'PPL' });

  // Use the indices prop directly to create a dataset
  if (indices && indices.length > 0) {
    try {
      const dataView = await dataViews.create({ title: indices.join(',') }, true, true);
      return {
        dataset: {
          id: dataView.id,
          title: dataView.title,
          type: INDEX_PATTERN_TYPE,
          timeFieldName: dataView.timeFieldName,
        },
        initialized: true,
      };
    } catch (e) {
      // dataViews.create may fail on domains that don't support _fields_for_wildcard
      console.warn(
        '[PPL QueryEditor] Dataset creation failed, continuing without field metadata:',
        e.message
      );
      return { dataset: null, initialized: true };
    }
  }

  // Fallback to index patterns if no indices provided
  const indexPatterns = await dataViews.getIdsWithTitle();
  if (indexPatterns && indexPatterns.length > 0) {
    const dataView = await dataViews.get(indexPatterns[0].id);
    return {
      dataset: {
        id: dataView.id,
        title: dataView.title,
        type: INDEX_PATTERN_TYPE,
        timeFieldName: dataView.timeFieldName,
      },
      initialized: true,
    };
  }

  return { dataset: null, initialized: false };
}

/**
 * Returns fallback suggestions when the autocomplete service cannot provide
 * context-aware suggestions (e.g. PPL grammar endpoint unavailable).
 *
 * When the cursor is after `source=` or `index=`, returns available index names.
 * Otherwise returns static PPL keywords (source, where, stats, etc.).
 *
 * @param {Array|null} suggestions - Suggestions returned by the autocomplete service
 * @param {object|null} currentDataView - The active data view (unused, retained for API stability)
 * @param {string} language - The active query language (e.g. 'PPL', 'SQL')
 * @param {string[]} indices - Available index names for index suggestions
 * @param {string} queryValue - The full query text in the editor
 * @param {number} offset - The cursor offset position
 * @returns {Array} The suggestions to display
 */
function getFallbackSuggestions(
  suggestions,
  currentDataView,
  language,
  indices,
  queryValue,
  offset
) {
  if ((!suggestions || suggestions.length === 0) && language === 'PPL') {
    const textBeforeCursor = (queryValue || '').substring(0, offset).trimEnd();
    const afterSource = /(?:source|index)\s*=\s*$/i.test(textBeforeCursor);
    if (afterSource) {
      return (indices || []).map((idx) => ({
        text: idx,
        type: 1,
        insertText: idx,
        detail: 'Index',
      }));
    }
    return PPL_KEYWORD_SUGGESTIONS;
  }
  return suggestions || [];
}

module.exports = {
  resolveDataset,
  getFallbackSuggestions,
  PPL_KEYWORD_SUGGESTIONS,
  INDEX_PATTERN_TYPE,
};
