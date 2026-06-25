/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';

export const triggerToFormikPpl = (trigger) => {
  const inner = trigger?.ppl_trigger || trigger || {};
  const {
    id,
    name,
    severity,
    actions = [],
    type,
    num_results_condition,
    num_results_value,
    custom_condition,
  } = inner;

  return {
    id: id || undefined,
    name: name || '',
    severity: severity || 'info',
    actions: _.cloneDeep(actions),
    type: type || 'number_of_results',
    num_results_condition: num_results_condition || '>=',
    num_results_value: num_results_value !== undefined ? num_results_value : 1,
    custom_condition: custom_condition || '',
  };
};
