/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Formik } from 'formik';
import { mount } from 'enzyme';

import { FORMIK_INITIAL_VALUES } from '../CreateMonitor/utils/constants';
import MonitorRoles from './MonitorRoles';
import * as helpers from '../MonitorIndex//utils/helpers';
import { httpClientMock } from '../../../../../test/mocks';

helpers.createReasonableWait = jest.fn((cb) => cb());
httpClientMock.post.mockResolvedValue({ ok: true, resp: [] });

// Enzyme's change event is synchronous and Formik's handlers are asynchronous
// https://github.com/formium/formik/issues/937, https://www.benmvp.com/blog/asynchronous-testing-with-enzyme-react-jest/
const runAllPromises = () => new Promise(setImmediate);

function getMountWrapper(customProps = {}) {
  return mount(
    <Formik initialValues={FORMIK_INITIAL_VALUES}>
      {() => <MonitorRoles httpClient={httpClientMock} {...customProps} />}
    </Formik>
  );
}

describe('MonitorRoles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test('renders', () => {
    const wrapper = getMountWrapper();
    expect(wrapper).toMatchSnapshot();
  });

  test('calls onSearchChange when changing input value', () => {
    const onSearchChange = jest.spyOn(MonitorRoles.prototype, 'onSearchChange');
    const wrapper = getMountWrapper();
    wrapper
      .find('[data-test-subj="comboBoxSearchInput"]')
      .hostNodes()
      .simulate('change', { target: { value: 'random-role' } });

    expect(onSearchChange).toHaveBeenCalled();
    expect(onSearchChange).toHaveBeenCalledWith('random-role', false);
  });

  test('searches space normalizes value', () => {
    const wrapper = getMountWrapper();

    wrapper
      .find('[data-test-subj="comboBoxSearchInput"]')
      .hostNodes()
      .simulate('change', { target: { value: ' ' } })
      .simulate('keyDown', { key: 'Enter' });

    expect(wrapper.find('.euiComboBoxPill')).toHaveLength(0);
  });

  test('returns empty array for data.ok = false', async () => {
    httpClientMock.post.mockResolvedValue({ ok: false });
    const wrapper = getMountWrapper();

    expect(await wrapper.find(MonitorRoles).instance().handleQueryRoles('random')).toEqual([]);
    expect(await wrapper.find(MonitorRoles).instance().handleQueryRoles('random')).toEqual([]);
  });

  test('returns roles', async () => {
    httpClientMock.post.mockResolvedValue({
      ok: true,
      resp: ['logstash'],
    });
    const wrapper = getMountWrapper();

    expect(await wrapper.find(MonitorRoles).instance().handleQueryRoles('l')).toEqual([
      { label: 'logstash', role: 'logstash' },
    ]);
  });

  test('sets option when calling onCreateOption', async () => {
    httpClientMock.post.mockResolvedValue({
      ok: true,
      resp: ['logstash'],
    });
    const wrapper = getMountWrapper();

    wrapper
      .find('[data-test-subj="comboBoxSearchInput"]')
      .hostNodes()
      .simulate('change', { target: { value: 'logstash' } });

    await runAllPromises();

    wrapper
      .find('[data-test-subj="comboBoxInput"]')
      .hostNodes()
      .simulate('keyDown', { key: 'ArrowDown' })
      .simulate('keyDown', { key: 'Enter' });

    // Validate the specific role is in the input field
    expect(wrapper.find('[data-test-subj="comboBoxInput"]').text()).toEqual('logstashEuiIconMock');
  });
});
