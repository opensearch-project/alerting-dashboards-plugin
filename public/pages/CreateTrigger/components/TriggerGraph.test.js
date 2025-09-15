/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow } from 'enzyme';
import TriggerGraph from './TriggerGraph';

describe('TriggerGraph', () => {
  let dateNowSpy;
  
  beforeEach(() => {
    // Mock Date.now() to return a consistent timestamp for snapshot testing
    const mockTimestamp = 1761778203555;
    dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(mockTimestamp);
  });
  
  afterEach(() => {
    // Restore Date.now() (note: global afterEach will handle console.error)
    if (dateNowSpy) {
      dateNowSpy.mockRestore();
    }
  });
  
  test('renders', () => {
    const wrapper = shallow(<TriggerGraph />);
    expect(wrapper).toMatchSnapshot();
  });
});
