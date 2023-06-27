/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Fragment, useState, useEffect } from 'react';
import { EuiSpacer, EuiText } from '@elastic/eui';
import MonitorsList from './components/MonitorsList';
import MonitorsEditor from './components/MonitorsEditor';

export const getMonitors = async (httpClient) => {
  const response = await httpClient.get('../api/alerting/monitors', {
    query: {
      from: 0,
      size: 1000,
      search: '',
      sortField: 'name',
      sortDirection: 'desc',
      state: 'all',
    },
  });

  if (response.ok) {
    const { monitors, totalMonitors } = response;
    return monitors.map((monitor) => ({ monitor_id: monitor.id, monitor_name: monitor.name }));
  } else {
    console.log('error getting monitors:', response);
    return [];
  }
};

const AssociateMonitors = ({ isDarkMode, values, httpClient, errors }) => {
  const [graphUi, setGraphUi] = useState(false);

  useEffect(() => {
    setGraphUi(values.searchType === 'graph');
  }, [values.searchType]);

  return (
    <Fragment>
      <EuiText size={'m'} style={{ paddingBottom: '0px', marginBottom: '0px' }}>
        <h4>Associate monitors</h4>
      </EuiText>
      <EuiText color={'subdued'} size={'xs'}>
        Associate two or more monitors to run as part of this workflow.
      </EuiText>

      <EuiSpacer size="m" />

      {graphUi ? (
        <MonitorsList values={values} httpClient={httpClient} />
      ) : (
        <MonitorsEditor values={values} errors={errors} isDarkMode={isDarkMode} />
      )}
    </Fragment>
  );
};

export default AssociateMonitors;
