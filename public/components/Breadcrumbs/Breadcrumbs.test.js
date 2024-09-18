/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { mount, shallow } from 'enzyme';

import Breadcrumbs, {
  createEuiBreadcrumb,
  parseLocationHash,
  getBreadcrumb,
  getBreadcrumbs,
} from './Breadcrumbs';
import { historyMock, httpClientMock } from '../../../test/mocks';
import { MONITOR_ACTIONS, TRIGGER_ACTIONS } from '../../utils/constants';

const monitorId = 'soDk30SjdsekoaSoMcj1';
const location = {
  hash: '',
  pathname: '/monitors/random_id_20_chars__',
  search: '',
  state: undefined,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getBreadcrumbs', () => {
  test('returns Eui formatted breadcrumbs', async () => {
    window.location.hash = '#/dashboard';
    expect(await getBreadcrumbs(httpClientMock, historyMock, {})).toMatchSnapshot();
  });
});

describe('createEuiBreadcrumbs', () => {
  test('creates breadcrumbs for EuiBreadcrumbs', () => {
    const breadcrumb = { text: 'This is a breadcrumb', href: '/this-is-the-href' };
    expect(createEuiBreadcrumb(breadcrumb, historyMock)).toMatchSnapshot();
  });
});

describe('parseLocationHash', () => {
  test('correctly parses location hash', () => {
    const hash = `#/monitors/${monitorId}?action=${TRIGGER_ACTIONS.CREATE_TRIGGER}`;
    expect(parseLocationHash(hash)).toMatchSnapshot();
  });

  test('filters out falsy string values', () => {
    const hash = '#/monitors/';
    expect(parseLocationHash(hash)).toMatchSnapshot();
  });
});

describe('getBreadcrumb', () => {
  const routeState = { destinationToEdit: { name: 'unique_name' } };
  test('returns null if falsy base value', async () => {
    expect(await getBreadcrumb('', {}, httpClientMock)).toBe(null);
    expect(
      await getBreadcrumb(`?action=${TRIGGER_ACTIONS.CREATE_TRIGGER}`, {}, httpClientMock)
    ).toBe(null);
  });

  test('returns correct constant breadcrumbs', async () => {
    expect(await getBreadcrumb('#', {}, httpClientMock)).toMatchSnapshot();
    expect(await getBreadcrumb('monitors', {}, httpClientMock)).toMatchSnapshot();
    expect(await getBreadcrumb('dashboard', {}, httpClientMock)).toMatchSnapshot();
    expect(await getBreadcrumb('destinations', {}, httpClientMock)).toMatchSnapshot();
    expect(await getBreadcrumb('create-monitor', {}, httpClientMock)).toMatchSnapshot();
    expect(await getBreadcrumb('create-destination', {}, httpClientMock)).toMatchSnapshot();
  });

  describe('when matching document IDs', () => {
    test('calls get monitor route', async () => {
      const routeState = {}; // Provide a non-empty routeState object if necessary
      httpClientMock.get.mockResolvedValue({ ok: true, resp: { name: 'random_name' } });
      await getBreadcrumb(monitorId, routeState, httpClientMock);
      expect(httpClientMock.get).toHaveBeenCalled();
      expect(httpClientMock.get).toHaveBeenCalledWith(
        `../api/alerting/monitors/${monitorId}`,
        undefined
      );
    });

    test('returns monitor name', async () => {
      httpClientMock.get.mockResolvedValue({ ok: true, resp: { name: 'random_name' } });
      expect(await getBreadcrumb(monitorId, {}, httpClientMock)).toMatchSnapshot();
    });

    test('uses monitor id as name if request fails', async () => {
      httpClientMock.get.mockRejectedValue({ ok: true, resp: { name: 'random_name' } });
      expect(await getBreadcrumb(monitorId, {}, httpClientMock)).toMatchSnapshot();
    });

    test('uses monitor id as name if ok=false', async () => {
      httpClientMock.get.mockResolvedValue({ ok: false, resp: { name: 'random_name' } });
      expect(await getBreadcrumb(monitorId, {}, httpClientMock)).toMatchSnapshot();
    });

    test('adds appropriate action breadcrumb', async () => {
      httpClientMock.get.mockResolvedValue({ ok: true, resp: { name: 'random_name' } });
      expect(
        await getBreadcrumb(
          `${monitorId}?action=${MONITOR_ACTIONS.EDIT_MONITOR}`,
          {},
          httpClientMock
        )
      ).toMatchSnapshot();
      expect(
        await getBreadcrumb(
          `${monitorId}?action=${TRIGGER_ACTIONS.CREATE_TRIGGER}`,
          {},
          httpClientMock
        )
      ).toMatchSnapshot();
      expect(
        await getBreadcrumb(
          `${monitorId}?action=${TRIGGER_ACTIONS.UPDATE_TRIGGER}`,
          {},
          httpClientMock
        )
      ).toMatchSnapshot();
    });
  });
});
