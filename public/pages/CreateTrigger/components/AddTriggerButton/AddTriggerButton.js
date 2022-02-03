/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import _ from 'lodash';
import { EuiButton } from '@elastic/eui';
import { FORMIK_INITIAL_TRIGGER_VALUES } from '../../containers/CreateTrigger/utils/constants';

const AddTriggerButton = ({ arrayHelpers, disabled }) => {
  const buttonText =
    _.get(arrayHelpers, 'form.values.triggerDefinitions', []).length === 0
      ? 'Add trigger'
      : 'Add another trigger';

  return (
    <EuiButton
      fill={false}
      size={'s'}
      onClick={() => arrayHelpers.push(_.cloneDeep(FORMIK_INITIAL_TRIGGER_VALUES))}
      disabled={disabled}
    >
      {buttonText}
    </EuiButton>
  );
};

export default AddTriggerButton;
