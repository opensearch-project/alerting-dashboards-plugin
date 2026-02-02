/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import DashboardClassic from './DashboardClassic';
import DashboardRouter from './DashboardRouter';
import { isPplAlertingEnabled } from '../../../services';

const Dashboard = (props) => {
  if (!isPplAlertingEnabled()) {
    return <DashboardClassic {...props} />;
  }

  return <DashboardRouter {...props} />;
};

export default Dashboard;
