/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import _ from 'lodash';
import { EuiButton } from '@elastic/eui';
import { FORMIK_INITIAL_TRIGGER_VALUES } from '../../containers/CreateTrigger/utils/constants';
import EnhancedAccordion from '../../../../components/FeatureAnywhereContextMenu/EnhancedAccordion';
import { getInitialActionValues } from '../../../CreateTrigger/components/AddActionButton/utils';

const AddTriggerButton = ({
  arrayHelpers,
  disabled,
  script = FORMIK_INITIAL_TRIGGER_VALUES.script,
  flyoutMode,
  onAddTrigger,
  monitorType,
}) => {
  const buttonText =
    _.get(arrayHelpers, 'form.values.triggerDefinitions', []).length === 0
      ? 'Add trigger'
      : 'Add another trigger';
  const onClick = () => {
    if (onAddTrigger) {
      onAddTrigger();
    }

    const values = _.cloneDeep({ ...FORMIK_INITIAL_TRIGGER_VALUES, script });

    if (flyoutMode) {
      values.actions = [getInitialActionValues({ monitorType, numOfActions: 0, flyoutMode })];
    }

    arrayHelpers.push(values);
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
