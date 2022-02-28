/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { backendErrorNotification } from './helpers';
import coreMock from '../../test/mocks/CoreMock';

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
