/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import _ from 'lodash';
import { EuiButton } from '@elastic/eui';
import { FORMIK_INITIAL_TRIGGER_VALUES } from '../../containers/CreateTrigger/utils/constants';
import EnhancedAccordion from '../../../../components/FeatureAnywhereContextMenu/EnhancedAccordion';
import { getInitialTriggerValues } from './utils';

const AddTriggerButton = ({
  arrayHelpers,
  disabled,
  script = FORMIK_INITIAL_TRIGGER_VALUES.script,
  flyoutMode,
  onPostAdd,
  monitorType,
}) => {
  const numTriggers = _.get(arrayHelpers, 'form.values.triggerDefinitions', []).length;
  const buttonText =
    _.get(arrayHelpers, 'form.values.triggerDefinitions', []).length === 0
      ? 'Add trigger'
      : 'Add another trigger';
  const onClick = () => {
    const values = getInitialTriggerValues({ script, flyoutMode, monitorType, numTriggers });
    arrayHelpers.push(values);

    if (onPostAdd) {
      onPostAdd(values);
    }
  };

  if (flyoutMode) {
    return (
      <EnhancedAccordion
        {...{
          id: 'addTrigger',
          isOpen: false,
          isButton: true,
          iconType: 'plusInCircle',
          onToggle: onClick,
          title: 'Add trigger',
        }}
      />
    );
  }

  return (
    <EuiButton fill={false} size={'s'} onClick={onClick} disabled={disabled}>
      {buttonText}
    </EuiButton>
  );
};

export default AddTriggerButton;
