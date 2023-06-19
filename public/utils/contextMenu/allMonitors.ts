/*
* Copyright OpenSearch Contributors
* SPDX-License-Identifier: Apache-2.0
*/

import { useState, useEffect } from 'react';
import _ from 'lodash';
import { getAlertingAugmentVisSavedObjs, getAssociatedMonitorIds } from '../savedObjectHelper';
import { getClient } from '../../services';

export const useAllMonitors = (embeddable) => {
  const [allMonitors, setAllMonitors] = useState<any[] | null>();

  useEffect(() => {
    const getAllMonitors = async () => {

      try {
        const associatedMonitorIds = await getAssociatedMonitorIds(embeddable.vis.id);

        let mons;

        const httpClient = getClient();
        const params = {
          from: 0,
          size: 10000,
          search: '',
          sortDirection: 'desc',
          sortField: name,
          state: 'all'
        };
        const response = await httpClient.get('../api/alerting/monitors', { query: params });

        // const params = {
        //   query: {
        //     query: {
        //       match_all: {}
        //     },
        //   },
        // }
        // const response = await fetch('../api/alerting/monitors/_search', {
        //   method: 'post', // Default is 'get'
        //   body: JSON.stringify(params),
        //   // mode: 'cors',
        //   headers: new Headers({
        //     'Content-Type': 'application/json',
        //     'osd-xsrf': 'true'
        //   })
        // })
        //   .then(response => response.json())


        if (response.ok) {
          mons = _.get(response, 'monitors', []);

          const parsedMonitors: any[] = [];
          mons.forEach((mon, index) => {
            const state = mon.monitor.enabled ? 'enabled' : 'disabled';
            const latestAlert = mon.latestAlert === "--" ? undefined : mon.latestAlert;
            // console.log(latestAlert);
            if (!associatedMonitorIds.includes(mon.id)) {
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
            }
          });

          setAllMonitors(parsedMonitors);
        } else {
          console.log('error getting all monitors:', response);
        }
      } catch (err) {
        console.error(err);
      }
    };

    getAllMonitors();
  }, []);

  return allMonitors;
}
