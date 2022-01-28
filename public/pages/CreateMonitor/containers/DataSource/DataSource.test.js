/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import React from 'react';
import { shallow } from 'enzyme';

import { httpClientMock } from '../../../../../test/mocks';
import DataSource from './DataSource';
import { FORMIK_INITIAL_VALUES } from '../CreateMonitor/utils/constants';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('DataSource', () => {
  test('renders', () => {
    const wrapper = shallow(
      <DataSource values={FORMIK_INITIAL_VALUES} httpClient={httpClientMock} />
    );
    expect(wrapper).toMatchSnapshot();
  });
});
