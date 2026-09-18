/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { buildPPLMonitorFromFormik } from './pplFormikToMonitor';

const baseValues = (overrides = {}) => ({
  name: 'm',
  description: '',
  disabled: false,
  frequency: 'interval',
  period: { interval: 1, unit: 'MINUTES' },
  timezone: [],
  triggerDefinitions: [],
  useLookBackWindow: true,
  lookBackAmount: 1,
  lookBackUnit: 'hours',
  timestampField: '@timestamp',
  pplQuery: 'source=logs | stats count()',
  ui_metadata: {},
  ...overrides,
});

const queryOf = (values) => buildPPLMonitorFromFormik(values).ppl_monitor.query;

describe('buildPPLMonitorFromFormik look-back clause management (Option 1: identity-based strip)', () => {
  test('switching the timestamp field replaces the old clause instead of stacking a second one', () => {
    const q = queryOf(
      baseValues({
        pplQuery:
          'source=logs | where @timestamp > DATE_SUB(NOW(), INTERVAL 1 HOUR) | stats count()',
        timestampField: 'event_time',
        ui_metadata: {
          lookback: {
            enabled: true,
            timestamp_field: '@timestamp',
            minutes: 60,
            amount: 1,
            unit: 'hours',
          },
        },
      })
    );
    expect(q).not.toContain('@timestamp');
    expect((q.match(/where/g) || []).length).toBe(1);
    expect(q).toContain('where event_time > DATE_SUB(NOW(), INTERVAL 1 HOUR)');
  });

  test('disabling lookback removes the previously injected clause', () => {
    const q = queryOf(
      baseValues({
        pplQuery:
          'source=logs | where @timestamp > DATE_SUB(NOW(), INTERVAL 1 HOUR) | stats count()',
        timestampField: '@timestamp',
        useLookBackWindow: false,
        ui_metadata: {
          lookback: {
            enabled: true,
            timestamp_field: '@timestamp',
            minutes: 60,
            amount: 1,
            unit: 'hours',
          },
        },
      })
    );
    expect(q).not.toContain('DATE_SUB');
    expect(q).toBe('source=logs | stats count()');
  });

  test('preserves a user-authored DATE_SUB filter on an unrelated field', () => {
    const q = queryOf(
      baseValues({
        pplQuery:
          'source=logs | where response_time > DATE_SUB(NOW(), INTERVAL 5 MINUTE) | stats count()',
        timestampField: '',
        useLookBackWindow: false,
        ui_metadata: {},
      })
    );
    expect(q).toContain('where response_time > DATE_SUB(NOW(), INTERVAL 5 MINUTE)');
  });
});
