/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  uiSettingsServiceMock,
  notificationServiceMock,
  httpServiceMock,
} from '../../../../../../../src/core/public/mocks';
import { shallow } from 'enzyme';
import CreateNew from './CreateNew';
import { setClient, setUISettings, setNotifications } from '../../../../services';
import { getInitialValues } from '../../../../pages/CreateMonitor/containers/CreateMonitor/utils/helpers';

describe('CreateNew', () => {
  const uiSettingsMock = uiSettingsServiceMock.createStartContract();
  setUISettings(uiSettingsMock);
  const notifications = notificationServiceMock.createStartContract();
  setNotifications(notifications);
  const httpClient = httpServiceMock.createStartContract();
  setClient(httpClient);
  test('renders', () => {
    const location = { pathname: '/create-monitor', search: '', hash: '', state: undefined };
    const title = 'title';
    const index = 'index';
    const timeField = 'timeField';
    const flyoutMode = 'create';
    const searchType = flyoutMode === 'adMonitor' ? SEARCH_TYPE.AD : '';

    const initalValues = getInitialValues({
      location,
      title,
      index,
      timeField,
      flyoutMode,
      searchType,
      detectorId: null,
      embeddable: null,
    });
    const formikProps = {
      values: initalValues,
      errors: {},
      touched: {},
      isSubmitting: false,
      isValid: false,
    };
    const wrapper = shallow(
      <CreateNew
        {...{
          formikProps,
          embeddable: { getTitle: () => title, vis: { params: {} } },
          core: { http: {} },
        }}
      />
    );
    expect(wrapper).toMatchSnapshot();
  });
});
