/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import _ from 'lodash';
import { EuiButton, EuiSmallButtonEmpty, EuiPanel } from '@elastic/eui';
import { getInitialPplActionValues } from './utils';
import './styles.scss';

const AddActionButtonPpl = ({
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
  const onClick = () => {
    const actions = _.get(values, `${fieldPath}actions`, []);
    const initialValues = getInitialPplActionValues({ flyoutMode, actions });
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

export default AddActionButtonPpl;
