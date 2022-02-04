/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

import React from 'react';
import { EuiEmptyPrompt, EuiText } from '@elastic/eui';
import AddTriggerButton from '../AddTriggerButton';
import { FORMIK_INITIAL_TRIGGER_VALUES } from '../../containers/CreateTrigger/utils/constants';

const addTriggerButton = (arrayHelpers, script) => (
  <AddTriggerButton arrayHelpers={arrayHelpers} script={script} />
);

const TriggerEmptyPrompt = ({ arrayHelpers, script = FORMIK_INITIAL_TRIGGER_VALUES.script }) => (
  <EuiEmptyPrompt
    style={{ maxWidth: '45em' }}
    body={
      <EuiText>
        <h4>No triggers</h4>
        <p>Add a trigger to define conditions and actions.</p>
      </EuiText>
    }
    actions={addTriggerButton(arrayHelpers, script)}
  />
);

export default TriggerEmptyPrompt;
