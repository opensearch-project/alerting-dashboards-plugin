/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import _ from 'lodash';
import { EuiButton } from '@elastic/eui';

import { FORMIK_INITIAL_SENDER_VALUES } from '../Email/utils/constants';

const AddSenderButton = ({ arrayHelpers }) => (
  <EuiButton onClick={() => arrayHelpers.unshift(_.cloneDeep(FORMIK_INITIAL_SENDER_VALUES))}>
    Add sender
  </EuiButton>
);

export default AddSenderButton;
