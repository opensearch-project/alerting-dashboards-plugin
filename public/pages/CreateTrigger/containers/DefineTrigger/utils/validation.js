/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';

import { FORMIK_INITIAL_TRIGGER_VALUES, TRIGGER_TYPE } from '../../CreateTrigger/utils/constants';
import { MONITOR_TYPE } from '../../../../../utils/constants';

export const validateTriggerName = (triggers, triggerToEdit, fieldPath, isNewMonitor) => {
  return (value) => {
    if (!value) return 'Required.';
    const { monitor_type } = triggerToEdit;

    if (
      isNewMonitor &&
      (monitor_type === MONITOR_TYPE.QUERY_LEVEL || monitor_type === MONITOR_TYPE.CLUSTER_METRICS)
    ) {
      const triggerName = _.get(triggerToEdit, `${fieldPath}name`, undefined);
      const index = +fieldPath.substr(19, 1);
      const isNameExistWithIndex = triggers.filter((trigger, i) => {
        return i !== index && triggerName === trigger.name;
      });
    }

    const nameExists = triggers.filter((trigger) => {
      if (isNewMonitor) {
        const triggerName = _.get(triggerToEdit, `${fieldPath}name`, undefined);
        const index = +fieldPath.substr(19, 1);
        const triggerNameExistWithIndex = triggers.filter((trigger, i) => {
          return i !== index && triggerName === trigger.name;
        });
        if (triggerNameExistWithIndex.length > 0) {
          return 'Trigger name already used.';
        }
      }
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
};
