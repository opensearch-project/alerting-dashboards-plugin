/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { mount } from 'enzyme';
import { AnomalyDetectorData } from '../AnomalyDetectorData';
import { httpClientMock } from '../../../../../../test/mocks';
import { CoreContext } from '../../../../../utils/CoreContext';

httpClientMock.get.mockResolvedValue({
  ok: true,
  response: { anomalyResult: { anomalies: [], featureData: [] }, detector: {} },
});

const mockedRender = jest.fn().mockImplementation(() => null);
function getMountWrapper() {
  return mount(
    <CoreContext.Provider value={{ http: httpClientMock }}>
      <AnomalyDetectorData detectorId="randomId" render={mockedRender} />
    </CoreContext.Provider>
  );
}

describe('AnomalyDetectorData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test('calls preview api call on mount', () => {
    const getPreviewData = jest.spyOn(AnomalyDetectorData.prototype, 'getPreviewData');
    getMountWrapper();
    expect(getPreviewData).toHaveBeenCalled();
    expect(getPreviewData).toHaveBeenCalledTimes(1);
  });
  test('calls render with anomalyResult', () => {
    const wrapper = getMountWrapper();
    expect(mockedRender).toHaveBeenCalled();
    expect(mockedRender).toHaveBeenCalledWith(wrapper.state());
  });
});
