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
  EuiCompressedComboBox,
  EuiLoadingSpinner,
  EuiLink,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHealth,
  EuiHorizontalRule,
} from '@elastic/eui';
import { stateToLabel } from '../../../../utils/contextMenu/monitors';
import { dateOptionsLong } from '../../../../utils/contextMenu/helpers';
import './styles.scss';
import { constructUrlFromDataSource } from '../../../../pages/utils/helpers';

function AssociateExisting({ monitors, selectedMonitorId, setSelectedMonitorId }) {
  const selectedOptions = useMemo(() => {
    if (!monitors || !selectedMonitorId) {
      return [];
    }

    const monitor = monitors.find((monitor) => monitor.id === selectedMonitorId);
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

  const monitorDetails = useMemo(() => {
    if (monitor) {
      return [
        ['Type', (monitor) => monitor.type],
        ['Indexes', (monitor) => monitor.indexes],
        ['Triggers', (monitor) => monitor.triggers.length],
        ['Active alerts', (monitor) => monitor.activeAlerts],
        [
          'Last alert',
          (monitor) => {
            if (monitor.date) {
              return new Intl.DateTimeFormat('default', dateOptionsLong).format(monitor.date);
            } else {
              return '-';
            }
          },
        ],
      ].map(([label, getValue]) => (
        <li key={label}>
          <EuiText>
            <strong>{label}</strong>: {getValue(monitor)}
          </EuiText>
        </li>
      ));
    }
  }, [monitor]);

  return (
    <div className="associate-existing">
      <EuiText size="xs">
        <p>
          View existing monitors across your system and add the monitor(s) to a dashboard and
          visualization.{' '}
          <a
            href="https://opensearch.org/docs/latest/observing-your-data/alerting/dashboards-alerting/"
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
        <EuiCompressedComboBox
          id="associate-existing__select"
          options={options}
          selectedOptions={selectedOptions}
          onChange={(selectedOptions) => {
            let id = null;

            if (selectedOptions?.length) {
              const match = monitors.find((monitor) => monitor.name === selectedOptions[0].label);
              id = match && match.id;
            }

            setSelectedMonitorId(id);
          }}
          aria-label="Select monitor to associate"
          isClearable
          singleSelection={{ asPlainText: true }}
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
              <EuiLink
                href={constructUrlFromDataSource(`alerting#/monitors/${monitor.id}`)}
                target="_blank"
              >
                View monitor page
              </EuiLink>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiHorizontalRule margin="m" />
          <ul className="associate-existing__monitor-details">{monitorDetails}</ul>
        </>
      )}
    </div>
  );
}

export default AssociateExisting;
