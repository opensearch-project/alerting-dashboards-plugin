/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from 'enzyme';

import { Formik } from 'formik';
import { FORMIK_INITIAL_VALUES } from '../../../CreateMonitor/containers/CreateMonitor/utils/constants';
import NotificationConfigDialog from './NotificationConfigDialog';
import { uiSettingsServiceMock } from '../../../../../../../src/core/public/mocks';
import { setUISettings } from '../../../../services';

describe('NotificationConfigDialog', () => {
  test('renders', () => {
    const uiSettingsMock = uiSettingsServiceMock.createStartContract();
    uiSettingsMock.get.mockReturnValue('America/Toronto');
    setUISettings(uiSettingsMock);
    const component = (
      <Formik initialValues={FORMIK_INITIAL_VALUES} onSubmit={() => {}}>
        <NotificationConfigDialog
          closeModal={() => {}}
          triggerValues={FORMIK_INITIAL_VALUES}
          httpClient={{}}
          notifications={{}}
          actionIndex={0}
        />
      </Formik>
    );
    expect(render(component)).toMatchSnapshot();
  });
});
