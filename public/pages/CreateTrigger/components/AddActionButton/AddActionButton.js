/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import _ from 'lodash';
import { EuiSmallButton, EuiSmallButtonEmpty, EuiPanel } from '@elastic/eui';
import { getInitialActionValues } from './utils';
import { MONITOR_TYPE } from '../../../../utils/constants';
import './styles.scss';

const AddActionButton = ({
  arrayHelpers,
  type = 'slack',
  numActions,
  flyoutMode,
  onPostAdd,
  values,
  fieldPath,
}) => {
  const buttonText =
    numActions === undefined || numActions === 0 ? 'Add action' : 'Add another action';
  const monitorType = _.get(arrayHelpers, 'form.values.monitor_type', MONITOR_TYPE.QUERY_LEVEL);
  const onClick = () => {
    const actions = _.get(values, `${fieldPath}actions`, []);
    const initialValues = getInitialActionValues({ monitorType, flyoutMode, actions });
    arrayHelpers.push(initialValues);

    if (onPostAdd) {
      onPostAdd(initialValues);
    }
  };

  return flyoutMode ? (
    <EuiPanel paddingSize="none">
      <EuiSmallButtonEmpty
        onClick={onClick}
        iconType="plusInCircle"
        className="add-action-button__flyout-button"
      >
        Add notification
      </EuiSmallButtonEmpty>
    </EuiPanel>
  ) : (
    <EuiButton fill={false} size={'s'} onClick={onClick}>
      {buttonText}
    </EuiButton>
  );
};

export default AddActionButton;
