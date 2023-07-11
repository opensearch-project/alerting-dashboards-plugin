/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow } from 'enzyme';
import DocumentationTitle from './DocumentationTitle';

describe('DocumentationTitle', () => {
  test('renders', () => {
    const wrapper = shallow(<DocumentationTitle />);
    expect(wrapper).toMatchSnapshot();
  });

  test('title matches', () => {
    const wrapper = shallow(<DocumentationTitle />);
    const title = wrapper.find('[data-ui="documentation-title-text"]');
    expect(title.text()).toEqual('Documentation');
  });
});
