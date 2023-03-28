/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import _ from 'lodash';
import { EuiButton, EuiButtonEmpty } from '@elastic/eui';
import { FORMIK_INITIAL_TRIGGER_VALUES } from '../../containers/CreateTrigger/utils/constants';
import EnhancedAccordion from '../../../../components/FeatureAnywhereContextMenu/EnhancedAccordion';

const AddTriggerButton = ({
  arrayHelpers,
  disabled,
  script = FORMIK_INITIAL_TRIGGER_VALUES.script,
  flyoutMode,
}) => {
  const buttonText =
    _.get(arrayHelpers, 'form.values.triggerDefinitions', []).length === 0
      ? 'Add trigger'
      : 'Add another trigger';
  const values = _.cloneDeep({ ...FORMIK_INITIAL_TRIGGER_VALUES, script });
  const onClick = () => arrayHelpers.push(values);

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
