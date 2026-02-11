/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { mount, shallow } from 'enzyme';
import _ from 'lodash';

import Monitors from './Monitors';
import { historyMock, httpClientMock } from '../../../../../test/mocks';
import { AlertingFakes, setupCoreStart } from '../../../../../test/utils/helpers';

const alertingFakes = new AlertingFakes('random seed');

jest.unmock('lodash');
_.debounce = jest.fn((fn) => fn);

const match = {
  isExact: true,
  params: {},
  path: '/monitors',
  url: '/monitors',
};
const location = {
  hash: '',
  pathname: '/monitors',
  search: '',
  state: undefined,
};

function getMountWrapper(customProps = {}) {
  return mount(
    <Monitors
      httpClient={httpClientMock}
      history={historyMock}
      match={match}
      location={location}
      {...customProps}
    />
  );
}

beforeAll(() => {
  setupCoreStart();
});

describe('Monitors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    httpClientMock.put.mockResolvedValue({ ok: true });
    httpClientMock.post.mockResolvedValue({ ok: true });
    httpClientMock.get.mockResolvedValue({ ok: true, monitors: [], totalMonitors: 0 });
    httpClientMock.delete.mockResolvedValue({ ok: true });
  });
  test('renders', () => {
    const wrapper = shallow(
      <Monitors
        httpClient={httpClientMock}
        history={historyMock}
        match={match}
        location={location}
      />
    );
    expect(wrapper).toMatchSnapshot();
  });

  test.skip('calls getMonitors on mount and whenever query params are updated', () => {
    // TODO: Skipping this test as we need to migrate the plugin away from using enzyme for unit tests - https://github.com/opensearch-project/alerting-dashboards-plugin/issues/236
    const getMonitors = jest.spyOn(Monitors.prototype, 'getMonitors');
    const mountWrapper = getMountWrapper();
    expect(getMonitors).toHaveBeenCalledTimes(1);

    mountWrapper.setState({ size: 100 });
    mountWrapper.update();

    expect(getMonitors).toHaveBeenCalledTimes(2);
  });

  test.skip('onTableChange updates page,size,sorts', () => {
    // TODO: Skipping this test as we need to migrate the plugin away from using enzyme for unit tests - https://github.com/opensearch-project/alerting-dashboards-plugin/issues/236
    const onTableChange = jest.spyOn(Monitors.prototype, 'onTableChange');
    const mountWrapper = getMountWrapper();
    expect(mountWrapper.instance().state.page).not.toBe(17);
    expect(mountWrapper.instance().state.size).not.toBe(17);
    expect(mountWrapper.instance().state.sortField).not.toBe('testing_sort_field');
    expect(mountWrapper.instance().state.sortDirection).not.toBe('asc');
    mountWrapper.instance().onTableChange({
      page: { index: 17, size: 17 },
      sort: { field: 'testing_sort_field', direction: 'desc' },
    });
    mountWrapper.update();

    expect(onTableChange).toHaveBeenCalled();
    expect(mountWrapper.instance().state.page).toBe(17);
    expect(mountWrapper.instance().state.size).toBe(17);
    expect(mountWrapper.instance().state.sortField).toBe('testing_sort_field');
    expect(mountWrapper.instance().state.sortDirection).toBe('desc');
  });

  test.skip('onMonitorStateChange sets new monitorState and resets page to 0', () => {
    // TODO: Skipping this test as we need to migrate the plugin away from using enzyme for unit tests - https://github.com/opensearch-project/alerting-dashboards-plugin/issues/236
    const onMonitorStateChange = jest.spyOn(Monitors.prototype, 'onMonitorStateChange');
    const mountWrapper = getMountWrapper();
    mountWrapper.setState({ page: 2 });
    mountWrapper.update();
    expect(mountWrapper.instance().state.page).toBe(2);
    mountWrapper.instance().onMonitorStateChange({ target: { value: 'NEW_STATE' } });
    mountWrapper.update();

    expect(onMonitorStateChange).toHaveBeenCalled();
    expect(mountWrapper.instance().state.monitorState).toBe('NEW_STATE');
    expect(mountWrapper.instance().state.page).toBe(0);
  });

  test.skip('onSelectionChange updates selectedItems', () => {
    // TODO: Skipping this test as we need to migrate the plugin away from using enzyme for unit tests - https://github.com/opensearch-project/alerting-dashboards-plugin/issues/236
    const onSelectionChange = jest.spyOn(Monitors.prototype, 'onSelectionChange');
    const mountWrapper = getMountWrapper();
    expect(mountWrapper.instance().state.selectedItems).toEqual([]);
    mountWrapper.instance().onSelectionChange([{ id: 'item_id', version: 17 }]);
    mountWrapper.update();

    expect(onSelectionChange).toHaveBeenCalled();
    expect(mountWrapper.instance().state.selectedItems).toEqual([{ id: 'item_id', version: 17 }]);
  });

  test.skip('onSearchChange sets search value and resets page', () => {
    // TODO: Skipping this test as we need to migrate the plugin away from using enzyme for unit tests - https://github.com/opensearch-project/alerting-dashboards-plugin/issues/236
    const onSearchChange = jest.spyOn(Monitors.prototype, 'onSearchChange');
    const mountWrapper = getMountWrapper();
    mountWrapper.setState({ page: 2 });
    mountWrapper.update();
    expect(mountWrapper.instance().state.search).toBe('');
    expect(mountWrapper.instance().state.page).toBe(2);
    mountWrapper.instance().onSearchChange({ target: { value: 'test' } });
    mountWrapper.update();

    expect(onSearchChange).toHaveBeenCalled();
    expect(mountWrapper.instance().state.search).toBe('test');
    expect(mountWrapper.instance().state.page).toBe(0);
  });

  test.skip('updateMonitor calls put with update', async () => {
    // TODO: Skipping this test as we need to migrate the plugin away from using enzyme for unit tests - https://github.com/opensearch-project/alerting-dashboards-plugin/issues/236
    const updateMonitor = jest.spyOn(Monitors.prototype, 'updateMonitor');
    httpClientMock.put = jest
      .fn()
      .mockResolvedValueOnce({ ok: true })
      .mockRejectedValueOnce(new Error('random error'));
    const mountWrapper = getMountWrapper();
    const monitor = alertingFakes.randomMonitor();
    const response = await mountWrapper
      .instance()
      .updateMonitor(
        { id: 'random_id', ifSeqNo: 17, ifPrimaryTerm: 20, monitor },
        { name: 'UNIQUE_NAME' }
      );
    mountWrapper.update();

    expect(updateMonitor).toHaveBeenCalled();
    expect(httpClientMock.put).toHaveBeenCalled();
    expect(httpClientMock.put).toHaveBeenCalledWith(`../api/alerting/monitors/random_id`, {
      query: { ifSeqNo: 17, ifPrimaryTerm: 20 },
      body: JSON.stringify({ name: 'UNIQUE_NAME' }),
    });

    expect(response).toEqual({ ok: true });
    const error = await mountWrapper
      .instance()
      .updateMonitor(
        { id: 'random_id', ifSeqNo: 17, ifPrimaryTerm: 20, monitor },
        { name: 'UNIQUE_NAME' }
      );
    expect(httpClientMock.put).toHaveBeenCalledTimes(2);
    expect(error.message).toBe('random error');
  });

  test.skip('onClickAcknowledge calls getActiveAlerts with monitor', () => {
    // TODO: Skipping this test as we need to migrate the plugin away from using enzyme for unit tests - https://github.com/opensearch-project/alerting-dashboards-plugin/issues/236
    const onClickAcknowledge = jest.spyOn(Monitors.prototype, 'onClickAcknowledge');
    const getActiveAlerts = jest.spyOn(Monitors.prototype, 'getActiveAlerts');
    const mountWrapper = getMountWrapper();
    const monitor = alertingFakes.randomMonitor();
    httpClientMock.get.mockResolvedValue({ ok: true, alerts: [], totalAlerts: 0 });
    mountWrapper.instance().onClickAcknowledge(monitor);

    expect(onClickAcknowledge).toHaveBeenCalled();
    expect(getActiveAlerts).toHaveBeenCalled();
    expect(getActiveAlerts).toHaveBeenCalledWith([monitor]);
  });

  test.skip('onClickAcknowledgeModal acknowledges selected alerts for each monitor', async () => {
    // TODO: Skipping this test as we need to migrate the plugin away from using enzyme for unit tests - https://github.com/opensearch-project/alerting-dashboards-plugin/issues/236
    const onClickAcknowledgeModal = jest.spyOn(Monitors.prototype, 'onClickAcknowledgeModal');
    const mountWrapper = getMountWrapper();
    const alerts = [
      { id: 'alert_1', monitor_id: 'monitor_1' },
      { id: 'alert_2', monitor_id: 'monitor_1' },
      { id: 'alert_1', monitor_id: 'monitor_2' },
    ];
    await mountWrapper.instance().onClickAcknowledgeModal(alerts);

    expect(onClickAcknowledgeModal).toHaveBeenCalled();
    expect(onClickAcknowledgeModal).toHaveBeenCalledWith(alerts);
    expect(httpClientMock.post).toHaveBeenCalledTimes(2);
    expect(httpClientMock.post).toHaveBeenNthCalledWith(
      1,
      `../api/alerting/monitors/monitor_1/_acknowledge/alerts`,
      { body: JSON.stringify({ alerts: ['alert_1', 'alert_2'] }) }
    );
    expect(httpClientMock.post).toHaveBeenNthCalledWith(
      2,
      `../api/alerting/monitors/monitor_2/_acknowledge/alerts`,
      { body: JSON.stringify({ alerts: ['alert_1'] }) }
    );
  });

  test.skip('onClickEdit calls history.push', () => {
    // TODO: Skipping this test as we need to migrate the plugin away from using enzyme for unit tests - https://github.com/opensearch-project/alerting-dashboards-plugin/issues/236
    const onClickEdit = jest.spyOn(Monitors.prototype, 'onClickEdit');
    const mountWrapper = getMountWrapper();
    const monitor = alertingFakes.randomMonitor();

    mountWrapper.setState({ selectedItems: [{ id: 'random_id', version: 17, monitor }] });
    mountWrapper.instance().onClickEdit();

    expect(onClickEdit).toHaveBeenCalled();
    expect(historyMock.push).toHaveBeenCalled();
    expect(historyMock.push).toHaveBeenCalledWith(
      `/monitors/random_id?action=edit-monitor&viewMode=classic&mode=classic`
    );
  });

  test.skip('onClickEnable calls updateMonitors with monitor and enable:true update', () => {
    // TODO: Skipping this test as we need to migrate the plugin away from using enzyme for unit tests - https://github.com/opensearch-project/alerting-dashboards-plugin/issues/236
    const onClickEnable = jest.spyOn(Monitors.prototype, 'onClickEnable');
    const updateMonitors = jest.spyOn(Monitors.prototype, 'updateMonitors');
    const mountWrapper = getMountWrapper();
    const monitor = alertingFakes.randomMonitor();
    mountWrapper.instance().onClickEnable(monitor);

    expect(onClickEnable).toHaveBeenCalled();
    expect(updateMonitors).toHaveBeenCalled();
    expect(updateMonitors).toHaveBeenCalledWith([monitor], { enabled: true });
  });

  test.skip('onClickDelete calls deleteMonitors with monitor', () => {
    // TODO: Skipping this test as we need to migrate the plugin away from using enzyme for unit tests - https://github.com/opensearch-project/alerting-dashboards-plugin/issues/236
    const onClickDelete = jest.spyOn(Monitors.prototype, 'onClickDelete');
    const mountWrapper = getMountWrapper();
    const monitor = alertingFakes.randomMonitor();
    const setState = jest.spyOn(mountWrapper.instance(), 'setState');
    mountWrapper.instance().onClickDelete(monitor);

    expect(onClickDelete).toHaveBeenCalled();
    expect(setState).toHaveBeenCalled();
  });

  test.skip('onClickDisable calls updateMonitors with monitor and enable:false update', () => {
    // TODO: Skipping this test as we need to migrate the plugin away from using enzyme for unit tests - https://github.com/opensearch-project/alerting-dashboards-plugin/issues/236
    const onClickDisable = jest.spyOn(Monitors.prototype, 'onClickDisable');
    const updateMonitors = jest.spyOn(Monitors.prototype, 'updateMonitors');
    const mountWrapper = getMountWrapper();
    const monitor = alertingFakes.randomMonitor();
    mountWrapper.instance().onClickDisable(monitor);

    expect(onClickDisable).toHaveBeenCalled();
    expect(updateMonitors).toHaveBeenCalled();
    expect(updateMonitors).toHaveBeenCalledWith([monitor], { enabled: false });
  });

  test.skip('onBulkAcknowledge calls getActiveAlerts with selectedItems', () => {
    // TODO: Skipping this test as we need to migrate the plugin away from using enzyme for unit tests - https://github.com/opensearch-project/alerting-dashboards-plugin/issues/236
    const onBulkAcknowledge = jest.spyOn(Monitors.prototype, 'onBulkAcknowledge');
    const getActiveAlerts = jest.spyOn(Monitors.prototype, 'getActiveAlerts');
    const mountWrapper = getMountWrapper();
    const monitor = alertingFakes.randomMonitor();
    const selectedItems = [{ id: 'selected_items', version: 17, monitor }];
    mountWrapper.setState({ selectedItems });
    mountWrapper.update();

    httpClientMock.get.mockResolvedValue({ ok: true, alerts: [], totalAlerts: 0 });
    mountWrapper.instance().onBulkAcknowledge();

    expect(onBulkAcknowledge).toHaveBeenCalled();
    expect(getActiveAlerts).toHaveBeenCalled();
    expect(getActiveAlerts).toHaveBeenCalledWith(selectedItems);
  });

  test.skip('onBulkEnable calls updateMonitors with selectedItems and enabled:true update', () => {
    // TODO: Skipping this test as we need to migrate the plugin away from using enzyme for unit tests - https://github.com/opensearch-project/alerting-dashboards-plugin/issues/236
    const onBulkEnable = jest.spyOn(Monitors.prototype, 'onBulkEnable');
    const updateMonitors = jest.spyOn(Monitors.prototype, 'updateMonitors');
    const mountWrapper = getMountWrapper();
    const monitor = alertingFakes.randomMonitor();
    const selectedItems = [{ id: 'bulkenable', version: 15, monitor }];

    mountWrapper.setState({ selectedItems });
    mountWrapper.update();
    mountWrapper.instance().onBulkEnable();

    expect(onBulkEnable).toHaveBeenCalled();
    expect(updateMonitors).toHaveBeenCalled();
    expect(updateMonitors).toHaveBeenCalledWith(selectedItems, { enabled: true });
  });

  test.skip('onBulkDelete calls deleteMonitors with selectedItems', () => {
    // TODO: Skipping this test as we need to migrate the plugin away from using enzyme for unit tests - https://github.com/opensearch-project/alerting-dashboards-plugin/issues/236
    const onBulkDelete = jest.spyOn(Monitors.prototype, 'onBulkDelete');
    const mountWrapper = getMountWrapper();
    const monitor = alertingFakes.randomMonitor();
    const selectedItems = [{ id: 'selected', version: 15, monitor }];

    mountWrapper.setState({ selectedItems });
    mountWrapper.update();

    mountWrapper.instance().onBulkDelete();

    expect(onBulkDelete).toHaveBeenCalled();
  });

  test.skip('onBulkDisable calls updateMonitors with selectedItems and update to apply', () => {
    // TODO: Skipping this test as we need to migrate the plugin away from using enzyme for unit tests - https://github.com/opensearch-project/alerting-dashboards-plugin/issues/236
    const onBulkDisable = jest.spyOn(Monitors.prototype, 'onBulkDisable');
    const updateMonitors = jest.spyOn(Monitors.prototype, 'updateMonitors');
    const mountWrapper = getMountWrapper();
    const monitor = alertingFakes.randomMonitor();
    const selectedItems = [{ id: 'selected', version: 15, monitor }];

    mountWrapper.setState({ selectedItems });
    mountWrapper.update();

    mountWrapper.instance().onBulkDisable();

    expect(onBulkDisable).toHaveBeenCalled();
    expect(updateMonitors).toHaveBeenCalled();
    expect(updateMonitors).toHaveBeenCalledWith(selectedItems, { enabled: false });
  });

  test.skip('onPageClick sets page', () => {
    // TODO: Skipping this test as we need to migrate the plugin away from using enzyme for unit tests - https://github.com/opensearch-project/alerting-dashboards-plugin/issues/236
    const onPageClick = jest.spyOn(Monitors.prototype, 'onPageClick');
    const mountWrapper = getMountWrapper();
    mountWrapper.setState({ page: 17 });
    mountWrapper.update();
    expect(mountWrapper.instance().state.page).toBe(17);
    mountWrapper.instance().onPageClick(12);
    mountWrapper.update();
    expect(onPageClick).toHaveBeenCalled();
    expect(mountWrapper.instance().state.page).toBe(12);
  });

  test.skip('getActiveAlerts returns early if no monitors', async () => {
    // TODO: Skipping this test as we need to migrate the plugin away from using enzyme for unit tests - https://github.com/opensearch-project/alerting-dashboards-plugin/issues/236
    const getActiveAlerts = jest.spyOn(Monitors.prototype, 'getActiveAlerts');
    const mountWrapper = getMountWrapper();
    expect(httpClientMock.get).toHaveBeenCalledTimes(1);
    await mountWrapper.instance().getActiveAlerts([]);
    mountWrapper.update();

    expect(getActiveAlerts).toHaveBeenCalled();
    expect(httpClientMock.get).toHaveBeenCalledTimes(1);
  });

  test.skip('onClickCancel hides acknowledge modal', () => {
    // TODO: Skipping this test as we need to migrate the plugin away from using enzyme for unit tests - https://github.com/opensearch-project/alerting-dashboards-plugin/issues/236
    const onClickCancel = jest.spyOn(Monitors.prototype, 'onClickCancel');
    const mountWrapper = getMountWrapper();
    mountWrapper.setState({ showAcknowledgeModal: true });
    mountWrapper.update();
    expect(mountWrapper.instance().state.showAcknowledgeModal).toBe(true);
    mountWrapper.instance().onClickCancel();
    mountWrapper.update();
    expect(onClickCancel).toHaveBeenCalled();
    expect(mountWrapper.instance().state.showAcknowledgeModal).toBe(false);
  });

  test.skip('resetFilters resets search and state', () => {
    // TODO: Skipping this test as we need to migrate the plugin away from using enzyme for unit tests - https://github.com/opensearch-project/alerting-dashboards-plugin/issues/236
    const resetFilters = jest.spyOn(Monitors.prototype, 'resetFilters');
    const mountWrapper = getMountWrapper();
    mountWrapper.setState({ search: 'searched', monitorState: 'NOT_ALL' });
    mountWrapper.update();
    expect(mountWrapper.instance().state.search).toBe('searched');
    expect(mountWrapper.instance().state.monitorState).toBe('NOT_ALL');
    mountWrapper.instance().resetFilters();
    mountWrapper.update();
    expect(resetFilters).toHaveBeenCalled();
    expect(mountWrapper.instance().state.search).toBe('');
    expect(mountWrapper.instance().state.monitorState).toBe('all');
  });

  test.skip('getItemId returns formatted id for table', () => {
    // TODO: Skipping this test as we need to migrate the plugin away from using enzyme for unit tests - https://github.com/opensearch-project/alerting-dashboards-plugin/issues/236
    const getItemId = jest.spyOn(Monitors.prototype, 'getItemId');
    const mountWrapper = getMountWrapper();
    const response = mountWrapper
      .instance()
      .getItemId({ id: 'item_id', currentTime: 143534534345 });

    expect(getItemId).toHaveBeenCalled();
    expect(response).toBe('item_id-143534534345');
  });
});
