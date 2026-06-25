/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import { computeLookBackMinutes, addTimeFilterToQuery } from './pplAlertingHelpers';
/**
 * Normalize timezone coming from formik (can be array/object/string)
 */
const getTimezoneString = (values) => {
  const tz = values?.timezone;
  if (Array.isArray(tz) && tz.length) {
    return tz[0]?.label || tz[0]?.value || 'UTC';
  }
  if (tz && typeof tz === 'object') {
    return tz.label || tz.value || 'UTC';
  }
  if (typeof tz === 'string' && tz.trim()) return tz;
  return 'UTC';
};

export const pplToV2Schedule = (values) => {
  const tz = getTimezoneString(values);
  const freq = values.frequency;

  if (freq === 'interval') {
    const unit = (values.period?.unit || 'MINUTES').toUpperCase();
    return {
      period: {
        interval: values.period?.interval === '' ? 1 : Number(values.period?.interval || 1),
        unit,
      },
    };
  }

  if (freq === 'daily') {
    const daily = values.daily || '0 0';
    return { cron: { expression: `0 ${daily} * * *`, timezone: tz } };
  }

  if (freq === 'weekly') {
    const daily = values.daily || '0 0';
    const daysOfWeek = Object.entries(values.weekly || {})
      .filter(([_, checked]) => checked)
      .map(([dayName]) => dayName.toUpperCase())
      .join(',');
    return { cron: { expression: `0 ${daily} * * ${daysOfWeek || '*'}`, timezone: tz } };
  }

  if (freq === 'monthly') {
    const daily = values.daily || '0 0';
    const { type, day } = values.monthly || {};
    const dayOfMonth = type === 'day' ? day : '?';
    return { cron: { expression: `0 ${daily} ${dayOfMonth} */1 *`, timezone: tz } };
  }

  if (freq === 'cronExpression' && values.cronExpression) {
    return { cron: { expression: values.cronExpression, timezone: tz } };
  }

  return {
    period: {
      interval: 1,
      unit: 'MINUTES',
    },
  };
};

const normalizeNumCondition = (raw) => {
  const v = String(raw ?? '')
    .trim()
    .toLowerCase();
  switch (v) {
    case 'above':
    case 'greater than':
    case '>':
      return '>';
    case 'at least':
    case 'greater than or equal to':
    case '>=':
      return '>=';
    case 'below':
    case 'less than':
    case '<':
      return '<';
    case 'at most':
    case 'less than or equal to':
    case '<=':
      return '<=';
    case 'equal':
    case 'equals':
    case '==':
      return '==';
    case 'not equal':
    case '!=':
      return '!=';
    default:
      return '>=';
  }
};

const normalizeSeverity = (s) => {
  const v = String(s ?? '').toLowerCase();
  if (['info', 'low', 'medium', 'high', 'critical', 'error'].includes(v)) return v;
  if (v === '0') return 'info';
  if (v === '1') return 'low';
  if (v === '2') return 'medium';
  if (v === '3') return 'high';
  if (v === '4') return 'critical';
  return 'info';
};

const formikPplTriggerToWire = (t, i = 0) => {
  const type = (
    t?.uiConditionType ||
    t?.type ||
    t?.conditionType ||
    'number_of_results'
  ).toLowerCase();
  const isNum = type === 'number_of_results';

  const cleanActions = (actions) => {
    if (!Array.isArray(actions)) return [];
    return actions.map((a) => ({
      name: a.name,
      destination_id: a.destination_id,
      message_template: a.message_template,
      ...(a.subject_template ? { subject_template: a.subject_template } : {}),
    }));
  };

  const trigger = {
    name: t?.name || `trigger${i + 1}`,
    severity: t.severity,
    actions: cleanActions(t?.actions),
    type,
    num_results_condition: isNum
      ? normalizeNumCondition(t?.num_results_condition || t?.thresholdEnum)
      : null,
    num_results_value: isNum ? Number(t?.num_results_value ?? t?.thresholdValue ?? 1) : null,
    custom_condition: !isNum ? t?.custom_condition || t?.customCondition || null : null,
  };

  if (t?.id) {
    trigger.id = t.id;
  }

  return trigger;
};

const buildLookBackFromFormik = (values) => {
  const enabled = values?.useLookBackWindow ?? true;
  if (!enabled) return null;

  const n = Number(values?.lookBackAmount ?? 1);
  const amt = Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
  const unit = String(values?.lookBackUnit || 'hours').toLowerCase();

  if (unit.startsWith('minute')) return Math.floor(amt);
  if (unit.startsWith('hour')) return Math.floor(amt * 60);
  if (unit.startsWith('day')) return Math.floor(amt * 60 * 24);

  return Math.floor(amt);
};

export const buildPPLMonitorFromFormik = (values) => {
  const schedule = pplToV2Schedule(values);
  const lookBack = buildLookBackFromFormik(values);

  const defs = Array.isArray(values.triggerDefinitions) ? values.triggerDefinitions : [];
  const triggers = defs.length
    ? defs.map((t, i) => formikPplTriggerToWire(t, i))
    : [
        {
          name: 'trigger1',
          severity: 'info',
          actions: [],
          type: 'number_of_results',
          num_results_condition: '>=',
          num_results_value: 1,
          custom_condition: null,
        },
      ];

  const useLookBackWindow = values?.useLookBackWindow ?? true;

  const lookbackMeta =
    useLookBackWindow && lookBack && values.timestampField
      ? {
          enabled: true,
          minutes: lookBack,
          timestamp_field: values.timestampField,
          amount: Number(values.lookBackAmount) || 1,
          unit: String(values.lookBackUnit || 'hours'),
        }
      : { enabled: false };

  const monitor = {
    name: values.name || 'Untitled monitor',
    description: values.description || '',
    enabled: !values.disabled,
    schedule,
    query: (() => {
      let q = values.pplQuery || '';
      const lbMinutes = computeLookBackMinutes(values);
      if (lbMinutes > 0 && values.timestampField) {
        q = addTimeFilterToQuery(q, lbMinutes, values.timestampField);
      }
      return q;
    })(),
    triggers,
    ui_metadata: {
      ...(values.ui_metadata || {}),
      lookback: lookbackMeta,
    },
  };

  if (lookbackMeta.enabled) {
    monitor.look_back_window_minutes = lookBack;
    monitor.timestamp_field = values.timestampField;
  } else {
    monitor.look_back_window_minutes = null;
    monitor.timestamp_field = null;
  }

  const result = {
    ppl_monitor: monitor,
  };

  if (monitor.look_back_window_minutes !== undefined) {
    result.look_back_window_minutes = monitor.look_back_window_minutes;
  }
  if (monitor.timestamp_field !== undefined) {
    result.timestamp_field = monitor.timestamp_field;
  }

  return result;
};
