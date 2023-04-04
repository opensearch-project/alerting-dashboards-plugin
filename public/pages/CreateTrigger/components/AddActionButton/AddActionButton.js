/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import _ from 'lodash';
import { EuiButton, EuiButtonEmpty, EuiPanel } from '@elastic/eui';
import { getInitialActionValues } from './utils';
import { MONITOR_TYPE } from '../../../../utils/constants';
import './styles.scss';

const AddActionButton = ({
  arrayHelpers,
  type = 'slack',
  numOfActions,
  flyoutMode,
  onAddTrigger,
}) => {
  const buttonText =
    numOfActions === undefined || numOfActions === 0 ? 'Add action' : 'Add another action';
  const monitorType = _.get(arrayHelpers, 'form.values.monitor_type', MONITOR_TYPE.QUERY_LEVEL);
  const onClick = () => {
    if (onAddTrigger) {
      onAddTrigger();
    }

    arrayHelpers.push(getInitialActionValues({ monitorType, numOfActions, flyoutMode }));
  };

  return flyoutMode ? (
    <EuiPanel paddingSize="none">
      <EuiButtonEmpty
        onClick={onClick}
        iconType="plusInCircle"
        className="add-action-button__flyout-button"
      >
        Add notification
      </EuiButtonEmpty>
    </EuiPanel>
  ) : (
    <EuiButton fill={false} size={'s'} onClick={onClick}>
      {buttonText}
    </EuiButton>
  );
};

export default AddActionButton;
