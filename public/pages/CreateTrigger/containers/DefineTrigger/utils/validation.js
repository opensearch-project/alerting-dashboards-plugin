/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

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
