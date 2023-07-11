/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { cloneDeep } from 'lodash';
import {
  createSavedAugmentVisLoader,
  ISavedAugmentVis,
  SavedObjectOpenSearchDashboardsServicesWithAugmentVis,
  VisLayerExpressionFn,
  VisLayerTypes,
} from '../../../../src/plugins/vis_augmenter/public';
import {
  PLUGIN_AUGMENTATION_ENABLE_SETTING,
  PLUGIN_AUGMENTATION_MAX_OBJECTS_SETTING,
} from '../../../../src/plugins/vis_augmenter/common';
import { setSavedAugmentVisLoader } from '../services';

export const getMockAugmentVisSavedObjectClient = (
  augmentVisSavedObjs: ISavedAugmentVis[],
  savedObjectId: string = 'randomId',
  keepReferences: boolean = true,
  throwDeleteError: boolean = false
): any => {
  const savedObjs = cloneDeep(augmentVisSavedObjs);

  const client = {
    find: jest.fn(() =>
      Promise.resolve({
        total: savedObjs.length,
        savedObjects: savedObjs.map((savedObj) => {
          const objVisId = savedObj.visId;
          const objId = savedObj.id;
          delete savedObj.visId;
          delete savedObj.id;
          return {
            id: objId,
            attributes: savedObj as Record<string, any>,
            references: keepReferences
              ? [
                {
                  name: savedObj.visName,
                  type: 'visualization',
                  id: objVisId,
                },
              ]
              : [],
          };
        }),
      })
    ),
    create: jest.fn((opensearchType, attributes, creationOptions) =>
      Promise.resolve({
        id: savedObjectId,
      })
    ),
    delete: jest.fn((savedObjectId) => {
      if (throwDeleteError) {
        throw new Error('Failure to delete saved object.')
      }
      return Promise.resolve()
    }),
  } as any;
  return client;
};

export const fn = {
  type: VisLayerTypes.PointInTimeEvents,
  name: 'overlay_alerts',
  args: {
    monitorId: 'monitorId',
  },
} as VisLayerExpressionFn;

export const alertingPluginResource = {
  type: 'alerting monitor',
  id: 'monitorId',
};

export const createMockSavedObject = (
  pluginResource: any = alertingPluginResource,
  visLayerExpressionFn: any = fn,
  originPlugin: string = 'alertingDashboards',
  savedObjectId: string = 'savedObjectId',
  visId: string = 'visId',
): ISavedAugmentVis => {

  return {
    id: savedObjectId,
    title: 'visTitle',
    description: 'Association to Alerting monitor',
    originPlugin: originPlugin,
    pluginResource: pluginResource,
    visName: 'visName',
    visId: visId,
    visLayerExpressionFn: visLayerExpressionFn,
  };
}

export const setUIAugSettings = (uiSettingsMock, isEnabled = true, maxCount = 10) => {
  uiSettingsMock.get.mockImplementation((key: string) => {
    if (key === PLUGIN_AUGMENTATION_MAX_OBJECTS_SETTING)
      return maxCount;
    else if (key === PLUGIN_AUGMENTATION_ENABLE_SETTING)
      return isEnabled
    else return false
  });
}

export const setAugLoader = (augmentSavedVisObjects = []) => {
  const loader = createSavedAugmentVisLoader({
    savedObjectsClient: getMockAugmentVisSavedObjectClient(augmentSavedVisObjects),
  } as SavedObjectOpenSearchDashboardsServicesWithAugmentVis);
  setSavedAugmentVisLoader(loader);
}
