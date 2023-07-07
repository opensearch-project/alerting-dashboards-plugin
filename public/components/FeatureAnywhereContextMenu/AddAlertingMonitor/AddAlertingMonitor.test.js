/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { httpServiceMock } from '../../../../../../src/core/public/mocks';
import { shallow } from 'enzyme';
import AddAlertingMonitor from './AddAlertingMonitor';
import { setClient } from '../../../services';

describe('AddAlertingMonitor', () => {
  const httpClient = httpServiceMock.createStartContract();
  setClient(httpClient);
  test('renders', () => {
    const wrapper = shallow(<AddAlertingMonitor {...{ embeddable: { getTitle: () => '' } }} />);
    expect(wrapper).toMatchSnapshot();
  });
});
