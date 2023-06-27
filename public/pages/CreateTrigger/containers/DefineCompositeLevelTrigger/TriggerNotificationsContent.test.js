/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from 'enzyme';

import { Formik } from 'formik';
import { FORMIK_INITIAL_VALUES } from '../../../CreateMonitor/containers/CreateMonitor/utils/constants';
import TriggerNotifications from './TriggerNotifications';
import TriggerNotificationsContent from './TriggerNotificationsContent';

describe('TriggerNotificationsContent', () => {
  test('renders without notifications', () => {
    const component = (
      <Formik initialValues={FORMIK_INITIAL_VALUES} onSubmit={() => {}}>
        <TriggerNotificationsContent
          action={{}}
          options={[]}
          actionIndex={0}
          triggerValues={FORMIK_INITIAL_VALUES}
          httpClient={{}}
          notifications={{}}
          hasNotifications={false}
        />
      </Formik>
    );
    expect(render(component)).toMatchSnapshot();
  });
  test('renders with notifications', () => {
    const component = (
      <Formik initialValues={FORMIK_INITIAL_VALUES} onSubmit={() => {}}>
        <TriggerNotificationsContent
          action={{}}
          options={[]}
          actionIndex={0}
          triggerValues={FORMIK_INITIAL_VALUES}
          httpClient={{}}
          notifications={{}}
          hasNotifications={true}
        />
      </Formik>
    );
    expect(render(component)).toMatchSnapshot();
  });
});
