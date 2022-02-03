/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { mount } from 'enzyme';

import ManageSenders from './ManageSenders';
import { httpClientMock } from '../../../../../../test/mocks';

const runAllPromises = () => new Promise(setImmediate);

const onClickCancel = jest.fn();
const onClickSave = jest.fn();

describe('ManageSenders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders', () => {
    const wrapper = mount(
      <ManageSenders
        httpClient={httpClientMock}
        isEmailAllowed={true}
        isVisible={false}
        onClickCancel={onClickCancel}
        onClickSave={onClickSave}
      />
    );
    expect(wrapper).toMatchSnapshot();
  });

  test('renders when visible', () => {
    const wrapper = mount(
      <ManageSenders
        httpClient={httpClientMock}
        isEmailAllowed={true}
        isVisible={true}
        onClickCancel={onClickCancel}
        onClickSave={onClickSave}
      />
    );
    expect(wrapper).toMatchSnapshot();
  });

  test('renders when email is disallowed', () => {
    const wrapper = mount(
      <ManageSenders
        httpClient={httpClientMock}
        isEmailAllowed={false}
        isVisible={true}
        onClickCancel={onClickCancel}
        onClickSave={onClickSave}
      />
    );
    expect(wrapper).toMatchSnapshot();
  });

  test('loadInitialValues', async () => {
    const mockEmailAccount = {
      id: 'id',
      name: 'test_account',
      email: 'test@email.com',
      host: 'smtp.test.com',
      port: 25,
      method: 'none',
    };

    // Mock return in getSenders function
    httpClientMock.get.mockResolvedValue({
      ok: true,
      emailAccounts: [mockEmailAccount],
    });

    const wrapper = mount(
      <ManageSenders
        httpClient={httpClientMock}
        isEmailAllowed={true}
        isVisible={true}
        onClickCancel={onClickCancel}
        onClickSave={onClickSave}
      />
    );

    await runAllPromises();
    expect(wrapper.instance().state.initialValues.senders.length).toBe(1);
    expect(wrapper.instance().state.initialValues.senders[0].name).toBe('test_account');
  });

  test('getSenders logs resp.err when ok:false', async () => {
    const log = jest.spyOn(global.console, 'log');
    // Mock return in getSenders function
    httpClientMock.get.mockResolvedValue({
      ok: false,
      err: 'test',
    });

    const wrapper = mount(
      <ManageSenders
        httpClient={httpClientMock}
        isEmailAllowed={true}
        isVisible={true}
        onClickCancel={onClickCancel}
        onClickSave={onClickSave}
      />
    );

    await runAllPromises();
    expect(log).toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith('Unable to get email accounts', 'test');
  });

  test('loads empty list of senders when ok:false', async () => {
    // Mock return in getSenders function
    httpClientMock.get.mockResolvedValue({
      ok: false,
      err: 'test',
    });

    const wrapper = mount(
      <ManageSenders
        httpClient={httpClientMock}
        isEmailAllowed={true}
        isVisible={true}
        onClickCancel={onClickCancel}
        onClickSave={onClickSave}
      />
    );

    await runAllPromises();
    expect(wrapper.instance().state.initialValues.senders).toEqual([]);
  });
});
