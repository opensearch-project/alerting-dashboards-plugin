/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import alertsDashboardClassic from './alertsDashboardClassic';
import alertsDashboardPpl from './alertsDashboardPpl';
import { isPplAlertingEnabled } from '../../../services';

const alertsDashboard = (payload) => {
  const { viewMode } = payload;
  const shouldUsePpl = viewMode === 'new' && isPplAlertingEnabled();
  return shouldUsePpl ? alertsDashboardPpl(payload) : alertsDashboardClassic(payload);
};

export default alertsDashboard;
