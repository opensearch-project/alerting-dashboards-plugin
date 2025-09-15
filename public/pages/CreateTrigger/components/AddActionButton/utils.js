/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import { DEFAULT_MESSAGE_SOURCE, FORMIK_INITIAL_ACTION_VALUES } from '../../utils/constants';
import { MONITOR_TYPE } from '../../../../utils/constants';
import { getDigitId, getUniqueName } from '../../../../utils/helpers';

export const getInitialActionValues = ({ monitorType, monitorMode, flyoutMode, actions }) => {
  const initialActionValues = _.cloneDeep(FORMIK_INITIAL_ACTION_VALUES);

  const defaults = monitorMode === 'ppl' ? DEFAULT_MESSAGE_SOURCE.V2 : DEFAULT_MESSAGE_SOURCE.LEGACY;

  switch (monitorType) {
    case MONITOR_TYPE.BUCKET_LEVEL:
      _.set(
        initialActionValues,
        'message_template.source',
        defaults.BUCKET_LEVEL_MONITOR
      );
      break;
    case MONITOR_TYPE.QUERY_LEVEL:
    case MONITOR_TYPE.CLUSTER_METRICS:
      _.set(
        initialActionValues,
        'message_template.source',
        defaults.QUERY_LEVEL_MONITOR
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
