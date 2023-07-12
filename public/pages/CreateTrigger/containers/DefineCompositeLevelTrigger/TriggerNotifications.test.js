/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from 'enzyme';

import { Formik } from 'formik';
import { FORMIK_INITIAL_VALUES } from '../../../CreateMonitor/containers/CreateMonitor/utils/constants';
import TriggerNotifications from './TriggerNotifications';

describe('TriggerNotifications', () => {
  test('renders', () => {
    const component = (
      <Formik initialValues={FORMIK_INITIAL_VALUES} onSubmit={() => {}}>
        <TriggerNotifications
          httpClient={{}}
          triggerActions={[]}
          plugins={{}}
          notifications={{}}
          notificationService={{}}
          triggerValues={FORMIK_INITIAL_VALUES}
        />
      </Formik>
    );
    expect(render(component)).toMatchSnapshot();
  });
});
