/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import _ from 'lodash';

import { FORMIK_INITIAL_TRIGGER_VALUES, TRIGGER_TYPE } from '../../CreateTrigger/utils/constants';

export const validateTriggerName = (triggers, triggerToEdit, fieldPath) => (value) => {
  if (!value) return 'Required.';
  const nameExists = triggers.filter((trigger) => {
    const triggerId = _.get(
      trigger,
      `${TRIGGER_TYPE.BUCKET_LEVEL}.id`,
      _.get(trigger, `${TRIGGER_TYPE.QUERY_LEVEL}.id`)
    );
    const triggerName = _.get(
      trigger,
      `${TRIGGER_TYPE.BUCKET_LEVEL}.name`,
      _.get(trigger, `${TRIGGER_TYPE.QUERY_LEVEL}.name`, FORMIK_INITIAL_TRIGGER_VALUES.name)
    );
    const triggerToEditId = _.get(triggerToEdit, `${fieldPath}id`, triggerToEdit.id);
    return triggerToEditId !== triggerId && triggerName.toLowerCase() === value.toLowerCase();
  });
  if (nameExists.length > 0) {
    return 'Trigger name already used.';
  }
  // TODO: character restrictions
  // TODO: character limits
};
