/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const { flattenKeys } = require('./flattenKeys');

describe('flattenKeys', () => {
  test('returns empty array for null', () => {
    expect(flattenKeys(null)).toEqual([]);
  });

  test('returns empty array for undefined', () => {
    expect(flattenKeys(undefined)).toEqual([]);
  });

  test('returns empty array for non-object', () => {
    expect(flattenKeys('string')).toEqual([]);
    expect(flattenKeys(42)).toEqual([]);
  });

  test('flattens simple object', () => {
    const keys = flattenKeys({ name: 'test', value: 1 });
    expect(keys).toContain('name');
    expect(keys).toContain('value');
  });

  test('flattens nested objects with dot notation', () => {
    const keys = flattenKeys({ monitor: { name: 'test', type: 'query' } });
    expect(keys).toContain('monitor');
    expect(keys).toContain('monitor.name');
    expect(keys).toContain('monitor.type');
  });

  test('flattens deeply nested objects', () => {
    const keys = flattenKeys({ a: { b: { c: { d: 'value' } } } });
    expect(keys).toContain('a');
    expect(keys).toContain('a.b');
    expect(keys).toContain('a.b.c');
    expect(keys).toContain('a.b.c.d');
  });

  test('flattens arrays with dot notation using .0', () => {
    const keys = flattenKeys({
      results: [{ hits: { total: 10 } }],
    });
    expect(keys).toContain('results');
    expect(keys).toContain('results.0.hits');
    expect(keys).toContain('results.0.hits.total');
    expect(keys).not.toContain('results[0].hits');
  });

  test('handles arrays of primitives without recursing', () => {
    const keys = flattenKeys({ tags: ['a', 'b', 'c'] });
    expect(keys).toContain('tags');
    expect(keys).toHaveLength(1);
  });

  test('handles empty arrays', () => {
    const keys = flattenKeys({ items: [] });
    expect(keys).toContain('items');
    expect(keys).toHaveLength(1);
  });

  test('handles mixed nested and primitive values', () => {
    const keys = flattenKeys({
      name: 'monitor',
      trigger: { severity: '1' },
      enabled: true,
    });
    expect(keys).toContain('name');
    expect(keys).toContain('trigger');
    expect(keys).toContain('trigger.severity');
    expect(keys).toContain('enabled');
  });

  test('uses prefix when provided', () => {
    const keys = flattenKeys({ name: 'test' }, 'ctx');
    expect(keys).toContain('ctx.name');
    expect(keys).not.toContain('name');
  });

  test('handles null values in object', () => {
    const keys = flattenKeys({ alert: null, name: 'test' });
    expect(keys).toContain('alert');
    expect(keys).toContain('name');
  });

  test('flattens realistic context object', () => {
    const context = {
      ctx: {
        monitor: { name: 'test-monitor', monitor_type: 'query_level_monitor' },
        trigger: { name: 'trigger1', severity: '1' },
        results: [{ hits: { total: { value: 10 } } }],
        periodStart: '2026-01-01T00:00:00Z',
        alert: null,
      },
    };
    const keys = flattenKeys(context);
    expect(keys).toContain('ctx');
    expect(keys).toContain('ctx.monitor');
    expect(keys).toContain('ctx.monitor.name');
    expect(keys).toContain('ctx.monitor.monitor_type');
    expect(keys).toContain('ctx.trigger');
    expect(keys).toContain('ctx.trigger.name');
    expect(keys).toContain('ctx.trigger.severity');
    expect(keys).toContain('ctx.results');
    expect(keys).toContain('ctx.results.0.hits');
    expect(keys).toContain('ctx.results.0.hits.total');
    expect(keys).toContain('ctx.results.0.hits.total.value');
    expect(keys).toContain('ctx.periodStart');
    expect(keys).toContain('ctx.alert');
  });
});

const { findMustachePrefix, filterSuggestions, buildSuggestionText } = require('./suggestionUtils');

describe('findMustachePrefix', () => {
  test('returns null when no {{ is present', () => {
    expect(findMustachePrefix('hello world', 11)).toBeNull();
  });

  test('finds prefix at cursor right after {{', () => {
    const result = findMustachePrefix('{{', 2);
    expect(result).toEqual({ prefix: '', start: 2 });
  });

  test('finds prefix with partial text typed', () => {
    const result = findMustachePrefix('{{ctx.mon', 9);
    expect(result).toEqual({ prefix: 'ctx.mon', start: 2 });
  });

  test('returns null when cursor is after closing }}', () => {
    expect(findMustachePrefix('{{ctx.monitor}}', 15)).toBeNull();
  });

  test('finds prefix when cursor is mid-expression', () => {
    const result = findMustachePrefix('{{ctx.monitor}}', 5);
    expect(result).toEqual({ prefix: 'ctx', start: 2 });
  });

  test('finds prefix for second expression', () => {
    const result = findMustachePrefix('{{name}} and {{ctx.', 19);
    expect(result).toEqual({ prefix: 'ctx.', start: 15 });
  });

  test('returns null for text between expressions', () => {
    expect(findMustachePrefix('{{name}} hello ', 15)).toBeNull();
  });
});

describe('filterSuggestions', () => {
  const allPaths = [
    'ctx',
    'ctx.monitor',
    'ctx.monitor.name',
    'ctx.monitor.type',
    'ctx.trigger',
    'ctx.trigger.name',
    'ctx.trigger.severity',
    'ctx.results',
    'ctx.periodStart',
    'ctx.alert',
  ];

  test('shows top-level paths for empty prefix', () => {
    const result = filterSuggestions(allPaths, '');
    expect(result).toEqual(['ctx']);
  });

  test('shows immediate children for "ctx."', () => {
    const result = filterSuggestions(allPaths, 'ctx.');
    expect(result).toContain('ctx.monitor');
    expect(result).toContain('ctx.trigger');
    expect(result).toContain('ctx.results');
    expect(result).toContain('ctx.periodStart');
    expect(result).toContain('ctx.alert');
    // Should NOT include grandchildren
    expect(result).not.toContain('ctx.monitor.name');
    expect(result).not.toContain('ctx.trigger.severity');
  });

  test('shows grandchildren for "ctx.monitor."', () => {
    const result = filterSuggestions(allPaths, 'ctx.monitor.');
    expect(result).toContain('ctx.monitor.name');
    expect(result).toContain('ctx.monitor.type');
  });

  test('filters by partial match', () => {
    const result = filterSuggestions(allPaths, 'ctx.mon');
    expect(result).toEqual(['ctx.monitor', 'ctx.monitor.name', 'ctx.monitor.type']);
  });

  test('is case-insensitive', () => {
    const result = filterSuggestions(allPaths, 'CTX.MON');
    expect(result).toEqual(['ctx.monitor', 'ctx.monitor.name', 'ctx.monitor.type']);
  });

  test('returns empty for no match', () => {
    expect(filterSuggestions(allPaths, 'nonexistent')).toEqual([]);
  });

  test('respects maxResults', () => {
    const result = filterSuggestions(allPaths, 'ctx.', 2);
    expect(result).toHaveLength(2);
  });

  test('trailing dot does not show extra depth level', () => {
    // This is the bug that was fixed: "ctx." should show depth 2, not depth 3
    const result = filterSuggestions(allPaths, 'ctx.');
    result.forEach((p) => {
      expect(p.split('.').length).toBeLessThanOrEqual(2);
    });
  });
});

describe('buildSuggestionText', () => {
  const allPaths = ['ctx', 'ctx.monitor', 'ctx.monitor.name', 'ctx.monitor.type', 'ctx.trigger'];

  test('appends }} for leaf node', () => {
    // Typing "{{" then selecting "ctx.monitor.name"
    const { newValue, hasChildren } = buildSuggestionText('{{', 2, 0, 'ctx.monitor.name', allPaths);
    expect(newValue).toBe('{{ctx.monitor.name}}');
    expect(hasChildren).toBe(false);
  });

  test('appends . for parent node', () => {
    // Typing "{{" then selecting "ctx"
    const { newValue, hasChildren } = buildSuggestionText('{{', 2, 0, 'ctx', allPaths);
    expect(newValue).toBe('{{ctx.');
    expect(hasChildren).toBe(true);
  });

  test('replaces partial prefix with leaf', () => {
    // Typing "{{ctx.mon" then selecting "ctx.monitor.name"
    const { newValue } = buildSuggestionText('{{ctx.mon', 2, 7, 'ctx.monitor.name', allPaths);
    expect(newValue).toBe('{{ctx.monitor.name}}');
  });

  test('does not double closing braces when editing inside existing expression', () => {
    // Text is "{{mon}}" with cursor after "mon", selecting "ctx.monitor.name"
    // before = "{{", after = "}}"
    const { newValue } = buildSuggestionText('{{mon}}', 2, 3, 'ctx.monitor.name', allPaths);
    expect(newValue).toBe('{{ctx.monitor.name}}');
    // NOT "{{ctx.monitor.name}}}}"
  });

  test('preserves text after expression', () => {
    const { newValue } = buildSuggestionText(
      '{{mon}} is the value',
      2,
      3,
      'ctx.monitor.name',
      allPaths
    );
    expect(newValue).toBe('{{ctx.monitor.name}} is the value');
  });

  test('drill-down preserves trailing text', () => {
    const { newValue } = buildSuggestionText('{{}} rest', 2, 0, 'ctx', allPaths);
    expect(newValue).toBe('{{ctx.}} rest');
  });

  test('returns correct cursor position for leaf', () => {
    const { newCursorPos } = buildSuggestionText('{{', 2, 0, 'ctx.monitor.name', allPaths);
    // cursor should be after the closing }}
    expect(newCursorPos).toBe(2 + 'ctx.monitor.name'.length + 2);
  });

  test('returns correct cursor position for parent', () => {
    const { newCursorPos } = buildSuggestionText('{{', 2, 0, 'ctx', allPaths);
    // cursor should be after the dot
    expect(newCursorPos).toBe(2 + 'ctx'.length + 1);
  });
});
