/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiCompressedFieldSearch,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPagination,
  EuiCompressedSelect,
} from '@elastic/eui';

const MONITOR_STATES = {
  ALL: 'all',
  ENABLED: 'enabled',
  DISABLED: 'disabled',
};

const states = [
  { value: MONITOR_STATES.ALL, text: 'All states' },
  { value: MONITOR_STATES.ENABLED, text: 'Enabled' },
  { value: MONITOR_STATES.DISABLED, text: 'Disabled' },
];

const MonitorControls = ({
  activePage,
  pageCount,
  search,
  state,
  onSearchChange,
  onStateChange,
  onPageClick,
  monitorActions = null,
}) => (
  <EuiFlexGroup style={{ padding: '0px 16px 16px 16px' }} gutterSize="s" responsive={false}>
    <EuiFlexItem grow={true}>
      <EuiCompressedFieldSearch
        fullWidth={true}
        value={search}
        placeholder="Search"
        onChange={onSearchChange}
      />
    </EuiFlexItem>
    <EuiFlexItem grow={false} style={{ minWidth: '150px' }}>
      <EuiCompressedSelect options={states} value={state} onChange={onStateChange} />
    </EuiFlexItem>
  </EuiFlexGroup>
);

export default MonitorControls;
