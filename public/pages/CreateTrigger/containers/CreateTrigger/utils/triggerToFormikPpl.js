/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';

const minutesToFormikDuration = (minutes, defaultMinutes = 0) => {
  const totalMinutes = minutes || defaultMinutes;
  if (totalMinutes >= 1440 && totalMinutes % 1440 === 0) {
    return { value: totalMinutes / 1440, unit: 'days' };
  }
  if (totalMinutes >= 60 && totalMinutes % 60 === 0) {
    return { value: totalMinutes / 60, unit: 'hours' };
  }
  return { value: totalMinutes, unit: 'minutes' };
};

export const triggerToFormikPpl = (trigger) => {
  const {
    id,
    name,
    severity,
    actions = [],
    mode,
    type,
    num_results_condition,
    num_results_value,
    custom_condition,
    throttle,
    throttle_minutes,
    expires,
    expires_minutes,
  } = trigger || {};

  const hasThrottle =
    (throttle_minutes ?? throttle) !== undefined && (throttle_minutes ?? throttle) !== null;
  const suppress = hasThrottle
    ? minutesToFormikDuration(throttle_minutes ?? throttle, 0)
    : { value: '', unit: 'minutes' };
  const expiresDuration = minutesToFormikDuration(expires_minutes ?? expires, 7 * 24 * 60);

  return {
    id: id || undefined,
    name: name || '',
    severity: severity || 'info',
    actions: _.cloneDeep(actions),
    mode: mode || 'result_set',
    type: type || 'number_of_results',
    num_results_condition: num_results_condition || '>=',
    num_results_value: num_results_value !== undefined ? num_results_value : 1,
    custom_condition: custom_condition || '',
    throttle_enabled: hasThrottle && (throttle_minutes ?? throttle) !== 0,
    suppress,
    expires: expiresDuration,
  };
};
