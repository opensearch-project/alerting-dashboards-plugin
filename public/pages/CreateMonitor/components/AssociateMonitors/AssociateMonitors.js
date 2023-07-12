/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Fragment, useState, useEffect } from 'react';
import { EuiLink, EuiSpacer, EuiText } from '@elastic/eui';
import MonitorsList from './components/MonitorsList';
import MonitorsEditor from './components/MonitorsEditor';
import { monitorTypesForComposition } from '../../../../utils/constants';

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
    const { monitors } = response;
    return monitors
      .filter(
        (monitor) =>
          monitor.monitor?.type === 'monitor' &&
          monitorTypesForComposition.has(monitor.monitor?.monitor_type)
      )
      .map((monitor) => ({ monitor_id: monitor.id, monitor_name: monitor.name }));
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
        <h4>Delegate monitors</h4>
      </EuiText>
      <EuiText color={'subdued'} size={'xs'}>
        Delegate two or more monitors to run as part of this workflow. The monitor types per query,
        per bucket, and per document are supported.{' '}
        <EuiLink
          href={
            'https://opensearch.org/docs/latest/observing-your-data/alerting/monitors/#monitor-types'
          }
          target="_blank"
        >
          Learn more.
        </EuiLink>
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
