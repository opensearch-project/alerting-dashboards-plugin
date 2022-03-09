/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { mount } from 'enzyme';

import DestinationsList from './DestinationsList';
import { historyMock, httpClientMock } from '../../../../../test/mocks';
import { DESTINATION_TYPE } from '../../utils/constants';

const location = {
  hash: '',
  search: '',
  state: undefined,
};

const runAllPromises = () => new Promise(setImmediate);

describe('DestinationsList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders', async () => {
    const mockSettings = {
      defaults: {
        plugins: {
          alerting: {
            destination: {
              allow_list: Object.values(DESTINATION_TYPE),
            },
          },
        },
      },
    };

    httpClientMock.get
      .mockResolvedValueOnce({
        // Mock getAllowList
        ok: true,
        resp: mockSettings,
      })
      .mockResolvedValue({
        // Mock return in getDestinations function
        ok: true,
        destinations: [],
        totalDestinations: 0,
      });

    const wrapper = mount(
      <DestinationsList httpClient={httpClientMock} history={historyMock} location={location} />
    );

    await runAllPromises();
    wrapper.update();
    expect(wrapper).toMatchSnapshot();
  });

  test('renders when email is disallowed', async () => {
    const mockAllowList = ['chime', 'slack', 'custom_webhook'];
    const mockSettings = {
      defaults: {
        plugins: {
          alerting: {
            destination: {
              allow_list: mockAllowList,
            },
          },
        },
      },
    };

    httpClientMock.get
      .mockResolvedValueOnce({
        // Mock getAllowList
        ok: true,
        resp: mockSettings,
      })
      .mockResolvedValue({
        // Mock return in getDestinations function
        ok: true,
        destinations: [],
        totalDestinations: 0,
      });

    const wrapper = mount(
      <DestinationsList httpClient={httpClientMock} history={historyMock} location={location} />
    );

    await runAllPromises();
    wrapper.update();

    expect(wrapper.instance().state.allowList).toEqual(mockAllowList);
    expect(wrapper).toMatchSnapshot();
  });

  test('getDestinations', async () => {
    const mockSettings = {
      defaults: {
        plugins: {
          alerting: {
            destination: {
              allow_list: Object.values(DESTINATION_TYPE),
            },
          },
        },
      },
    };

    const mockDestination = {
      id: 'id',
      type: 'test_action',
      name: 'destName',
      schema_version: 1,
      seq_no: 2,
      primary_term: 3,
      test_action: 'dummy',
    };

    httpClientMock.get
      .mockResolvedValueOnce({
        // Mock getAllowList
        ok: true,
        resp: mockSettings,
      })
      .mockResolvedValue({
        // Mock return in getDestinations function
        ok: true,
        destinations: [mockDestination],
        totalDestinations: 1,
      });

    const wrapper = mount(
      <DestinationsList httpClient={httpClientMock} history={historyMock} location={location} />
    );

    await runAllPromises();

    expect(wrapper.instance().state.totalDestinations).toBe(1);
    expect(wrapper.instance().state.destinations.length).toBe(1);
    expect(wrapper.instance().state.destinations[0].id).toBe('id');
    expect(wrapper.instance().state.destinations[0].type).toBe('test_action');
    expect(wrapper.instance().state.destinations[0].name).toBe('destName');
    expect(wrapper.instance().state.destinations[0].schema_version).toBe(1);
    expect(wrapper.instance().state.destinations[0].seq_no).toBe(2);
    expect(wrapper.instance().state.destinations[0].primary_term).toBe(3);
    expect(wrapper.instance().state.destinations[0].test_action).toBe('dummy');
  });
});
