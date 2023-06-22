/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Fragment, useEffect, useState } from 'react';
import ContentPanel from '../../../../components/ContentPanel';
import Schedule from '../../components/Schedule';
import AssociateMonitors from '../../components/AssociateMonitors/AssociateMonitors.js';
import { EuiSpacer } from '@elastic/eui';
import * as _ from 'lodash';

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

const WorkflowDetails = ({ isAd, isComposite, httpClient, history, values, isDarkMode }) => {
  const [selectedMonitors, setSelectedMonitors] = useState([]);
  const [monitorOptions, setMonitorOptions] = useState([]);

  useEffect(() => {
    getMonitors(httpClient).then((monitors) => {
      setMonitorOptions(monitors);

      const inputIds = values.inputs?.map((input) => input.monitor_id);
      if (inputIds?.length) {
        const selected = monitors.filter((monitor) => inputIds.indexOf(monitor.monitor_id) !== -1);
        setSelectedMonitors(selected);
        _.set(
          values,
          'associatedMonitors',
          selected.map((monitor) => ({
            value: monitor.monitor_id,
            label: monitor.monitor_name,
          }))
        );
      }
    });
  }, [values.inputs]);

  return (
    <ContentPanel
      title="Workflow"
      titleSize="s"
      panelStyles={{
        paddingBottom: '20px',
        paddingLeft: '10px',
        paddingRight: '10px',
        paddingTop: '20px',
      }}
    >
      <Schedule isAd={isAd} />
      {isComposite && (
        <Fragment>
          <EuiSpacer size="xl" />
          <AssociateMonitors
            isDarkMode={isDarkMode}
            monitors={selectedMonitors}
            options={monitorOptions}
            searchType={values.searchType}
            monitorValues={values}
          />
        </Fragment>
      )}
    </ContentPanel>
  );
};

export default WorkflowDetails;
