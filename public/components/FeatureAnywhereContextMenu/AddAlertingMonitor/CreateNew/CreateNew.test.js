/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { uiSettingsServiceMock } from '../../../../../../src/core/public/mocks';
import { shallow } from 'enzyme';
import CreateNew from './CreateNew';
import { setUISettings } from '../../../../services';

describe('CreateNew', () => {
  const uiSettingsMock = uiSettingsServiceMock.createStartContract();
  setUISettings(uiSettingsMock);
  test('renders', () => {
    const wrapper = shallow(
      <CreateNew
        {...{ embeddable: { getTitle: () => '', vis: { params: {} } }, core: { http: {} } }}
      />
    );
    expect(wrapper).toMatchSnapshot();
  });
});
