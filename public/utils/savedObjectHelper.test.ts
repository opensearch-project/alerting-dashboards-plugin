/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { cloneDeep } from 'lodash';
import {
  createSavedAugmentVisLoader,
  ISavedAugmentVis,
  SavedObjectOpenSearchDashboardsServicesWithAugmentVis,
  setUISettings as setVisAugUISettings,
  VisLayerExpressionFn,
  VisLayerTypes,
} from '../../../../src/plugins/vis_augmenter/public';
import {
  PLUGIN_AUGMENTATION_ENABLE_SETTING,
  PLUGIN_AUGMENTATION_MAX_OBJECTS_SETTING,
} from '../../../../src/plugins/vis_augmenter/common';
import { uiSettingsServiceMock } from '../../../../src/core/public/mocks';
import { setSavedAugmentVisLoader, setUISettings } from '../services';
import {
  createSavedObjectAssociation,
  deleteAlertingAugmentVisSavedObj,
  getAlertingAugmentVisSavedObjs,
  getAssociatedMonitorIds,
} from './savedObjectHelper';

const getMockAugmentVisSavedObjectClient = (
  augmentVisSavedObjs: ISavedAugmentVis[],
  savedObjectId: string = 'randomId',
  keepReferences: boolean = true
): any => {
  const savedObjs = (augmentVisSavedObjs = cloneDeep(augmentVisSavedObjs));

  const client = {
    find: jest.fn(() =>
      Promise.resolve({
        total: savedObjs.length,
        savedObjects: savedObjs.map((savedObj) => {
          console.log(savedObj);
          const objVisId = savedObj.visId;
          const objId = savedObj.id;
          console.log(objVisId);
          console.log(objId);
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
    delete: jest.fn((opensearchType, savedObjectId) =>
      Promise.resolve()
    ),
  } as any;
  return client;
};

const createMockSavedObject = (
  pluginResource: any,
  visLayerExpressionFn: any,
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

const setUIAugSettings = (isEnabled = true, maxCount = 10) => {
  uiSettingsMock.get.mockImplementation((key: string) => {
    if (key === PLUGIN_AUGMENTATION_MAX_OBJECTS_SETTING)
      return maxCount;
    else if (key === PLUGIN_AUGMENTATION_ENABLE_SETTING)
      return isEnabled
    else return false
  });
}

const setAugLoader = (augmentSavedVisObjects = []) => {
  const loader = createSavedAugmentVisLoader({
    savedObjectsClient: getMockAugmentVisSavedObjectClient(augmentSavedVisObjects),
  } as SavedObjectOpenSearchDashboardsServicesWithAugmentVis);
  setSavedAugmentVisLoader(loader);
}

const uiSettingsMock = uiSettingsServiceMock.createStartContract();
setUISettings(uiSettingsMock);
setVisAugUISettings(uiSettingsMock);

const fn = {
  type: VisLayerTypes.PointInTimeEvents,
  name: 'overlay_alerts',
  args: {
    monitorId: 'monitorId',
  },
} as VisLayerExpressionFn;
const adFn = {
  type: VisLayerTypes.PointInTimeEvents,
  name: 'overlay_anomalies',
  args: {
    detectorId: 'detectorId',
  },
} as VisLayerExpressionFn;
let pluginResource = {
  type: 'alerting monitor',
  id: 'monitorId',
};

describe('savedObjectHelper', function () {
  setAugLoader();
  const embeddable = {
    vis: {
      id: 'visId',
      title: 'visTitle',
    }
  }
  describe('createSavedObjectAssociation()', function () {
    setUIAugSettings();
    it('createSavedObject', async () => {
      const object = await createSavedObjectAssociation('monitorId', embeddable);
      expect(object).toStrictEqual('randomId');
    });
    it('createSavedObject with augmentation disabled', async () => {
      setUIAugSettings(false);
      try {
        await createSavedObjectAssociation('monitorId', embeddable);
      } catch (e) {
        expect(e.message).toStrictEqual('Visualization augmentation is disabled, please enable visualization:enablePluginAugmentation.');
      }
    });
    it('createSavedObject with max associated objects to be 0', async () => {
      setUIAugSettings(true, 0);
      try {
        await createSavedObjectAssociation('monitorId', embeddable);
      } catch (e) {
        expect(e.message).toStrictEqual('Cannot associate the plugin resource to the visualization due to the limit of the max\n' +
          '          amount of associated plugin resources (0) with\n' +
          '          0 associated to the visualization');
      }
    });
  });

  describe('getAlertingAugmentVisSavedObjs', function () {
    setUIAugSettings();
    const adPluginResource = {
      type: 'ad detector',
      id: 'detectorId',
    };
    it('getSavedObject and filter non-alerting objects', async () => {
      const validObj1 = createMockSavedObject(pluginResource, fn)
      const adObj1 = createMockSavedObject(adPluginResource, adFn, 'anomalyDetectionDashboards')
      const visId = validObj1.visId;
      setAugLoader([validObj1, adObj1]);
      const receivedObject = await getAlertingAugmentVisSavedObjs(visId);
      const expectedObject = {...validObj1, visReference: {
          id: visId,
          name: 'visName',
          type: 'visualization'
        }};
      expect(receivedObject).toStrictEqual([expectedObject]);
    });
    it('getSavedObject and vis augmenter is disabled', async () => {
      setUIAugSettings(false);
      const validObj1 = createMockSavedObject(pluginResource, fn)
      const visId = validObj1.visId;
      setAugLoader([validObj1]);
      try {
        await getAlertingAugmentVisSavedObjs(visId);
      } catch (e) {
        expect(e.message).toStrictEqual('Visualization augmentation is disabled, please enable visualization:enablePluginAugmentation.');
      }
    });
  });

  describe('getAssociatedMonitorIds', function () {
    it('getAssociatedMonitorIds', async () => {
      setUIAugSettings();
      const validObj1 = createMockSavedObject(pluginResource, fn)
      const visId = validObj1.visId;
      setAugLoader([validObj1]);
      const receivedObject = await getAssociatedMonitorIds(visId);
      expect(receivedObject).toStrictEqual([validObj1.pluginResource.id]);
    });
    it('getAssociatedMonitorIds and vis augmenter is disabled', async () => {
      setUIAugSettings(false)
      const validObj1 = createMockSavedObject(pluginResource, fn)
      const visId = validObj1.visId;
      setAugLoader([validObj1]);
      try {
        await getAssociatedMonitorIds(visId);
      } catch (e) {
        expect(e.message).toStrictEqual('Visualization augmentation is disabled, please enable visualization:enablePluginAugmentation.');
      }
    });
  });

  describe('deleteAlertingAugmentVisSavedObj', function () {
    it('deleteAlertingAugmentVisSavedObj', async () => {
      setUIAugSettings();
      const validObj1 = createMockSavedObject(pluginResource, fn)
      setAugLoader([validObj1]);
      await deleteAlertingAugmentVisSavedObj('visId', 'monitorId');
    });
  });
});
