/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import _ from 'lodash';
import { EuiButton } from '@elastic/eui';

import { FORMIK_INITIAL_EMAIL_GROUP_VALUES } from '../Email/utils/constants';

const AddEmailGroupButton = ({ arrayHelpers }) => (
  <EuiButton
    isDisabled={true}
    onClick={() => arrayHelpers.unshift(_.cloneDeep(FORMIK_INITIAL_EMAIL_GROUP_VALUES))}
  >
    Add email group
  </EuiButton>
);

export default AddEmailGroupButton;
