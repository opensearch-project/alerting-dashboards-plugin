/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getAlerts, getMonitorName, convertAlertsToLayer } from './helpers';
import { VisLayerTypes } from '../../../../src/plugins/vis_augmenter/public';

import { httpClientMock } from '../../test/mocks';
import { setClient } from '../services';

describe('helpers', function () {
  setClient(httpClientMock);
  const alert1 = {
    id: 'WZ3QSYgB9c6A9c_8qpzW',
    monitor_id: 'VJ3PSYgB9c6A9c_8wZwx',
    start_time: 1684865592014,
    end_time: 1684867151580,
  };
  const alert2 = {
    id: 'WZ3QSYgB9c6A9c_8qpzQ',
    monitor_id: 'VJ3PSYgB9c6A9c_8wZwx',
    start_time: 1884865599014,
    end_time: 1884865599019,
  };
  describe('getAlerts()', function () {
    it('Got an alert', async () => {
      httpClientMock.get.mockResolvedValue({ ok: true, alerts: [alert1] });
      const receivedAlerts = await getAlerts('WZ3QSYgB9c6A9c_8qpzW', 1684865592000, 1684867151600);
      expect(receivedAlerts).toStrictEqual([alert1]);
    });
    it('Filter alert based on time and monitor id', async () => {
      httpClientMock.get.mockResolvedValue({ ok: true, alerts: [alert1, alert2] });
      const receivedAlerts = await getAlerts('WZ3QSYgB9c6A9c_8qpzW', 1684865592000, 1684867151600);
      expect(receivedAlerts).toStrictEqual([alert1]);
    });
    it('Empty alerts', async () => {
      httpClientMock.get.mockResolvedValue({ ok: true, alerts: [] });
      const receivedAlerts = await getAlerts('WZ3QSYgB9c6A9c_8qpzW', 1684865592000, 1684867151600);
      expect(receivedAlerts).toStrictEqual([]);
    });
    it('Failed response', async () => {
      httpClientMock.get.mockResolvedValue({ ok: false });
      const receivedAlerts = await getAlerts('WZ3QSYgB9c6A9c_8qpzW', 1684865592000, 1684867151600);
      expect(receivedAlerts).toStrictEqual('');
    });
  });

  describe('getMonitorName()', function () {
    it('Got monitor name', async () => {
      const monitorName = 'monitorName';
      httpClientMock.get.mockResolvedValue({ ok: true, resp: { name: monitorName } });
      expect(await getMonitorName('monitorId')).toBe(monitorName);
    });
    it('Monitor not found', async () => {
      httpClientMock.get.mockResolvedValue({
        ok: false,
        resp: '[alerting_exception] Monitor not found.',
      });
      expect(await getMonitorName('monitorId')).toBe('RESOURCE_DELETED');
    });
    it('Security permissions exception due to RBAC', async () => {
      httpClientMock.get.mockResolvedValue({
        ok: false,
        resp: 'Do not have permissions to resource',
      });
      expect(await getMonitorName('monitorId')).toBe('FETCH_FAILURE');
    });
    it('Security permissions exception due to cluster permission issue', async () => {
      httpClientMock.get.mockResolvedValue({
        ok: false,
        resp: '[security_exception] Has permission problem',
      });
      expect(await getMonitorName('monitorId')).toBe('FETCH_FAILURE');
    });
    it('Unknown error', async () => {
      httpClientMock.get.mockResolvedValue({ ok: false, resp: 'Unknown error' });
      expect(await getMonitorName('monitorId')).toBe('error loading monitor');
    });
  });

  describe('convertAlertsToLayer()', function () {
    it('Got monitor name', async () => {
      const monitorName = 'monitorName';
      const monitorId = alert1.monitor_id;
      const layer = {
        originPlugin: 'Alerting',
        events,
        pluginResource: {
          type: 'Alerting Monitors',
          id: monitorId,
          name: monitorName,
          urlPath: 'alerting#/monitors/' + monitorId,
        },
        type: VisLayerTypes.PointInTimeEvents,
      };
      httpClientMock.get.mockResolvedValue({ ok: true, resp: { name: monitorName } });
      expect(await convertAlertsToLayer([alert1, alert2], monitorId, monitorName)).toBe(
        monitorName
      );
    });
    // it('Monitor not found', async () => {
    //   httpClientMock.get.mockResolvedValue({ ok: false, resp: '[alerting_exception] Monitor not found.'});
    //   expect(await getMonitorName('monitorId')).toBe('RESOURCE_DELETED');
    // });
    // it('Security permissions exception due to RBAC', async () => {
    //   httpClientMock.get.mockResolvedValue({ ok: false, resp: 'Do not have permissions to resource'});
    //   expect(await getMonitorName('monitorId')).toBe('FETCH_FAILURE');
    // });
    // it('Security permissions exception due to cluster permission issue', async () => {
    //   httpClientMock.get.mockResolvedValue({ ok: false, resp: '[security_exception] Has permission problem'});
    //   expect(await getMonitorName('monitorId')).toBe('FETCH_FAILURE');
    // });
    // it('Unknown error', async () => {
    //   httpClientMock.get.mockResolvedValue({ ok: false, resp: 'Unknown error'});
    //   expect(await getMonitorName('monitorId')).toBe('error loading monitor');
    // });
  });

  // describe('convertAlertsToLayer()', function () {
  //   it('check all legend positions', function () {
  //     const baseConfig = {
  //       view: {
  //         stroke: null,
  //       },
  //       concat: {
  //         spacing: 0,
  //       },
  //       legend: {
  //         orient: null,
  //       },
  //       kibana: {
  //         hideWarnings: true,
  //       },
  //     };
  //     const positions = ['top', 'right', 'left', 'bottom'];
  //     positions.forEach((position) => {
  //       const visParams = { legendPosition: position };
  //       baseConfig.legend.orient = position;
  //       expect(setupConfig(visParams)).toStrictEqual(baseConfig);
  //     });
  //   });
  // });
});
