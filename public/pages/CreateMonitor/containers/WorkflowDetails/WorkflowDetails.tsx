/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Fragment, useEffect, useState } from 'react';
import ContentPanel from '../../../../components/ContentPanel';
import Schedule from '../../components/Schedule';
import AssociateMonitors from '../../components/AssociateMonitors/AssociateMonitors';
import { EuiSpacer } from '@elastic/eui';

const WorkflowDetails = ({ isAd, isComposite, httpClient, history, values }) => {
  const [selectedMonitors, setSelectedMonitors] = useState([]);
  const [monitorOptions, setMonitorOptions] = useState([]);

  const getMonitors = async () => {
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

  useEffect(() => {
    getMonitors().then((monitors) => {
      setMonitorOptions(monitors);

      // const getMonitorById = (id) => monitors.find((mon) => mon.monitor_id === id);
      // const newSelectedMonitors = values.inputs.map((monitor) => ({
      //   value: monitor.monitor_id,
      //   label: getMonitorById(monitor.monitor_id)?.monitor_name,
      // }));
      // setSelectedMonitors(newSelectedMonitors);
    });
  }, [values]);

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
            monitors={selectedMonitors}
            options={monitorOptions}
            history={history}
            values={values}
          />
        </Fragment>
      )}
    </ContentPanel>
  );
};

export default WorkflowDetails;
