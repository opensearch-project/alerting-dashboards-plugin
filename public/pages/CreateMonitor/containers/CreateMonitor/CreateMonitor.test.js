/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow } from 'enzyme';
import { httpServiceMock } from '../../../../../../../src/core/public/mocks';

import CreateMonitor from './CreateMonitor';
import { historyMock, httpClientMock } from '../../../../../test/mocks';
import { FORMIK_INITIAL_VALUES } from './utils/constants';
import AlertingFakes from '../../../../../test/utils/helpers';
import { SEARCH_TYPE } from '../../../../utils/constants';
import { TRIGGER_TYPE } from '../../../CreateTrigger/containers/CreateTrigger/utils/constants';
import { setClient, setNotifications } from '../../../../services';
import { formikToMonitor } from './utils/formikToMonitor';
import coreMock from '../../../../../test/mocks/CoreMock';

const alertingFakes = new AlertingFakes('CreateMonitor random seed');

const setFlyout = jest.fn();
const updateMonitor = jest.fn().mockResolvedValue({ ok: true, id: 'monitor_id' });
const formikBag = {
  setSubmitting: jest.fn(),
  setErrors: jest.fn(),
};
const match = {
  isExact: true,
  params: {},
  path: '/create-monitor',
  url: '/create-monitor',
};
const location = {
  hash: '',
  pathname: '/create-monitor',
  search: '',
  state: undefined,
};
beforeEach(() => {
  jest.clearAllMocks();
});

describe('CreateMonitor', () => {
  const httpClient = httpServiceMock.createStartContract();
  setClient(httpClient);
  setNotifications(coreMock.notifications);
  test('renders', () => {
    const wrapper = shallow(
      <CreateMonitor
        httpClient={httpClientMock}
        history={historyMock}
        setFlyout={setFlyout}
        match={match}
        location={location}
      />
    );
    expect(wrapper).toMatchSnapshot();
  });

  test('uses AD query Params as initialValues when parameter exists', () => {
    const wrapper = shallow(
      <CreateMonitor
        httpClient={httpClientMock}
        history={historyMock}
        setFlyout={setFlyout}
        match={match}
        location={{ ...location, search: 'searchType=ad&adId=randomId&name=Sample' }}
      />
    );
    expect(wrapper.instance().state.initialValues.name).toBe('Sample-Monitor');
    expect(wrapper.instance().state.initialValues.searchType).toBe(SEARCH_TYPE.AD);
    expect(wrapper.instance().state.initialValues.detectorId).toBe('randomId');
  });

  test('uses monitorToEdit as initialValues when editing', () => {
    const monitor = alertingFakes.randomMonitor();
    const wrapper = shallow(
      <CreateMonitor
        httpClient={httpClientMock}
        edit={true}
        history={historyMock}
        setFlyout={setFlyout}
        updateMonitor={updateMonitor}
        monitorToEdit={monitor}
        match={match}
        location={location}
      />
    );
    expect(wrapper.instance().state.initialValues.name).toBe(monitor.name);
  });

  /**
   * TODO: move these tests to helper.test.js as the new helper.js file has this logic now
  describe('onSubmit', () => {
    test('calls only onUpdate when editing', () => {
      const onCreate = jest.spyOn(CreateMonitor.prototype, 'onCreate');
      const onUpdate = jest.spyOn(CreateMonitor.prototype, 'onUpdate');
      const wrapper = shallow(
        <CreateMonitor
          httpClient={httpClientMock}
          edit={true}
          history={historyMock}
          setFlyout={setFlyout}
          updateMonitor={updateMonitor}
          monitorToEdit={null}
          match={match}
          location={location}
          notifications={coreMock.notifications}
        />
      );
      wrapper.instance().onSubmit(FORMIK_INITIAL_VALUES, formikBag);
      expect(onUpdate).toHaveBeenCalledTimes(1);
      expect(onCreate).not.toHaveBeenCalled();
    });

    test('calls only onCreate when creating', () => {
      const onCreate = jest.spyOn(CreateMonitor.prototype, 'onCreate');
      const onUpdate = jest.spyOn(CreateMonitor.prototype, 'onUpdate');
      httpClientMock.post.mockResolvedValue({ ok: true, resp: { _id: 'monitor_id' } });
      const wrapper = shallow(
        <CreateMonitor
          httpClient={httpClientMock}
          history={historyMock}
          setFlyout={setFlyout}
          match={match}
          location={location}
          notifications={coreMock.notifications}
        />
      );
      wrapper.instance().onSubmit(FORMIK_INITIAL_VALUES, formikBag);
      expect(onCreate).toHaveBeenCalledTimes(1);
      expect(onUpdate).not.toHaveBeenCalled();
    });
  });
  **/

  describe('onCancel', () => {
    test('calls history.goBack if editing', () => {
      const wrapper = shallow(
        <CreateMonitor
          httpClient={httpClientMock}
          edit={true}
          history={historyMock}
          setFlyout={setFlyout}
          updateMonitor={updateMonitor}
          monitorToEdit={null}
          match={match}
          location={location}
        />
      );
      wrapper.instance().onCancel();
      expect(historyMock.goBack).toHaveBeenCalledTimes(1);
      expect(historyMock.push).not.toHaveBeenCalled();
    });

    test('calls history.push when creating', () => {
      const wrapper = shallow(
        <CreateMonitor
          httpClient={httpClientMock}
          history={historyMock}
          setFlyout={setFlyout}
          match={match}
          location={location}
        />
      );
      wrapper.instance().onCancel();
      expect(historyMock.push).toHaveBeenCalledTimes(1);
      expect(historyMock.goBack).not.toHaveBeenCalled();
    });
  });

  describe('onUpdate', () => {
    // Query-level monitor
    test('calls updateMonitor with monitor', () => {
      // const monitor = alertingFakes.randomMonitor();
      // const trigger = alertingFakes.randomTrigger(TRIGGER_TYPE.QUERY_LEVEL);
      // monitor.triggers = [trigger];
      //
      // submitValuesToMonitor(FORMIK_INITIAL_VALUES, )
      const monitor = formikToMonitor(FORMIK_INITIAL_VALUES);
      const wrapper = shallow(
        <CreateMonitor
          httpClient={httpClientMock}
          edit={true}
          history={historyMock}
          setFlyout={setFlyout}
          updateMonitor={updateMonitor}
          monitorToEdit={null}
          match={match}
          location={location}
          notifications={coreMock.notifications}
        />
      );
      wrapper.instance().onSubmit(FORMIK_INITIAL_VALUES, formikBag);
      expect(updateMonitor).toHaveBeenCalledTimes(1);
      expect(updateMonitor).toHaveBeenCalledWith(monitor);
    });

    test('logs error when updateMonitor rejects', async () => {
      const error = jest.spyOn(global.console, 'error');
      updateMonitor.mockRejectedValue(new Error('updateMonitor error'));
      const wrapper = shallow(
        <CreateMonitor
          httpClient={httpClientMock}
          edit={true}
          history={historyMock}
          setFlyout={setFlyout}
          updateMonitor={updateMonitor}
          monitorToEdit={null}
          match={match}
          location={location}
          notifications={coreMock.notifications}
        />
      );
      await wrapper.instance().onSubmit(FORMIK_INITIAL_VALUES, formikBag);
      expect(error).toHaveBeenCalled();
    });

    test('logs resp when ok:false', async () => {
      const log = jest.spyOn(global.console, 'log');
      updateMonitor.mockResolvedValue({ ok: false, resp: 'test' });
      const wrapper = shallow(
        <CreateMonitor
          httpClient={httpClientMock}
          edit={true}
          history={historyMock}
          setFlyout={setFlyout}
          updateMonitor={updateMonitor}
          monitorToEdit={null}
          match={match}
          location={location}
          notifications={coreMock.notifications}
        />
      );
      await wrapper.instance().onSubmit(FORMIK_INITIAL_VALUES, formikBag);
      await new Promise((r) => setTimeout(r, 100));
      expect(log).toHaveBeenCalled();
      expect(log).toHaveBeenCalledWith('Failed to update:', { ok: false, resp: 'test' });
    });
  });

  describe('onCreate', () => {
    test('calls post with monitor', () => {
      const monitor = formikToMonitor(FORMIK_INITIAL_VALUES);
      httpClientMock.post.mockResolvedValue({ ok: true, resp: { _id: 'id' } });
      const wrapper = shallow(
        <CreateMonitor
          httpClient={httpClientMock}
          history={historyMock}
          setFlyout={setFlyout}
          match={match}
          location={location}
          notifications={coreMock.notifications}
        />
      );
      wrapper.instance().onSubmit(FORMIK_INITIAL_VALUES, formikBag);
      expect(httpClientMock.post).toHaveBeenCalledTimes(1);
      expect(httpClientMock.post).toHaveBeenCalledWith('../api/alerting/monitors', {
        body: JSON.stringify(monitor),
      });
    });

    test('logs error when updateMonitor rejects', async () => {
      const error = jest.spyOn(global.console, 'error');
      httpClientMock.post.mockRejectedValue(new Error('onCreate error'));
      const wrapper = shallow(
        <CreateMonitor
          httpClient={httpClientMock}
          history={historyMock}
          setFlyout={setFlyout}
          match={match}
          location={location}
          notifications={coreMock.notifications}
        />
      );
      await wrapper.instance().onSubmit(FORMIK_INITIAL_VALUES, formikBag);
      expect(error).toHaveBeenCalled();
    });

    test('logs resp when ok:false', async () => {
      const log = jest.spyOn(global.console, 'log');
      httpClientMock.post.mockResolvedValue({ ok: false, resp: 'test' });
      const wrapper = shallow(
        <CreateMonitor
          httpClient={httpClientMock}
          history={historyMock}
          setFlyout={setFlyout}
          match={match}
          location={location}
          notifications={coreMock.notifications}
        />
      );
      await wrapper.instance().onSubmit(FORMIK_INITIAL_VALUES, formikBag);
      await new Promise((r) => setTimeout(r, 100));
      expect(log).toHaveBeenCalled();
      expect(log).toHaveBeenCalledWith('Failed to create:', { ok: false, resp: 'test' });
    });
  });
});
