/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import _ from 'lodash';
import { EuiButtonEmpty } from '@elastic/eui';
import { FORMIK_INITIAL_TRIGGER_CONDITION_VALUES } from '../../containers/CreateTrigger/utils/constants';

const AddTriggerConditionButton = ({ arrayHelpers, disabled }) => {
  return (
    <EuiButtonEmpty
      onClick={() => arrayHelpers.push(_.cloneDeep(FORMIK_INITIAL_TRIGGER_CONDITION_VALUES))}
      disabled={disabled}
      size={'xs'}
      data-test-subj="addTriggerConditionButton"
    >
      + Add condition
    </EuiButtonEmpty>
  );
};

export default AddTriggerConditionButton;
