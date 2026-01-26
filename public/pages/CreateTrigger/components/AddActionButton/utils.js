/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import { DEFAULT_MESSAGE_SOURCE, FORMIK_INITIAL_ACTION_VALUES } from '../../utils/constants';
import { MONITOR_TYPE } from '../../../../utils/constants';
import { getDigitId, getUniqueName } from '../../../../utils/helpers';

export const getInitialActionValues = ({ monitorType, flyoutMode, actions }) => {
  const initialActionValues = _.cloneDeep(FORMIK_INITIAL_ACTION_VALUES);

  switch (monitorType) {
    case MONITOR_TYPE.BUCKET_LEVEL:
      _.set(
        initialActionValues,
        'message_template.source',
        DEFAULT_MESSAGE_SOURCE.BUCKET_LEVEL_MONITOR
      );
      break;
    case MONITOR_TYPE.QUERY_LEVEL:
    case MONITOR_TYPE.CLUSTER_METRICS:
      _.set(
        initialActionValues,
        'message_template.source',
        DEFAULT_MESSAGE_SOURCE.QUERY_LEVEL_MONITOR
      );
      break;
  }

  const id = getDigitId();
  initialActionValues.id = `notification${id}`;

  // Add name based on previous name;
  if (flyoutMode) {
    initialActionValues.name = getUniqueName(actions, 'Notification ');
  }

  return initialActionValues;
};

export const getInitialPplActionValues = ({ flyoutMode, actions }) => {
  const initialActionValues = _.cloneDeep(FORMIK_INITIAL_ACTION_VALUES);

  // Set PPL-specific message template
  _.set(initialActionValues, 'message_template.source', DEFAULT_MESSAGE_SOURCE.PPL_MONITOR);

  const id = getDigitId();
  initialActionValues.id = `notification${id}`;

  // Add name based on previous name;
  if (flyoutMode) {
    initialActionValues.name = getUniqueName(actions, 'Notification ');
  }

  return initialActionValues;
};
