/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow } from 'enzyme';

import { httpClientMock } from '../../../../../test/mocks';
import MonitorSecurity from './MonitorSecurity';
import { FORMIK_INITIAL_VALUES } from '../CreateMonitor/utils/constants';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('MonitorSecurity', () => {
  test('renders', () => {
    const wrapper = shallow(
      <MonitorSecurity values={FORMIK_INITIAL_VALUES} httpClient={httpClientMock} />
    );
    expect(wrapper).toMatchSnapshot();
  });
});
