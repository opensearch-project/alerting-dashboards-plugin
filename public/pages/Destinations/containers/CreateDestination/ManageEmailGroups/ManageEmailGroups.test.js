/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { mount } from 'enzyme';

import ManageEmailGroups from './ManageEmailGroups';
import { httpClientMock } from '../../../../../../test/mocks';

const runAllPromises = () => new Promise(setImmediate);

const onClickCancel = jest.fn();
const onClickSave = jest.fn();

describe('ManageEmailGroups', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders', () => {
    const wrapper = mount(
      <ManageEmailGroups
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
      <ManageEmailGroups
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
      <ManageEmailGroups
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
    const mockEmailGroup = {
      id: 'id',
      name: 'test_group',
      emails: [{ email: 'test@email.com' }],
    };

    // Mock return in getEmailGroups function
    httpClientMock.get.mockResolvedValue({
      ok: true,
      emailGroups: [mockEmailGroup],
    });

    const wrapper = mount(
      <ManageEmailGroups
        httpClient={httpClientMock}
        isEmailAllowed={true}
        isVisible={true}
        onClickCancel={onClickCancel}
        onClickSave={onClickSave}
      />
    );

    await runAllPromises();
    expect(wrapper.instance().state.initialValues.emailGroups.length).toBe(1);
    expect(wrapper.instance().state.initialValues.emailGroups[0].emails).toEqual([
      { label: 'test@email.com' },
    ]);
  });

  test('getEmailGroups logs resp.err when ok:false', async () => {
    const log = jest.spyOn(global.console, 'log');
    // Mock return in getEmailGroups function
    httpClientMock.get.mockResolvedValue({
      ok: false,
      err: 'test',
    });

    const wrapper = mount(
      <ManageEmailGroups
        httpClient={httpClientMock}
        isEmailAllowed={true}
        isVisible={true}
        onClickCancel={onClickCancel}
        onClickSave={onClickSave}
      />
    );

    await runAllPromises();
    expect(log).toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith('Unable to get email groups', 'test');
  });

  test('loads empty list of email groups when ok:false', async () => {
    // Mock return in getEmailGroups function
    httpClientMock.get.mockResolvedValue({
      ok: false,
      err: 'test',
    });

    const wrapper = mount(
      <ManageEmailGroups
        httpClient={httpClientMock}
        isEmailAllowed={true}
        isVisible={true}
        onClickCancel={onClickCancel}
        onClickSave={onClickSave}
      />
    );

    await runAllPromises();
    expect(wrapper.instance().state.initialValues.emailGroups).toEqual([]);
  });
});
