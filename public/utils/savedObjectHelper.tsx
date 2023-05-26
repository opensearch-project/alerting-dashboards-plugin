/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { get } from 'lodash';
import { createAugmentVisSavedObject, VisLayerTypes, VisLayerExpressionFn, ISavedAugmentVis, ISavedPluginResource, SavedAugmentVisLoader, getAugmentVisSavedObjs } from '../../../../src/plugins/vis_augmenter/public';
import { getSavedAugmentVisLoader, getUISettings } from '../services';

export const createSavedObjectAssociation = async (monitorId, visId) => {
  const loader = getSavedAugmentVisLoader();
  const uiSettings = getUISettings();

  const pluginResource: ISavedPluginResource = {
    type: 'alerting monitor',
    id: monitorId,
  };

  // create the fields needed for the saved obj
  const fn: VisLayerExpressionFn = {
    type: 'PointInTimeEvents',
    name: 'overlay_alerts',
    args: {
      monitorId: monitorId,
    },
  };
  const savedObjectToCreate: ISavedAugmentVis = {
    title: 'Vis name title',
    description: 'Association to Alerting monitor',
    originPlugin: 'alertingDashboards',
    pluginResource: pluginResource,
    visName: 'Vis name title',
    visId: visId,
    visLayerExpressionFn: fn,
  };

  // helper fn to create the saved object given an object implementing the
  // ISavedFeatureAnywhere interface.
  // Note that we actually don't have a hard dep on the feature anywhere loader yet,
  // since we have a dependency on visualizations which has a dependency on the
  // feature anywhere loader. But we will probably need later when
  // using the loader's search functionalities within the UI components.

  // TODO: handle failures if it fails to create
  let newSavedObj = await createAugmentVisSavedObject(savedObjectToCreate, loader, uiSettings);

  // calling save() on the newly-created saved object to actually save it to the system index
  const response = await newSavedObj.save({});

  return response;
};

export const getAlertingAugmentVisSavedObjs = async (
  visId: string,
): Promise<ISavedAugmentVis[]> => {
  const loader = getSavedAugmentVisLoader();
  const uiSettings = getUISettings();
  const savedObjects = await getAugmentVisSavedObjs(visId, loader, uiSettings);
  return savedObjects.filter((savedObject) => savedObject.visLayerExpressionFn.name === 'overlay_alerts');
};

export const getAssociatedMonitorIds = async (
  visId: string,
): Promise<String[]> => {
  const savedObjects = await getAlertingAugmentVisSavedObjs(visId);
  const associatedMonitorIds: string[] = [];
  for (const associatedObject of savedObjects) {
    associatedMonitorIds.push(associatedObject.pluginResourceId)
  }
  return associatedMonitorIds;
};

export const deleteAlertingAugmentVisSavedObj = async (
  visId: string,
  monitorId: string,
): Promise<ISavedAugmentVis[]> => {
  const savedObjectLoader = getSavedAugmentVisLoader();
  await savedObjectLoader.findAll().then(async (resp) => {
    if (resp !== undefined) {
      const savedAugmentObjects = get(resp, 'hits', []);
      // gets all the saved object for this visualization
      const savedAugmentForThisVisualization = savedAugmentObjects.filter(
        (savedObj) => get(savedObj, 'visId', '') === visId
      );

      // find saved Augment object matching detector we want to unlink
      // There should only be one detector and vis pairing
      const savedAugmentToUnlink = savedAugmentForThisVisualization.find(
        (savedObject) => get(savedObject, 'pluginResource.id', '') === monitorId
      );
      const savedObjectToUnlinkId = get(savedAugmentToUnlink, 'id', '');
      await savedObjectLoader.delete(savedObjectToUnlinkId);
    }
  });
};
//
// export const getAllAugmentVisSavedObjs = async (
//   loader: SavedAugmentVisLoader | undefined
// ): Promise<ISavedAugmentVis[]> => {
//   try {
//     const resp = await loader?.findAll();
//     return (get(resp, 'hits', []) as any[]) as ISavedAugmentVis[];
//   } catch (e) {
//     return [] as ISavedAugmentVis[];
//   }
// };

// export const createAlertingAugmentVisSavedObject = async (AugmentVis: ISavedAugmentVis): Promise<any> => {
//   const loader = getSavedAugmentVisLoader();
//   const uiSettings = getUISettings();
//
//   return await createSavedObjectAssociation(selectedMonitorId, embeddable.vis.id);
// const isAugmentationEnabled = config.get(PLUGIN_AUGMENTATION_ENABLE_SETTING);
// if (!isAugmentationEnabled) {
//   throw new Error(
//     'Visualization augmentation is disabled, please enable visualization:enablePluginAugmentation.'
//   );
// }
// const maxAssociatedCount = config.get(PLUGIN_AUGMENTATION_MAX_OBJECTS_SETTING);

// await loader.findAll().then(async (resp) => {
//   if (resp !== undefined) {
//     const savedAugmentObjects = get(resp, 'hits', []);
//     // gets all the saved object for this visualization
//     const savedObjectsForThisVisualization = savedAugmentObjects.filter(
//       (savedObj) => get(savedObj, 'visId', '') === AugmentVis.visId
//     );
//
//     if (maxAssociatedCount <= savedObjectsForThisVisualization.length) {
//       throw new Error(
//         `Cannot associate the plugin resource to the visualization due to the limit of the max
//         amount of associated plugin resources (${maxAssociatedCount}) with
//         ${savedObjectsForThisVisualization.length} associated to the visualization`
//       );
//     }
//   }
// });

//   return await loader.get((AugmentVis as any) as Record<string, unknown>);
// };
