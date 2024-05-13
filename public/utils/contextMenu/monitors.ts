import { useState, useEffect } from 'react';
import _ from 'lodash';
import { getClient } from '../../services';
import { getAssociatedMonitorIds } from '../savedObjectHelper';
import { parse } from 'query-string';
import { getDataSourceQueryObj } from '../../pages/utils/helpers';

export const stateToLabel = {
  enabled: { label: 'Enabled', color: 'success' },
  disabled: { label: 'Disabled', color: 'danger' },
};

const getMonitors = async (params) => {
  const httpClient = getClient();
  const dataSourceQuery = getDataSourceQueryObj();
  if(dataSourceQuery && dataSourceQuery.query) {
    params.dataSourceId = dataSourceQuery.query.dataSourceId;
  }
  const monitorResponse = await httpClient.get('../api/alerting/monitors', { query: params });
  if (monitorResponse.ok) {
    return _.get(monitorResponse, 'monitors', []);
  } else {
    console.log('error retrieving monitors:', monitorResponse);
    return [];
  }
}

const parseMonitor = (monitor) => {
  const state = monitor.monitor.enabled ? 'enabled' : 'disabled';
  const latestAlert = monitor.lastNotificationTime === "--" ? undefined : monitor.lastNotificationTime;
  return {
    name: monitor.name,
    state: state,
    date: latestAlert, // this is the last alert time
    id: monitor.id,
    type: monitor.monitor.monitor_type,
    indexes: monitor.monitor.inputs[0].search.indices,
    triggers: [{ name: 'example trigger' }],
    activeAlerts: monitor.active,
  };
}

export const retrieveAssociatedMonitors = (visId, setAssociatedMonitors) => {
  useEffect(() => {
    const getAssociatedMonitors = async () => {

      try {
        const alertingMonitorIds = await getAssociatedMonitorIds(visId);

        if (alertingMonitorIds.length > 0) {
          const params = {
            from: 0,
            size: 10000,
            search: '',
            sortDirection: 'desc',
            sortField: name,
            state: 'all',
            monitorIds: alertingMonitorIds
          };
          const mons = await getMonitors(params);
          const parsedMonitors: any[] = [];
          for (let mon of mons ) {
            parsedMonitors.push(parseMonitor(mon));
          }
          setAssociatedMonitors(parsedMonitors);
        }
      } catch (err) {
        console.error(err);
      }
    };

    getAssociatedMonitors();
  }, []);
};

export const retrieveUnassociatedMonitors = (visId, setUnassociatedMonitors) => {
  useEffect(() => {
    const getUnassociatedMonitors = async () => {

      try {
        const associatedMonitorIds = await getAssociatedMonitorIds(visId);
        const params = {
          from: 0,
          size: 10000,
          search: '',
          sortDirection: 'desc',
          sortField: name,
          state: 'all'
        };
        const mons = await getMonitors(params);
        const parsedMonitors: any[] = [];
        for (let mon of mons ) {
          if (!associatedMonitorIds.includes(mon.id))
            parsedMonitors.push(parseMonitor(mon));
        }
        setUnassociatedMonitors(parsedMonitors);
      } catch (err) {
        console.error(err);
      }
    };

    getUnassociatedMonitors();
  }, []);
}
