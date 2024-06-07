/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { backendErrorNotification, deleteMonitor } from './helpers';
import coreMock from '../../test/mocks/CoreMock';
import { httpClientMock } from '../../test/mocks';

describe('backendErrorNotification', () => {
  test('can generate error notifications as desired', () => {
    const actionName = 'create';
    const objectName = 'monitor';
    const response = { ok: false, resp: 'test' };
    const toastProps = {
      text: 'test',
      title: 'Failed to create the monitor',
      toastLifeTimeMs: 20000,
    };
    backendErrorNotification(coreMock.notifications, actionName, objectName, response.resp);
    expect(coreMock.notifications.toasts.addDanger).toHaveBeenCalledWith(toastProps);
  });
});

describe('deleteMonitor', () => {
  test('deleteMonitor calls delete', async () => {
    const mockDataSource = {};
    httpClientMock.delete = jest
      .fn()
      .mockResolvedValueOnce({ ok: true })
      .mockRejectedValueOnce(new Error('random delete error'));
    const mockMonitor = {
      id: 'delete_id',
      version: 15,
      item_type: 'monitor',
    };
    const response = await deleteMonitor(
      mockMonitor,
      httpClientMock,
      coreMock.notifications,
      mockDataSource
    );

    expect(httpClientMock.delete).toHaveBeenCalled();
    expect(httpClientMock.delete).toHaveBeenCalledWith(`../api/alerting/monitors/delete_id`, {
      query: { version: 15 },
    });
    expect(response).toEqual({ ok: true });
  });
});
