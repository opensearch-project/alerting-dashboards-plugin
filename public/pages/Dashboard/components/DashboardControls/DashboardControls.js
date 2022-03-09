/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiFieldSearch, EuiFlexGroup, EuiSelect, EuiFlexItem, EuiPagination } from '@elastic/eui';
import { ALERT_STATE } from '../../../../utils/constants';

const severityOptions = [
  { value: 'ALL', text: 'All severity levels' },
  { value: '1', text: '1 (Highest)' },
  { value: '2', text: '2 (High)' },
  { value: '3', text: '3 (Medium)' },
  { value: '4', text: '4 (Low)' },
  { value: '5', text: '5 (Lowest)' },
];

const stateOptions = [
  { value: 'ALL', text: 'All alerts' },
  { value: ALERT_STATE.ACTIVE, text: 'Active' },
  { value: ALERT_STATE.ACKNOWLEDGED, text: 'Acknowledged' },
  { value: ALERT_STATE.COMPLETED, text: 'Completed' },
  { value: ALERT_STATE.ERROR, text: 'Error' },
  { value: ALERT_STATE.DELETED, text: 'Deleted' },
];

const DashboardControls = ({
  activePage,
  pageCount,
  search,
  severity = severityOptions[0],
  state = stateOptions[0],
  onSearchChange,
  onSeverityChange,
  onStateChange,
  onPageChange,
  isAlertsFlyout = false,
}) => (
  <EuiFlexGroup style={{ padding: '0px 5px' }}>
    <EuiFlexItem>
      <EuiFieldSearch
        fullWidth={true}
        placeholder="Search"
        onChange={onSearchChange}
        value={search}
      />
    </EuiFlexItem>

    {isAlertsFlyout ? null : (
      <EuiFlexItem grow={false}>
        <EuiSelect options={severityOptions} value={severity} onChange={onSeverityChange} />
      </EuiFlexItem>
    )}

    <EuiFlexItem grow={false}>
      <EuiSelect
        options={stateOptions}
        value={state}
        onChange={onStateChange}
        data-test-subj={'dashboardAlertStateFilter'}
      />
    </EuiFlexItem>
    <EuiFlexItem grow={false} style={{ justifyContent: 'center' }}>
      <EuiPagination pageCount={pageCount} activePage={activePage} onPageClick={onPageChange} />
    </EuiFlexItem>
  </EuiFlexGroup>
);

export default DashboardControls;
