import { useState, useEffect } from 'react';
import _ from 'lodash';
import { getAugmentVisSavedObjs, SavedObjectLoaderAugmentVis, ISavedAugmentVis } from '../../../../../src/plugins/vis_augmenter/public'
import { getSavedAugmentVisLoader, getUISettings } from '../../services';
import { getAlertingAugmentVisSavedObjs } from '../savedObjectHelper';

export const stateToLabel = {
  enabled: { label: 'Enabled', color: 'success' },
  disabled: { label: 'Disabled', color: 'danger' },
};

export const useMonitors = (embeddable) => {
  const [monitors, setMonitors] = useState<any[] | null>();

  useEffect(() => {
    const getMonitors = async () => {

      try {
        const associatedObjects = await getAlertingAugmentVisSavedObjs(embeddable.vis.id);
        const monitorIds: string[] = [];
        for (const associatedObject of associatedObjects) {
          monitorIds.push(associatedObject.pluginResource.id);
        }

        let mons

        const params = {
          query: {
            query: {
              ids: {
                values: monitorIds,
              },
            },
          },
        }
        const response = await fetch('../api/alerting/monitors/_search', {
          method: 'post', // Default is 'get'
          body: JSON.stringify(params),
          headers: new Headers({
            'Content-Type': 'application/json',
            'osd-xsrf': 'true'
          })
        })
          .then(response => response.json())


        if (response.ok) {
          mons = _.get(response, 'resp.hits.hits', []);

          const parsedMonitors: any[] = [];
          mons.forEach((mon, index) => {
            const state = mon._source.enabled ? 'enabled' : 'disabled';
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
          });

          setMonitors(parsedMonitors);
        } else {
          console.log('error getting monitors:', response);
        }
      } catch (err) {
        console.error(err);
      }
    };

    getMonitors();
  }, []);

  return monitors;
};
