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
import { getSavedAugmentVisLoader, getUISettings, getNotifications } from '../services';
import {
  PLUGIN_AUGMENTATION_ENABLE_SETTING,
  PLUGIN_AUGMENTATION_MAX_OBJECTS_SETTING,
} from './constants';

export const validateAssociationIsAllow = async (visId, sendDangerToast = false) => {
  const uiSettings = getUISettings();
  const notifications = getNotifications();

  const isAugmentationEnabled = uiSettings.get(PLUGIN_AUGMENTATION_ENABLE_SETTING);
  if (!isAugmentationEnabled) {
    if (sendDangerToast) {
      notifications.toasts.addDanger(
        'Visualization augmentation is disabled, please enable visualization:enablePluginAugmentation.'
      );
    }
    return false;
  }

  const maxAssociatedCount = uiSettings.get(PLUGIN_AUGMENTATION_MAX_OBJECTS_SETTING);
  const currentAssociatedCount = await getCountOfAssociatedObjects(visId);
  if (maxAssociatedCount <= currentAssociatedCount) {
    if (sendDangerToast) {
      notifications.toasts.addDanger(
        `Cannot create the monitor and associate it to the visualization due to the limit of the max
            amount of associated plugin resources (${maxAssociatedCount}) with
            ${currentAssociatedCount} associated to the visualization`
      );
    }
    return false;
  } else {
    return true;
  }
};

export const getCountOfAssociatedObjects = async (visId) => {
  const loader = getSavedAugmentVisLoader();

  return await loader.findAll('', 100, [], {
      type: 'visualization',
      id: visId,
    }
  ).then(async (resp) => {
    if (resp !== undefined) {
      const savedAugmentObjects = get(resp, 'hits', []);
      return savedAugmentObjects.length;
    }
  });
};

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
      monitorId,
    },
  };
  const savedObjectToCreate: ISavedAugmentVis = {
    title: embeddable.vis.title,
    description: 'Association to Alerting monitor',
    originPlugin: 'alertingDashboards',
    pluginResource,
    visName: embeddable.vis.title,
    visId: embeddable.vis.id,
    visLayerExpressionFn: fn,
  };

  const newSavedObj = await createAugmentVisSavedObject(savedObjectToCreate, loader, uiSettings);
  return newSavedObj.save({});
};

export const getAlertingAugmentVisSavedObjs = async (
  visId: string
): Promise<ISavedAugmentVis[]> => {
  const loader = getSavedAugmentVisLoader();
  const uiSettings = getUISettings();
  const savedObjects = await getAugmentVisSavedObjs(visId, loader, uiSettings);
  return savedObjects.filter(
    (savedObject) => savedObject.visLayerExpressionFn.name === 'overlay_alerts'
  );
};

export const getAssociatedMonitorIds = async (visId: string): Promise<string[]> => {
  const savedObjects = await getAlertingAugmentVisSavedObjs(visId);
  const associatedMonitorIds: string[] = [];
  for (const associatedObject of savedObjects) {
    associatedMonitorIds.push(associatedObject.pluginResource.id);
  }
  return associatedMonitorIds;
};

export const deleteAlertingAugmentVisSavedObj = async (
  visId: string,
  monitorId: string
): Promise<void> => {
  const savedObjectLoader = getSavedAugmentVisLoader();
  await savedObjectLoader.findAll('', 100, [], {
      type: 'visualization',
      id: visId,
    }
  ).then(async (resp) => {
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
        throw new Error(
          'Failed to retrieve the saved object that associates the visualization and the Alerting monitor.'
        );
      }
      try {
        await savedObjectLoader.delete(savedObjectToUnlinkId);
      } catch (e) {
        throw new Error(
          'Failed to delete the saved object that associates the visualization and the Alerting monitor. Reason:' +
          e.message
        );
      }
    }
  });
};
