/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import _ from 'lodash';
import {
  EuiCompressedFieldSearch,
  EuiFlexGroup,
  EuiCompressedSelect,
  EuiFlexItem,
} from '@elastic/eui';
import { ALERT_STATE, MONITOR_TYPE } from '../../../../utils/constants';
import { PPL_SEVERITY_FILTER_OPTIONS } from '../../utils/pplSeverityUtils';

const stateOptions = [
  { value: 'ALL', text: 'All alerts' },
  { value: ALERT_STATE.ACTIVE, text: 'Active' },
  { value: ALERT_STATE.ERROR, text: 'Error' },
];

const DashboardControlsPpl = ({
  activePage,
  pageCount,
  search,
  severity = 'ALL',
  state = 'ALL',
  onSearchChange,
  onSeverityChange,
  onStateChange,
  onPageChange,
  isAlertsFlyout = false,
  monitorType,
  alertActions = [],
  panelStyles = {},
}) => {
  let supportedStateOptions = stateOptions;
  switch (monitorType) {
    case MONITOR_TYPE.DOC_LEVEL:
      const supportedStates = [ALERT_STATE.ACKNOWLEDGED, ALERT_STATE.ACTIVE, ALERT_STATE.ERROR];
      supportedStateOptions = stateOptions.filter((option) =>
        _.includes(supportedStates, option.value)
      );
      break;
    default:
      break;
  }

  return (
    <EuiFlexGroup style={{ padding: '0px 0px 16px', ...panelStyles }} gutterSize="s">
      <EuiFlexItem>
        <EuiCompressedFieldSearch
          fullWidth={true}
          placeholder="Search"
          onChange={onSearchChange}
          value={search}
        />
      </EuiFlexItem>

      {isAlertsFlyout ? null : (
        <EuiFlexItem grow={false}>
          <EuiCompressedSelect
            options={PPL_SEVERITY_FILTER_OPTIONS}
            value={severity}
            onChange={onSeverityChange}
          />
        </EuiFlexItem>
      )}

      <EuiFlexItem grow={false}>
        <EuiCompressedSelect
          options={supportedStateOptions}
          value={state}
          onChange={onStateChange}
          data-test-subj={'dashboardAlertStateFilter'}
        />
      </EuiFlexItem>

      {alertActions &&
        alertActions.map((action, idx) => (
          <EuiFlexItem key={idx} grow={false}>
            {action}
          </EuiFlexItem>
        ))}
    </EuiFlexGroup>
  );
};

export default DashboardControlsPpl;
