/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiSmallButton, EuiEmptyPrompt, EuiText } from '@elastic/eui';

import { APP_PATH } from '../../../../utils/constants';
import { PLUGIN_NAME } from '../../../../../utils/constants';

const filterText =
  'There are no monitors matching your applied filters. Reset your filters to view your monitors.';
const emptyMonitorText =
  'There are no existing monitors. Create a monitor to add triggers and actions.';
const loadingText = 'Loading monitors...';
const createMonitorButton = (
  <EuiSmallButton fill href={`${PLUGIN_NAME}#${APP_PATH.CREATE_MONITOR}`}>
    Create monitor
  </EuiSmallButton>
);
const resetFiltersButton = (resetFilters) => (
  <EuiSmallButton fill onClick={resetFilters}>
    Reset Filters
  </EuiSmallButton>
);

const getMessagePrompt = ({ filterIsApplied, loading }) => {
  if (loading) return loadingText;
  if (filterIsApplied) return filterText;
  return emptyMonitorText;
};

const getActions = ({ filterIsApplied, loading, resetFilters }) => {
  if (loading) return null;
  if (filterIsApplied) return resetFiltersButton(resetFilters);
  return createMonitorButton;
};

const MonitorEmptyPrompt = (props) => (
  <EuiEmptyPrompt
    style={{ maxWidth: '45em' }}
    body={
      <EuiText size="s">
        <p>{getMessagePrompt(props)}</p>
      </EuiText>
    }
    actions={getActions(props)}
  />
);

export default MonitorEmptyPrompt;
