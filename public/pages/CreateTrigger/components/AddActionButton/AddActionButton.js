/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import _ from 'lodash';
import { EuiButton } from '@elastic/eui';

import { DEFAULT_MESSAGE_SOURCE, FORMIK_INITIAL_ACTION_VALUES } from '../../utils/constants';
import { MONITOR_TYPE } from '../../../../utils/constants';

const AddActionButton = ({ arrayHelpers, type = 'slack', numOfActions }) => {
  const buttonText =
    numOfActions === undefined || numOfActions === 0 ? 'Add action' : 'Add another action';
  const monitorType = _.get(arrayHelpers, 'form.values.monitor_type', MONITOR_TYPE.QUERY_LEVEL);
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
  return (
    <EuiButton fill={false} size={'s'} onClick={() => arrayHelpers.push(initialActionValues)}>
      {buttonText}
    </EuiButton>
  );
};

export default AddActionButton;
