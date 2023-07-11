/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { notificationServiceMock, uiSettingsServiceMock } from '../../../../src/core/public/mocks';
import { setSavedAugmentVisLoader, setUISettings, setNotifications } from '../services';
import {
  createSavedAugmentVisLoader,
  setUISettings as setVisAugUISettings,
  SavedObjectOpenSearchDashboardsServicesWithAugmentVis,
  VisLayerExpressionFn,
  VisLayerTypes,
} from '../../../../src/plugins/vis_augmenter/public';
import {
  createSavedObjectAssociation,
  deleteAlertingAugmentVisSavedObj,
  getAlertingAugmentVisSavedObjs,
  getAssociatedMonitorIds, getCountOfAssociatedObjects, validateAssociationIsAllow,
} from './savedObjectHelper';
import {
  createMockSavedObject,
  getMockAugmentVisSavedObjectClient,
  setAugLoader,
  setUIAugSettings,
} from './savedObjectHelper.mock';

describe('savedObjectHelper', function () {
  const uiSettingsMock = uiSettingsServiceMock.createStartContract();
  const notificationsMock = notificationServiceMock.createSetupContract();
  setUISettings(uiSettingsMock);
  setNotifications(notificationsMock);
  setVisAugUISettings(uiSettingsMock);
  setAugLoader();

  describe('validateAssociationIsAllow()', function () {
    setUIAugSettings(uiSettingsMock);
    it('validation is true', async () => {
      const isValid = await validateAssociationIsAllow('visId');
      expect(isValid).toStrictEqual(true);
    });
    it('validation is false due to associated is disabled', async () => {
      setUIAugSettings(uiSettingsMock, false);
      const isValid = await validateAssociationIsAllow('visId');
      expect(isValid).toStrictEqual(false);
    });
    it('validation is false due to max associated objects to be 0', async () => {
      setUIAugSettings(uiSettingsMock, true, 0);
      const isValid = await validateAssociationIsAllow('visId');
      expect(isValid).toStrictEqual(false);
    });
  });

  describe('getCountOfAssociatedObjects()', function () {
    it('no associated objects should give 0 count', async () => {
      const associatedCount = await getCountOfAssociatedObjects('visId');
      expect(associatedCount).toStrictEqual(0);
    });
    it('set 5 associated objects', async () => {
      const validObj1 = createMockSavedObject()
      const validObj2 = createMockSavedObject()
      const validObj3 = createMockSavedObject()
      const validObj4 = createMockSavedObject()
      const validObj5 = createMockSavedObject()
      const visId = validObj1.visId;
      setAugLoader([validObj1, validObj2, validObj3, validObj4, validObj5]);
      const associatedCount = await getCountOfAssociatedObjects(visId);
      expect(associatedCount).toStrictEqual(5);
    });
  });

  describe('createSavedObjectAssociation()', function () {
    const embeddable = {
      vis: {
        id: 'visId',
        title: 'visTitle',
      }
    }
    setUIAugSettings(uiSettingsMock);
    it('createSavedObject', async () => {
      setUIAugSettings(uiSettingsMock);
      const object = await createSavedObjectAssociation('monitorId', embeddable);
      expect(object).toStrictEqual('randomId');
    });
    it('createSavedObject with augmentation disabled', async () => {
      setUIAugSettings(uiSettingsMock, false);
      try {
        await createSavedObjectAssociation('monitorId', embeddable);
      } catch (e) {
        expect(e.message).toStrictEqual('Visualization augmentation is disabled, please enable visualization:enablePluginAugmentation.');
      }
    });
    it('createSavedObject with max associated objects to be 0', async () => {
      setUIAugSettings(uiSettingsMock, true, 0);
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
    setUIAugSettings(uiSettingsMock);
    const adPluginResource = {
      type: 'ad detector',
      id: 'detectorId',
    };
    const adFn = {
      type: VisLayerTypes.PointInTimeEvents,
      name: 'overlay_anomalies',
      args: {
        detectorId: 'detectorId',
      },
    } as VisLayerExpressionFn;
    it('getSavedObject and filter non-alerting objects', async () => {
      const validObj1 = createMockSavedObject()
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
      setUIAugSettings(uiSettingsMock, false);
      const validObj1 = createMockSavedObject()
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
      setUIAugSettings(uiSettingsMock);
      const validObj1 = createMockSavedObject()
      const visId = validObj1.visId;
      setAugLoader([validObj1]);
      const receivedObject = await getAssociatedMonitorIds(visId);
      expect(receivedObject).toStrictEqual([validObj1.pluginResource.id]);
    });
    it('getAssociatedMonitorIds and vis augmenter is disabled', async () => {
      setUIAugSettings(uiSettingsMock, false)
      const validObj1 = createMockSavedObject()
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
      setUIAugSettings(uiSettingsMock);
      const validObj1 = createMockSavedObject()
      setAugLoader([validObj1]);
      await deleteAlertingAugmentVisSavedObj('visId', 'monitorId');
    });
    it('deleteAlertingAugmentVisSavedObj with no saved object', async () => {
      setUIAugSettings(uiSettingsMock);
      setAugLoader([]);
      try {
        await deleteAlertingAugmentVisSavedObj('visId', 'monitorId');
        throw new Error('Did not initially throw an error');
      } catch (e) {
        expect(e.message).toStrictEqual('Failed to retrieve the saved object that associates the visualization and the Alerting monitor.');
      }
    });
    it('deleteAlertingAugmentVisSavedObj with delete failure', async () => {
      setUIAugSettings(uiSettingsMock);
      const validObj1 = createMockSavedObject()
      const loader = createSavedAugmentVisLoader({
        savedObjectsClient: getMockAugmentVisSavedObjectClient([validObj1], 'randomId', true, true),
      } as SavedObjectOpenSearchDashboardsServicesWithAugmentVis);
      setSavedAugmentVisLoader(loader);
      try {
        await deleteAlertingAugmentVisSavedObj('visId', 'monitorId');
        throw new Error('Did not initially throw an error');
      } catch (e) {
        expect(e.message).toStrictEqual('Failed to delete the saved object that associates the visualization and the Alerting monitor. Reason:Failure to delete saved object.');
      }
    });
  });
});
