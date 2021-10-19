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
import { EuiButtonEmpty, EuiText } from '@elastic/eui';
import AlertsDashboardFlyoutComponent from './components/AlertsDashboardFlyoutComponent';

const alertsDashboard = (payload) => {
  const { closeFlyout, trigger_name } = payload;
  return {
    flyoutProps: {
      'aria-labelledby': 'alertsDashboardFlyout',
      size: 'm',
      hideCloseButton: true,
    },
    headerProps: { hasBorder: true },
    header: (
      <EuiText>
        <h2>{`Alerts by ${trigger_name}`}</h2>
      </EuiText>
    ),
    footerProps: { style: { backgroundColor: '#F5F7FA' } },
    footer: (
      <EuiButtonEmpty
        iconType={'cross'}
        onClick={() => closeFlyout()}
        style={{ paddingLeft: '0px', marginLeft: '0px' }}
      >
        Close
      </EuiButtonEmpty>
    ),
    body: <AlertsDashboardFlyoutComponent {...payload} />,
  };
};

export default alertsDashboard;
