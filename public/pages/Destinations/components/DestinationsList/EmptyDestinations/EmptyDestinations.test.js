/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { mount, render } from 'enzyme';
import EmptyDestinations from './EmptyDestinations';

describe('<EmptyDestinations />', () => {
  test('should render empty destinations message', () => {
    const wrapper = render(
      <EmptyDestinations isFilterApplied={false} onResetFilters={jest.fn()} />
    );
    expect(wrapper).toMatchSnapshot();
  });

  test('should render no results for filter criteria', () => {
    const wrapper = render(<EmptyDestinations isFilterApplied onResetFilters={jest.fn()} />);
    expect(wrapper).toMatchSnapshot();
  });

  test('should call reset Filters callback on click of Reset Filters Button', () => {
    const handleResetFilter = jest.fn();
    const wrapper = mount(<EmptyDestinations isFilterApplied onResetFilters={handleResetFilter} />);
    // Simulate Reset button click Click
    wrapper.find('button').simulate('click');
    expect(handleResetFilter).toHaveBeenCalledTimes(1);
  });
});
