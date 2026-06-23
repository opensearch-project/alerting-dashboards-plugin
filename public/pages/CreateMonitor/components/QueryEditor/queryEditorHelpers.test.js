/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const {
  resolveDataset,
  getFallbackSuggestions,
  PPL_KEYWORD_SUGGESTIONS,
} = require('./queryEditorHelpers');

describe('resolveDataset', () => {
  const mockQueryString = (existingDataset) => ({
    getQuery: jest.fn().mockReturnValue({ dataset: existingDataset }),
    setQuery: jest.fn(),
  });

  const mockDataViews = (indexPatterns = [], getResult = null, createResult = null) => ({
    getIdsWithTitle: jest.fn().mockResolvedValue(indexPatterns),
    get: jest.fn().mockResolvedValue(getResult),
    create: jest.fn().mockResolvedValue(createResult),
  });

  test('returns existing dataset if already set on queryString', async () => {
    const existingDataset = { id: 'ds-1', title: 'my-index', type: 'index-pattern' };
    const queryString = mockQueryString(existingDataset);
    const dataViews = mockDataViews();

    const result = await resolveDataset(dataViews, queryString, []);

    expect(result).toEqual({
      dataset: existingDataset,
      initialized: true,
      alreadyConfigured: true,
    });
    expect(dataViews.getIdsWithTitle).not.toHaveBeenCalled();
    expect(queryString.setQuery).not.toHaveBeenCalled();
  });

  test('sets language to PPL before fetching index patterns', async () => {
    const queryString = mockQueryString(null);
    const dataViews = mockDataViews([], null, null);

    await resolveDataset(dataViews, queryString, []);

    expect(queryString.setQuery).toHaveBeenCalledWith({ language: 'PPL' });
  });

  test('uses first index pattern when available', async () => {
    const queryString = mockQueryString(null);
    const dataView = { id: 'ip-1', title: 'logs-*', timeFieldName: '@timestamp' };
    const dataViews = mockDataViews([{ id: 'ip-1', title: 'logs-*' }], dataView);

    const result = await resolveDataset(dataViews, queryString, []);

    expect(dataViews.get).toHaveBeenCalledWith('ip-1');
    expect(result).toEqual({
      dataset: { id: 'ip-1', title: 'logs-*', type: 'index-pattern', timeFieldName: '@timestamp' },
      initialized: true,
    });
  });

  test('falls back to creating data view from indices when no index patterns exist', async () => {
    const queryString = mockQueryString(null);
    const createdView = { id: 'created-1', title: 'idx-a,idx-b', timeFieldName: 'time' };
    const dataViews = mockDataViews([], null, createdView);

    const result = await resolveDataset(dataViews, queryString, ['idx-a', 'idx-b']);

    expect(dataViews.create).toHaveBeenCalledWith({ title: 'idx-a,idx-b' }, true, true);
    expect(result).toEqual({
      dataset: {
        id: 'created-1',
        title: 'idx-a,idx-b',
        type: 'index-pattern',
        timeFieldName: 'time',
      },
      initialized: true,
    });
  });

  test('returns null dataset when no index patterns and no indices', async () => {
    const queryString = mockQueryString(null);
    const dataViews = mockDataViews([], null, null);

    const result = await resolveDataset(dataViews, queryString, []);

    expect(result).toEqual({ dataset: null, initialized: false });
  });

  test('does not call create when indices is empty array', async () => {
    const queryString = mockQueryString(null);
    const dataViews = mockDataViews([], null, null);

    await resolveDataset(dataViews, queryString, []);

    expect(dataViews.create).not.toHaveBeenCalled();
  });
});

describe('getFallbackSuggestions', () => {
  test('returns PPL keywords when no suggestions and no dataView and language is PPL', () => {
    const result = getFallbackSuggestions([], null, 'PPL');
    expect(result).toEqual(PPL_KEYWORD_SUGGESTIONS);
    expect(result).toHaveLength(12);
  });

  test('returns PPL keywords when suggestions is null', () => {
    const result = getFallbackSuggestions(null, null, 'PPL');
    expect(result).toEqual(PPL_KEYWORD_SUGGESTIONS);
  });

  test('returns original suggestions when they exist', () => {
    const suggestions = [{ text: 'my_index', type: 1 }];
    const result = getFallbackSuggestions(suggestions, null, 'PPL');
    expect(result).toEqual(suggestions);
  });

  test('returns PPL keywords when suggestions are empty even if dataView is present', () => {
    const result = getFallbackSuggestions([], { id: 'dv-1' }, 'PPL');
    expect(result).toEqual(PPL_KEYWORD_SUGGESTIONS);
  });

  test('returns empty array when language is not PPL', () => {
    const result = getFallbackSuggestions([], null, 'SQL');
    expect(result).toEqual([]);
  });

  test('returns original suggestions when language is not PPL', () => {
    const suggestions = [{ text: 'SELECT', type: 2 }];
    const result = getFallbackSuggestions(suggestions, null, 'SQL');
    expect(result).toEqual(suggestions);
  });
});
