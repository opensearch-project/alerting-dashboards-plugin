/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import _ from 'lodash';

export const validateTriggerName = (triggers, index) => {
  return (value) => {
    if (!value) return 'Trigger name is required.';
    const nameExists = triggers.filter(() => {
      const triggerName = _.get(triggers, `[${index}]name`, undefined);
      const triggerNameExistWithIndex = triggers.filter((trigger, i) => {
        return i !== index && triggerName === trigger.name;
      });
      if (triggerNameExistWithIndex.length > 0) {
        return 'Trigger name already used.';
      }
    });
    if (nameExists.length > 0) {
      return 'Trigger name already used.';
    }
    // TODO: character restrictions
    // TODO: character limits
  };
};
