/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { uiSettingsServiceMock } from '../../../../../../src/core/public/mocks';
import { shallow } from 'enzyme';
import Container from './Container';
import { setUISettings } from '../../../services';

describe('Container', () => {
  const uiSettingsMock = uiSettingsServiceMock.createStartContract();
  setUISettings(uiSettingsMock);
  test('renders add', () => {
    const wrapper = shallow(
      <Container {...{ startingPanel: 'add', embeddable: { vis: { title: '' } } }} />
    );
    expect(wrapper).toMatchSnapshot();
  });
  test('renders associated', () => {
    const wrapper = shallow(
      <Container {...{ startingPanel: 'associated', embeddable: { vis: { title: '' } } }} />
    );
    expect(wrapper).toMatchSnapshot();
  });
});
