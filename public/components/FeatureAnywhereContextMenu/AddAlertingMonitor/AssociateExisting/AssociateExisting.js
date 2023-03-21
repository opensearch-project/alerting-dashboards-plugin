/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import {
  EuiTitle,
  EuiSpacer,
  EuiIcon,
  EuiText,
  EuiComboBox,
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
  const selectedOptions = useMemo(() => {
    if (!monitors || !selectedMonitorId) {
      return [];
    }

    const monitor = (monitors || []).find((monitor) => monitor.id === selectedMonitorId);
    return monitor ? [{ label: monitor.name }] : [];
  }, [selectedMonitorId, monitors]);
  const monitor = useMemo(
    () =>
      monitors && selectedMonitorId && monitors.find((monitor) => monitor.id === selectedMonitorId),
    [selectedMonitorId, monitors]
  );
  const options = useMemo(() => {
    if (!monitors) {
      return [];
    }

    return monitors.map((monitor) => ({
      label: monitor.name,
    }));
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
        <EuiComboBox
          id="associate-existing__select"
          options={options}
          selectedOptions={selectedOptions}
          onChange={(selectedOptions) => {
            let id = null;

            if (selectedOptions && selectedOptions.length) {
              const match = monitors.find((monitor) => monitor.name === selectedOptions[0].label);
              id = match && match.id;
            }

            setSelectedMonitorId(id);
          }}
          aria-label="Select monitor to associate"
          isClearable
          singleSelection
          placeholder="Search a monitor"
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
