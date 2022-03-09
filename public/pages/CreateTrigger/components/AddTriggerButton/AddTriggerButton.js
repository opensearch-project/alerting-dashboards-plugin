/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import _ from 'lodash';
import { EuiButton } from '@elastic/eui';
import { FORMIK_INITIAL_TRIGGER_VALUES } from '../../containers/CreateTrigger/utils/constants';

const AddTriggerButton = ({
  arrayHelpers,
  disabled,
  script = FORMIK_INITIAL_TRIGGER_VALUES.script,
}) => {
  const buttonText =
    _.get(arrayHelpers, 'form.values.triggerDefinitions', []).length === 0
      ? 'Add trigger'
      : 'Add another trigger';
  const values = _.cloneDeep({ ...FORMIK_INITIAL_TRIGGER_VALUES, script });
  return (
    <EuiButton
      fill={false}
      size={'s'}
      onClick={() => arrayHelpers.push(values)}
      disabled={disabled}
    >
      {buttonText}
    </EuiButton>
  );
};

export default AddTriggerButton;
