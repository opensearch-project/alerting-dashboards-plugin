import { useState, useEffect } from 'react';
import _ from 'lodash';
import { getAugmentVisSavedObjs, SavedObjectLoaderAugmentVis, ISavedAugmentVis } from '../../../../../src/plugins/vis_augmenter/public'
import { getSavedAugmentVisLoader, getUISettings, getClient } from '../../services';
import { getAssociatedMonitorIds } from '../savedObjectHelper';

export const stateToLabel = {
  enabled: { label: 'Enabled', color: 'success' },
  disabled: { label: 'Disabled', color: 'danger' },
};

export const useMonitors = (embeddable) => {
  const [monitors, setMonitors] = useState<any[] | null>();

  useEffect(() => {
    const getMonitors = async () => {

      try {
        const alertingMonitorIds = await getAssociatedMonitorIds(embeddable.vis.id);
        console.log('monitorIds2');
        console.log(alertingMonitorIds);

        let mons

        const httpClient = getClient();
        const params = {
          from: 0,
          size: 10000,
          search: '',
          sortDirection: 'desc',
          sortField: name,
          state: 'all',
          monitorIds: alertingMonitorIds
        };
        const monitorResponse = await httpClient.get('../api/alerting/monitors', { query: params });

        if (monitorResponse.ok) {
          mons = _.get(monitorResponse, 'monitors', []);

          const parsedMonitors: any[] = [];

          mons.forEach((mon, index) => {

            const state = mon.monitor.enabled ? 'enabled' : 'disabled';
            const latestAlert = mon.latestAlert === "--" ? undefined : mon.latestAlert;
            // console.log('latestAlert');
            // console.log(latestAlert);
            parsedMonitors.push({
              name: mon.name,
              state: state,
              date: latestAlert, // this is the last alert time
              id: mon.id,
              type: mon.monitor.monitor_type,
              indexes: mon.monitor.inputs[0].search.indices,
              triggers: [{ name: 'example trigger' }],
              activeAlerts: mon.active,
            })
          });

          setMonitors(parsedMonitors);
        } else {
          console.log('error getting monitors:', monitorResponse);
        }
      } catch (err) {
        console.error(err);
      }
    };

    getMonitors();
  }, []);

  return monitors;
};
