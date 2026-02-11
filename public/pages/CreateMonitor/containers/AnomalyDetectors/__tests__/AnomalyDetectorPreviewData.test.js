/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react';
import {
  notificationServiceMock,
  httpServiceMock,
} from '../../../../../../../../src/core/public/mocks';
import { AnomalyDetectorData } from '../AnomalyDetectorData';
import { httpClientMock } from '../../../../../../test/mocks';
import { CoreContext } from '../../../../../utils/CoreContext';
import { setClient, setNotifications } from '../../../../../services';

httpClientMock.get.mockResolvedValue({
  ok: true,
  response: { anomalyResult: { anomalies: [], featureData: [] }, detector: {} },
});

describe('AnomalyDetectorData', () => {
  const notifications = notificationServiceMock.createStartContract();
  setNotifications(notifications);
  const httpClient = httpServiceMock.createStartContract();
  setClient(httpClient);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('calls render function on mount', async () => {
    const mockRender = jest.fn().mockImplementation(() => <div>Rendered</div>);

    render(
      <CoreContext.Provider value={{ http: httpClientMock }}>
        <AnomalyDetectorData detectorId="randomId" render={mockRender} />
      </CoreContext.Provider>
    );

    await waitFor(
      () => {
        expect(mockRender).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );
  });

  test('calls render with anomalyResult', async () => {
    const mockRender = jest.fn().mockImplementation(() => <div>Rendered</div>);

    render(
      <CoreContext.Provider value={{ http: httpClientMock }}>
        <AnomalyDetectorData detectorId="randomId" render={mockRender} />
      </CoreContext.Provider>
    );

    await waitFor(
      () => {
        expect(mockRender).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );

    expect(mockRender).toHaveBeenCalledWith(
      expect.objectContaining({
        anomalyResult: expect.any(Object),
      })
    );
  });
});
