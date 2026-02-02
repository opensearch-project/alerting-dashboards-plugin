/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';

export const validateTriggerName = (triggers = [], index, isFlyOut = false) => {
  return (value) => {
    const trimmedValue = value.trim();
    if (!trimmedValue) return isFlyOut ? 'Required.' : 'Trigger name is required.';
    const triggerNameExistWithIndex = triggers.some((trigger, i) => {
      return i !== index && trimmedValue === trigger.name.trim();
    });
    if (triggerNameExistWithIndex) {
      return 'Trigger name already used.';
    }

    // TODO: character restrictions
    // TODO: character limits
  };
};

export const validateNumResultsValue = (fieldPath) => {
  return (value, formValues) => {
    const type = _.get(formValues, `${fieldPath}type`, 'number_of_results');
    const condition = _.get(formValues, `${fieldPath}num_results_condition`, '>=');

    if (type === 'number_of_results' && (condition === '>=' || condition === '>')) {
      const numValue = Number(value);
      if (!isNaN(numValue) && numValue >= 10000) {
        return 'Trigger condition value cannot be greater than or equal to 10000 for "Number of results" type.';
      }
    }
  };
};
