/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  EuiTitle,
  EuiSpacer,
  EuiIcon,
  EuiText,
  EuiSelect,
  EuiLoadingSpinner,
  EuiLink,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHealth,
  EuiHorizontalRule,
} from '@elastic/eui';
import { stateToLabel } from '../../../../utils/contextMenu/monitors';
import { dateOptionsShort } from '../../../../utils/contextMenu/helpers';
import './styles.scss';

function AssociateExisting({ monitors, selectedMonitorId, setSelectedMonitorId }) {
  const monitor = useMemo(
    () =>
      monitors && selectedMonitorId && monitors.find((monitor) => monitor.id === selectedMonitorId),
    [selectedMonitorId, monitors]
  );
  const options = useMemo(() => {
    if (!monitors) {
      return [];
    }

    const ops = monitors.map((monitor) => ({
      value: monitor.id,
      text: monitor.name,
    }));

    ops.unshift({ value: 'none', text: '' });

    return ops;
  }, [monitors]);

  return (
    <div className="associate-existing">
      <EuiText size="xs">
        <p>
          This is a short description of the feature to get users excited. Learn more in the
          documentation.{' '}
          <a
            href="https://opensearch.org/docs/latest/monitoring-plugins/alerting/index/"
            target="_blank"
          >
            Learn more <EuiIcon type="popout" />
          </a>
        </p>
      </EuiText>
      <EuiSpacer size="l" />
      <EuiTitle size="s">
        <h3>Select monitor to associate</h3>
      </EuiTitle>
      <EuiSpacer size="m" />
      {!monitors && <EuiLoadingSpinner size="l" />}
      {monitors && (
        <EuiSelect
          id="associate-existing__select"
          options={options}
          value={selectedMonitorId}
          onChange={(e) => setSelectedMonitorId(e.target.value)}
          aria-label="Select monitor to associate"
        />
      )}
      <EuiSpacer size="xl" />
      {monitor && (
        <>
          <EuiFlexGroup justifyContent="spaceBetween" alignItems="flexStart">
            <EuiFlexItem>
              <EuiText>
                <h4>{monitor.name}</h4>
              </EuiText>
              <EuiSpacer size="s" />
              <EuiHealth color={stateToLabel[monitor.state].color}>
                {stateToLabel[monitor.state].label}
              </EuiHealth>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiLink href="/app/alerting" external>
                View monitor page
              </EuiLink>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiHorizontalRule margin="m" />
          <ul className="associate-existing__monitor-details">
            {[
              ['Type', (monitor) => monitor.type],
              ['Indexes', (monitor) => monitor.indexes],
              ['Triggers', (monitor) => monitor.triggers.length],
              ['Active alerts', (monitor) => monitor.activeAlerts],
              [
                'Last alert',
                (monitor) =>
                  new Intl.DateTimeFormat('default', dateOptionsShort).format(monitor.date),
              ],
            ].map(([label, getValue]) => (
              <li key={label}>
                <EuiText>
                  <strong>{label}</strong>: {getValue(monitor)}
                </EuiText>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default AssociateExisting;
