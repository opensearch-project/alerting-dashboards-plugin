/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from 'enzyme';

import { Formik } from 'formik';
import { FORMIK_INITIAL_VALUES } from '../../../CreateMonitor/containers/CreateMonitor/utils/constants';
import NotificationConfigDialog from './NotificationConfigDialog';

describe('NotificationConfigDialog', () => {
  test('renders', () => {
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
