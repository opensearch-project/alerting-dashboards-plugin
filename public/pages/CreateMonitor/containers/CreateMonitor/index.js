/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import LegacyCreateMonitor from './CreateMonitor';
import PplAlertingCreateMonitor from './PplAlertingCreateMonitor';
import { isPplAlertingEnabled } from '../../../../services';

const CreateMonitorRouter = (props) => {
  const enabled = isPplAlertingEnabled();
  const location = props.location || props.history?.location || window.location;
  const search = typeof location?.search === 'string' ? location.search : '';
  const params = new URLSearchParams(search);
  const mode = params.get('mode');

  if (!enabled || mode === 'classic') {
    return <LegacyCreateMonitor {...props} />;
  }

  return <PplAlertingCreateMonitor {...props} />;
};

export default CreateMonitorRouter;
