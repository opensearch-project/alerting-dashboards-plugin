/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Fragment, useState, useEffect } from 'react';
import { EuiLink, EuiSpacer, EuiText, EuiTitle } from '@elastic/eui';
import MonitorsList from './components/MonitorsList';
import MonitorsEditor from './components/MonitorsEditor';
import { monitorTypesForComposition } from '../../../../utils/constants';
import { titleTemplate } from '../../../../utils/helpers';
import { createQueryObject } from '../../../utils/helpers';

export const getMonitors = async (httpClient) => {
  const dataSourceQuery = createQueryObject();
  const queryObj = {
    from: 0,
    size: 1000,
    search: '',
    sortField: 'name',
    sortDirection: 'desc',
    state: 'all',
  };
  const response = await httpClient.get('../api/alerting/monitors', {
    query: { ...queryObj, ...dataSourceQuery },
  });

  if (response.ok) {
    const { monitors } = response;
    return monitors
      .filter(
        (monitor) =>
          monitor.monitor?.type === 'monitor' &&
          monitorTypesForComposition.has(monitor.monitor?.monitor_type)
      )
      .map((monitor) => ({
        monitor_id: monitor.id,
        monitor_name: monitor.name,
        monitor_type: monitor.monitor?.monitor_type,
      }));
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
      {titleTemplate('Delegate monitors')}
      <EuiText color={'subdued'} size={'xs'}>
        Delegate two or more monitors to run as part of this workflow. The order in which you select
        the monitors determines their order in the workflow. The monitor types per query, per
        bucket, and per document are supported.&nbsp;
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
