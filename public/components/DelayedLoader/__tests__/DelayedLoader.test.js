/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, mount } from 'enzyme';
import DelayedLoader from '../DelayedLoader';

describe('<DelayedLoader/>', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  test('renders', () => {
    expect(
      render(
        <DelayedLoader isLoading={false}>
          {(showLoader) => <div style={{ opacity: showLoader ? '0.2' : '1' }} />}
        </DelayedLoader>
      )
    ).toMatchSnapshot();
  });

  test('should set Timer for 1 seconds if initial loading is true', () => {
    const setTimeout = jest.spyOn(window, 'setTimeout');
    const wrapper = mount(
      <DelayedLoader isLoading={true}>
        {(showLoader) => <div style={{ opacity: showLoader ? '0.2' : '1' }} />}
      </DelayedLoader>
    );
    expect(setTimeout).toHaveBeenCalledTimes(1);
    expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 1000);
    expect(wrapper).toMatchSnapshot();
  });
  test('should clear Timer on componentWillUnmount if exists', () => {
    const setTimeout = jest.spyOn(window, 'setTimeout');
    const clearTimeout = jest.spyOn(window, 'clearTimeout');
    const wrapper = mount(
      <DelayedLoader isLoading={true}>
        {(showLoader) => <div style={{ opacity: showLoader ? '0.2' : '1' }} />}
      </DelayedLoader>
    );
    expect(setTimeout).toHaveBeenCalledTimes(1);
    expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 1000);
    wrapper.unmount();
    expect(clearTimeout).toHaveBeenCalledTimes(1);
  });

  test('should not show loader if data fetching is finished before threshold', () => {
    const clearTimeout = jest.spyOn(window, 'clearTimeout');
    const wrapper = mount(
      <DelayedLoader isLoading={true}>
        {(showLoader) => <div style={{ opacity: showLoader ? '0.2' : '1' }} />}
      </DelayedLoader>
    );
    wrapper.setProps({ isLoading: false });
    expect(clearTimeout).toHaveBeenCalledTimes(1);
    expect(wrapper).toMatchSnapshot();
  });

  test('should show loader if data fetching takes more than threshold', () => {
    const wrapper = mount(
      <DelayedLoader isLoading={false}>
        {(showLoader) => <div style={{ opacity: showLoader ? '0.2' : '1' }} />}
      </DelayedLoader>
    );
    wrapper.setProps({ isLoading: true });
    jest.runAllTimers();
    wrapper.update();
    expect(wrapper).toMatchSnapshot();
  });

  test('should throw an error if children is not function', () => {
    expect(() => {
      render(
        <DelayedLoader isLoading={false}>
          <div />
        </DelayedLoader>
      );
    }).toThrow('Children should be function');
  });
});
