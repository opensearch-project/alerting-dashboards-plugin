/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow } from 'enzyme';
import CreateNew from './CreateNew';

describe('CreateNew', () => {
  test('renders', () => {
    const wrapper = shallow(
      <CreateNew
        {...{ embeddable: { getTitle: () => '', vis: { params: {} } }, core: { http: {} } }}
      />
    );
    expect(wrapper).toMatchSnapshot();
  });
});
