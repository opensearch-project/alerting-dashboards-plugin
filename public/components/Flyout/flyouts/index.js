/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import message from './message';
import messageFrequency from './messageFrequency';
import triggerCondition from './triggerCondition';
import alertsDashboard from './alertsDashboard';
import { chainedAlertDetailsFlyout } from '../../../pages/Dashboard/components/ChainedAlertDetailsFlyout/ChainedAlertDetailsFlyout';

const Flyouts = {
  messageFrequency,
  message,
  triggerCondition,
  alertsDashboard,
  chainedAlertDetailsFlyout,
};

export default Flyouts;
