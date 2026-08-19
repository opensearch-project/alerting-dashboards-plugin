/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  addTimeFilterToQuery,
  computeLookBackMinutes,
  extractIndicesFromPPL,
  formatDuration,
} from './pplAlertingHelpers';

describe('computeLookBackMinutes', () => {
  test('returns 0 when lookback is disabled', () => {
    expect(computeLookBackMinutes({ useLookBackWindow: false })).toBe(0);
    expect(computeLookBackMinutes({})).toBe(0);
    expect(computeLookBackMinutes(null)).toBe(0);
  });

  test('converts minutes correctly', () => {
    expect(
      computeLookBackMinutes({
        useLookBackWindow: true,
        lookBackAmount: 30,
        lookBackUnit: 'minutes',
      })
    ).toBe(30);
  });

  test('converts hours correctly', () => {
    expect(
      computeLookBackMinutes({ useLookBackWindow: true, lookBackAmount: 2, lookBackUnit: 'hours' })
    ).toBe(120);
  });

  test('converts days correctly', () => {
    expect(
      computeLookBackMinutes({ useLookBackWindow: true, lookBackAmount: 1, lookBackUnit: 'days' })
    ).toBe(1440);
  });

  test('returns 0 for invalid amounts', () => {
    expect(
      computeLookBackMinutes({
        useLookBackWindow: true,
        lookBackAmount: -5,
        lookBackUnit: 'minutes',
      })
    ).toBe(0);
    expect(
      computeLookBackMinutes({
        useLookBackWindow: true,
        lookBackAmount: NaN,
        lookBackUnit: 'hours',
      })
    ).toBe(0);
  });
});

describe('addTimeFilterToQuery', () => {
  test('returns original query when inputs are missing', () => {
    expect(addTimeFilterToQuery('', 60, '@timestamp')).toBe('');
    expect(addTimeFilterToQuery('source=logs', 0, '@timestamp')).toBe('source=logs');
    expect(addTimeFilterToQuery('source=logs', 60, '')).toBe('source=logs');
  });

  test('appends sliding time filter when query has no pipes', () => {
    const result = addTimeFilterToQuery('source=logs', 60, '@timestamp');
    expect(result).toBe('source=logs | where @timestamp > DATE_SUB(NOW(), INTERVAL 1 HOUR)');
  });

  test('injects time filter before first pipe when query has pipes', () => {
    const query = 'source=logs | stats count() by status';
    const result = addTimeFilterToQuery(query, 120, '@timestamp');
    expect(result).toContain('| where @timestamp > DATE_SUB(NOW(), INTERVAL 2 HOUR)');
    expect(result).toContain('| stats count() by status');
    // Time filter should come before the stats command
    const timeFilterIdx = result.indexOf('| where @timestamp');
    const statsIdx = result.indexOf('| stats');
    expect(timeFilterIdx).toBeLessThan(statsIdx);
  });

  test('uses MINUTE unit for sub-hour lookback', () => {
    const result = addTimeFilterToQuery('source=idx', 30, 'event_time');
    expect(result).toContain('event_time > DATE_SUB(NOW(), INTERVAL 30 MINUTE)');
  });

  test('uses DAY unit for multi-day lookback', () => {
    const result = addTimeFilterToQuery('source=idx', 2880, 'ts');
    expect(result).toContain('ts > DATE_SUB(NOW(), INTERVAL 2 DAY)');
  });

  test('preserves original query structure with complex piped query', () => {
    const query = 'source=logs | where status=500 | stats avg(latency) as avg_lat by region';
    const result = addTimeFilterToQuery(query, 60, '@timestamp');
    expect(result).toContain('| where status=500');
    expect(result).toContain('| stats avg(latency) as avg_lat by region');
    // Time filter injected before the first original pipe
    expect(result.indexOf('| where @timestamp')).toBeLessThan(result.indexOf('| where status=500'));
  });

  test('is idempotent — re-injecting replaces the existing sliding filter instead of stacking', () => {
    const once = addTimeFilterToQuery('source=logs | stats count()', 60, '@timestamp');
    const twice = addTimeFilterToQuery(once, 120, '@timestamp');
    expect(twice.match(/DATE_SUB/g)).toHaveLength(1);
    expect(twice).toContain('INTERVAL 2 HOUR');
    expect(twice).not.toContain('INTERVAL 1 HOUR');
  });

  test('replaces a legacy absolute TIMESTAMP filter persisted by older saves', () => {
    // Shape persisted by the previous implementation at save time
    const stored =
      "source=logs | where @timestamp > TIMESTAMP('2025-06-15 11:00:00') " +
      "and @timestamp < TIMESTAMP('2025-06-15 12:00:00') | stats count() by status";
    const result = addTimeFilterToQuery(stored, 60, '@timestamp');
    expect(result).not.toContain('TIMESTAMP(');
    expect(result.match(/DATE_SUB/g)).toHaveLength(1);
    expect(result).toContain('| where @timestamp > DATE_SUB(NOW(), INTERVAL 1 HOUR)');
    expect(result).toContain('| stats count() by status');
  });

  test('does not strip user-written filters on other fields', () => {
    const query = "source=logs | where created > TIMESTAMP('2025-01-01 00:00:00') | stats count()";
    const result = addTimeFilterToQuery(query, 60, '@timestamp');
    // User filter on 'created' untouched (single-bound clause on another field)
    expect(result).toContain("created > TIMESTAMP('2025-01-01 00:00:00')");
    expect(result).toContain('DATE_SUB(NOW(), INTERVAL 1 HOUR)');
  });
});

describe('extractIndicesFromPPL', () => {
  test('extracts single index', () => {
    expect(extractIndicesFromPPL('source=logs | where status=500')).toEqual(['logs']);
  });

  test('extracts multiple comma-separated indices', () => {
    expect(extractIndicesFromPPL('source=logs,metrics,events')).toEqual([
      'logs',
      'metrics',
      'events',
    ]);
  });

  test('extracts index with wildcard', () => {
    expect(extractIndicesFromPPL('source=logs-* | stats count()')).toEqual(['logs-*']);
  });

  test('handles backtick-quoted indices', () => {
    expect(extractIndicesFromPPL('source=`my-index` | head 10')).toEqual(['my-index']);
  });

  test('returns empty array for empty input', () => {
    expect(extractIndicesFromPPL('')).toEqual([]);
    expect(extractIndicesFromPPL(null)).toEqual([]);
  });
});

describe('formatDuration', () => {
  test('formats minutes', () => {
    expect(formatDuration(30)).toBe('30 minutes');
    expect(formatDuration(1)).toBe('1 minute');
  });

  test('formats hours', () => {
    expect(formatDuration(60)).toBe('1 hour');
    expect(formatDuration(120)).toBe('2 hours');
    expect(formatDuration(90)).toBe('1 hr 30 min');
  });

  test('formats days', () => {
    expect(formatDuration(1440)).toBe('1 d');
    expect(formatDuration(2880)).toBe('2 d');
  });

  test('handles zero and null', () => {
    expect(formatDuration(0)).toBe('0 minutes');
    expect(formatDuration(null)).toBe('-');
  });
});
