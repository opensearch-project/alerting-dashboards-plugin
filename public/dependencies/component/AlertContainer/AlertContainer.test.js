/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { httpServiceMock, notificationServiceMock, uiSettingsServiceMock} from '../../../../../../src/core/public/mocks';
import { shallow } from 'enzyme';
import { setClient, setNotifications, setUISettings} from '../../../services';
import AlertContainer from './AlertContainer';

describe('AlertContainer', () => {
  const httpClient = httpServiceMock.createStartContract();
  setClient(httpClient);
  const notifications = notificationServiceMock.createStartContract();
  setNotifications(notifications);
  const uiSettings = uiSettingsServiceMock.createStartContract();
  setUISettings(uiSettings)
  const rawContent = 'name=Flight%20Delay%20Alert&index=opensearch_dashboards_sample_data_flights&timeField=timestamp&bucketValue=12&bucketUnitOfTime=h&filters=%5B%7B%22fieldName%22%3A%5B%7B%22label%22%3A%22FlightDelayMin%22%2C%22type%22%3A%22integer%22%7D%5D%2C%22fieldValue%22%3A0%2C%22operator%22%3A%22is_greater%22%7D%5D&aggregations=%5B%7B%22aggregationType%22%3A%22sum%22%2C%22fieldName%22%3A%22FlightDelayMin%22%7D%5D&triggers=%5B%7B%22name%22%3A%22Delayed%20Time%20Exceeds%201000%20Minutes%22%2C%22severity%22%3A2%2C%22thresholdValue%22%3A1000%2C%22thresholdEnum%22%3A%22ABOVE%22%7D%5D'
  test('renders', () => {
    const wrapper = shallow(<AlertContainer content={rawContent}/>);
    print(wrapper.toString())
    expect(wrapper).toMatchSnapshot();
  });
});
