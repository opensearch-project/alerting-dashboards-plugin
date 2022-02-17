/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow } from 'enzyme';

import Flyout from './Flyout';
import Flyouts from './flyouts';
jest.unmock('./flyouts');

describe('Flyout', () => {
  test('renders', () => {
    const wrapper = shallow(
      <Flyout flyout={{ type: 'message', payload: null }} onClose={jest.fn()} />
    );
    expect(wrapper).toMatchSnapshot();
  });

  test('renders null if no flyout', () => {
    const wrapper = shallow(
      <Flyout flyout={{ type: 'definitely no flyout', payload: null }} onClose={jest.fn()} />
    );
    expect(wrapper).toMatchSnapshot();
  });

  test('defaults if bad flyout data', () => {
    Flyouts.message = jest.fn(() => ({}));
    const wrapper = shallow(
      <Flyout flyout={{ type: 'message', payload: null }} onClose={jest.fn()} />
    );
    expect(wrapper).toMatchSnapshot();
  });
});
