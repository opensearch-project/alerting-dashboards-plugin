/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { get } from 'lodash';
import {
  createAugmentVisSavedObject,
  getAugmentVisSavedObjs,
  ISavedAugmentVis,
  ISavedPluginResource,
  VisLayerExpressionFn,
  VisLayerTypes,
} from '../../../../src/plugins/vis_augmenter/public';
import { getSavedAugmentVisLoader, getUISettings } from '../services';

export const createSavedObjectAssociation = async (monitorId, embeddable) => {
  const loader = getSavedAugmentVisLoader();
  const uiSettings = getUISettings();

  const pluginResource: ISavedPluginResource = {
    type: 'alerting monitor',
    id: monitorId,
  };

  // create the fields needed for the saved obj
  const fn: VisLayerExpressionFn = {
    type: VisLayerTypes.PointInTimeEvents,
    name: 'overlay_alerts',
    args: {
      monitorId: monitorId,
    },
  };
  const savedObjectToCreate: ISavedAugmentVis = {
    title: embeddable.vis.title,
    description: 'Association to Alerting monitor',
    originPlugin: 'alertingDashboards',
    pluginResource: pluginResource,
    visName: embeddable.vis.title,
    visId: embeddable.vis.id,
    visLayerExpressionFn: fn,
  };

  let newSavedObj = await createAugmentVisSavedObject(savedObjectToCreate, loader, uiSettings);
  return newSavedObj.save({});
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
    associatedMonitorIds.push(associatedObject.pluginResource.id)
  }
  return associatedMonitorIds;
};

export const deleteAlertingAugmentVisSavedObj = async (
  visId: string,
  monitorId: string,
): Promise<void> => {
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
      if (savedObjectToUnlinkId === '') {
        throw new Error('Failed to retrieve the saved object that associates the visualization and the Alerting monitor.');
      }
      try {
        await savedObjectLoader.delete(savedObjectToUnlinkId);
      } catch (e) {
        throw new Error('Failed to delete the saved object that associates the visualization and the Alerting monitor. Reason:' + e.message);
      }
    }
  });
};
