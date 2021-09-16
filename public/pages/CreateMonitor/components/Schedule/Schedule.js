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

import React, { Fragment } from 'react';
import { EuiSpacer, EuiText } from '@elastic/eui';
import { Frequency, FrequencyPicker } from './Frequencies';
import Interval from './Frequencies/Interval';

const Schedule = ({ isAd }) => (
  <Fragment>
    <EuiText style={{ marginBottom: '0px' }}>
      <h4>Schedule</h4>
    </EuiText>

    {isAd ? (
      <EuiText color={'subdued'} size={'xs'} style={{ maxWidth: '400px' }}>
        <p>
          Define how often the monitor collects data and how often you may receive alerts. We
          recommend setting this frequency to two times the detector interval to avoid missing
          anomalous results from delayed processing time.
        </p>
      </EuiText>
    ) : null}

    <EuiSpacer size="m" />
    <div style={{ maxWidth: '400px' }}>
      {isAd ? (
        <Interval />
      ) : (
        <div>
          <Frequency />
          <EuiSpacer size="s" />
          <FrequencyPicker />
        </div>
      )}
    </div>
  </Fragment>
);

export default Schedule;
