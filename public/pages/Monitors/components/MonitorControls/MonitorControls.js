/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiFieldSearch, EuiFlexGroup, EuiFlexItem, EuiPagination, EuiSelect } from '@elastic/eui';

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
}) => (
  <EuiFlexGroup style={{ padding: '0px 5px' }}>
    <EuiFlexItem>
      <EuiFieldSearch
        fullWidth={true}
        value={search}
        placeholder="Search"
        onChange={onSearchChange}
      />
    </EuiFlexItem>
    <EuiFlexItem grow={false}>
      <EuiSelect options={states} value={state} onChange={onStateChange} />
    </EuiFlexItem>
    <EuiFlexItem grow={false} style={{ justifyContent: 'center' }}>
      <EuiPagination pageCount={pageCount} activePage={activePage} onPageClick={onPageClick} />
    </EuiFlexItem>
  </EuiFlexGroup>
);

export default MonitorControls;
