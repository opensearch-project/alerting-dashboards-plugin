/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
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

const durationToMinutes = (raw) => {
  if (!raw) return null;

  if (typeof raw === 'number') {
    return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : null;
  }

  if (typeof raw === 'string') {
    const match = raw.trim().match(/^(\d+)\s*([smhd]?)$/i);
    if (match) {
      const val = Number(match[1]);
      const unit = (match[2] || 'm').toLowerCase();

      if (unit === 's') return Math.max(1, Math.ceil(val / 60));
      if (unit === 'm') return Math.floor(val);
      if (unit === 'h') return Math.floor(val * 60);
      if (unit === 'd') return Math.floor(val * 60 * 24);
    }
    return null;
  }

  if (typeof raw === 'object' && raw.value) {
    const val = Number(raw.value);
    if (!Number.isFinite(val) || val <= 0) return null;

    const unit = String(raw.unit || 'minutes').toLowerCase();
    if (unit.startsWith('minute')) return Math.floor(val);
    if (unit.startsWith('hour')) return Math.floor(val * 60);
    if (unit.startsWith('day')) return Math.floor(val * 60 * 24);
    return Math.floor(val);
  }

  return null;
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

  const throttle = durationToMinutes(t?.suppress ?? t?.throttle);
  const expires = durationToMinutes(t?.expires ?? t?.queryLevelTrigger?.expires);

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
    severity: normalizeSeverity(t?.severity),
    actions: cleanActions(t?.actions),
    mode: (t?.mode || 'result_set').toLowerCase(),
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

  if (throttle !== null) {
    trigger.throttle_minutes = throttle;
  }
  if (expires !== null) {
    trigger.expires_minutes = expires;
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
          mode: 'result_set',
          type: 'number_of_results',
          num_results_condition: '>=',
          num_results_value: 1,
          custom_condition: null,
          expires_minutes: 10080,
        },
      ];

  const monitor = {
    name: values.name || 'Untitled monitor',
    description: values.description || '',
    enabled: !values.disabled,
    schedule,
    query: values.pplQuery || '',
    triggers,
  };

  // Explicitly handle look back window: set to null if disabled, or set value if enabled
  const useLookBackWindow = values?.useLookBackWindow ?? true;
  if (!useLookBackWindow) {
    // useLookBackWindow is false - explicitly set to null to clear the value
    monitor.look_back_window_minutes = null;
    monitor.timestamp_field = null;
  } else if (lookBack && values.timestampField) {
    // useLookBackWindow is true - set the calculated minutes and timestamp field
    monitor.look_back_window_minutes = lookBack;
    monitor.timestamp_field = values.timestampField;
  }

  const result = {
    ppl_monitor: monitor,
  };

  // Also set look_back_window_minutes at root level since API returns it there
  // This ensures the backend properly updates the value
  if (monitor.look_back_window_minutes !== undefined) {
    result.look_back_window_minutes = monitor.look_back_window_minutes;
  }
  if (monitor.timestamp_field !== undefined) {
    result.timestamp_field = monitor.timestamp_field;
  }

  return result;
};
