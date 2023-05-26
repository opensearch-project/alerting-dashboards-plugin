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
      const loader: SavedObjectLoaderAugmentVis = getSavedAugmentVisLoader();
      console.log(loader);
      const uiSettings = getUISettings();

      try {
        const associatedObjects = await getAlertingAugmentVisSavedObjs(embeddable.vis.id);
        // const associatedObjects = await getAugmentVisSavedObjs(embeddable.vis.id, loader, uiSettings);
        const monitorIds: string[] = [];
        for (const associatedObject of associatedObjects) {
          monitorIds.push(associatedObject.pluginResource.id);
        }

        // const monitorIds: string[] = [];
        //
        // loader.findAll().then((resp: any) => {
        //   if (resp != undefined) {
        //     const savedAugmentObjects: ISavedAugmentVis[] = _.get(
        //       resp,
        //       'hits',
        //       []
        //     );
        //
        //     // Filter all savedAugmentObjects that aren't linked to the specific visualization
        //     const savedAugmentForThisVisualization: ISavedAugmentVis[] =
        //       savedAugmentObjects.filter(
        //         (savedObj) => _.get(savedObj, 'visId', '') === embeddable.vis.id
        //       );
        //
        //     console.log('objects');
        //     console.log(embeddable.vis.id);
        //     console.log(savedAugmentObjects);
        //     console.log(savedAugmentForThisVisualization);
        //
        //     for (const associatedObject of savedAugmentForThisVisualization) {
        //       if (associatedObject.originPlugin === 'alertingDashboards') {
        //         console.log(associatedObject.pluginResource.id);
        //         console.log(associatedObject);
        //         monitorIds.push(associatedObject.pluginResource.id);
        //       }
        //     }


            // monitorIds = new Set(
            //   savedAugmentForThisVisualization.map((savedObject) =>
            //     savedObject.pluginResource.id
            //   )
            // );
            // for (const associatedObject of savedAugmentObjectsArr) {
            //   if (associatedObject.visLayerExpressionFn.name === 'overlay_alerts')
            //     monitorIds.push(associatedObject.pluginResource.id);
            // }
            // const curSelectedDetectors = getAssociatedDetectors(
            //   Object.values(allDetectors),
            //   savedAugmentObjectsArr
            // );
            // setSelectedDetectors(curSelectedDetectors);
            // setIsLoadingFinalDetectors(false);
        //   }
        // });

        let mons

        console.log('monitorIDs');
        console.log(monitorIds);

      // try {
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
          // mode: 'cors',
          headers: new Headers({
            'Content-Type': 'application/json',
            'osd-xsrf': 'true'
          })
        })
          .then(response => response.json())


        if (response.ok) {
          console.log('response');
          console.log(response);
          mons = _.get(response, 'resp.hits.hits', []);
          console.log('monitors1');
          console.log(mons);

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
          console.log(parsedMonitors);

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
