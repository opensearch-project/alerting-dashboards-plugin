/*
* Copyright OpenSearch Contributors
* SPDX-License-Identifier: Apache-2.0
*/

import { useState, useEffect } from 'react';
import _ from 'lodash';
import { getSavedAugmentVisLoader, getAugmentVisSavedObjs } from '../../../../../src/plugins/vis_augmenter/public'


export const useAllMonitors = (embeddable) => {
  const [allMonitors, setAllMonitors] = useState<any[] | null>();

  useEffect(() => {
    const getAllMonitors = async () => {
      // await new Promise((resolve) => {
      //   setTimeout(resolve, 1000);
      // });

      const loader = getSavedAugmentVisLoader();
      const associatedObjects = await getAugmentVisSavedObjs(embeddable.vis.id, loader);
      const associatedMonitorIds: string[] = [];
      for (const associatedObject of associatedObjects) {
        if (associatedObject.visLayerExpressionFn.name === 'overlay_alerts')
          associatedMonitorIds.push(associatedObject.pluginResourceId)
      }

      let mons;

      try {
        const params = {
          query: {
            query: {
              match_all: {}
            },
          },
        }
        const response = await fetch('../api/alerting/monitors/_search', {
          method: 'post', // Default is 'get'
          body: JSON.stringify(params),
          // mode: 'cors',
          headers: new Headers({
            'Content-Type': 'application/json',
            'osd-xsrf': 'true'
          })
        })
          .then(response => response.json())


        if (response.ok) {
          mons = _.get(response, 'resp.hits.hits', []);
          console.log('monitors');
          console.log(mons);

          const parsedMonitors: any[] = [];
          mons.forEach((mon, index) => {
            const state = mon._source.enabled ? 'enabled' : 'disabled';
            if (!associatedMonitorIds.includes(mon._id)) {
              parsedMonitors.push({
                name: mon._source.name,
                state: state,
                date: mon._source.last_update_time, // this is the last alert time
                id: mon._id,
                type: mon._source.monitor_type,
                indexes: mon._source.inputs[0].search.indices,
                triggers: [{ name: 'example trigger' }],
                activeAlerts: index,
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