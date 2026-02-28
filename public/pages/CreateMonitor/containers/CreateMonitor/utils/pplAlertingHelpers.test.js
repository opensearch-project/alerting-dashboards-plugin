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
  const fixedEnd = new Date('2025-06-15T12:00:00Z');

  test('returns original query when inputs are missing', () => {
    expect(addTimeFilterToQuery('', 60, '@timestamp')).toBe('');
    expect(addTimeFilterToQuery('source=logs', 0, '@timestamp')).toBe('source=logs');
    expect(addTimeFilterToQuery('source=logs', 60, '')).toBe('source=logs');
  });

  test('appends time filter when query has no pipes', () => {
    const result = addTimeFilterToQuery('source=logs', 60, '@timestamp', fixedEnd);
    expect(result).toContain("| where @timestamp > TIMESTAMP('2025-06-15 11:00:00')");
    expect(result).toContain("and @timestamp < TIMESTAMP('2025-06-15 12:00:00')");
    expect(result).toMatch(/^source=logs \|/);
  });

  test('injects time filter before first pipe when query has pipes', () => {
    const query = 'source=logs | stats count() by status';
    const result = addTimeFilterToQuery(query, 120, '@timestamp', fixedEnd);
    expect(result).toContain("| where @timestamp > TIMESTAMP('2025-06-15 10:00:00')");
    expect(result).toContain('| stats count() by status');
    // Time filter should come before the stats command
    const timeFilterIdx = result.indexOf('| where @timestamp');
    const statsIdx = result.indexOf('| stats');
    expect(timeFilterIdx).toBeLessThan(statsIdx);
  });

  test('uses correct lookback window in minutes', () => {
    const result = addTimeFilterToQuery('source=idx', 30, 'event_time', fixedEnd);
    expect(result).toContain("event_time > TIMESTAMP('2025-06-15 11:30:00')");
    expect(result).toContain("event_time < TIMESTAMP('2025-06-15 12:00:00')");
  });

  test('handles multi-day lookback', () => {
    const result = addTimeFilterToQuery('source=idx', 1440, 'ts', fixedEnd);
    expect(result).toContain("ts > TIMESTAMP('2025-06-14 12:00:00')");
    expect(result).toContain("ts < TIMESTAMP('2025-06-15 12:00:00')");
  });

  test('preserves original query structure with complex piped query', () => {
    const query = 'source=logs | where status=500 | stats avg(latency) as avg_lat by region';
    const result = addTimeFilterToQuery(query, 60, '@timestamp', fixedEnd);
    expect(result).toContain('| where status=500');
    expect(result).toContain('| stats avg(latency) as avg_lat by region');
    // Time filter injected before the first original pipe
    expect(result.indexOf('| where @timestamp')).toBeLessThan(result.indexOf('| where status=500'));
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
