/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import _ from 'lodash';
import { EuiSmallButtonEmpty } from '@elastic/eui';
import { FORMIK_INITIAL_TRIGGER_CONDITION_VALUES } from '../../containers/CreateTrigger/utils/constants';

const AddTriggerConditionButton = ({ arrayHelpers, disabled }) => {
  return (
    <EuiSmallButtonEmpty
      onClick={() => arrayHelpers.push(_.cloneDeep(FORMIK_INITIAL_TRIGGER_CONDITION_VALUES))}
      disabled={disabled}
      size={'xs'}
      data-test-subj="addTriggerConditionButton"
    >
      + Add condition
    </EuiSmallButtonEmpty>
  );
};

export default AddTriggerConditionButton;
