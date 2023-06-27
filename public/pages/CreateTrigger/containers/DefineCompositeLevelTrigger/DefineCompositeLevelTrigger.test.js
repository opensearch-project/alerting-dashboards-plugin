/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from 'enzyme';

import { Formik } from 'formik';
import { FORMIK_INITIAL_VALUES } from '../../../CreateMonitor/containers/CreateMonitor/utils/constants';
import DefineCompositeLevelTrigger from './DefineCompositeLevelTrigger';

describe('DefineCompositeLevelTrigger', () => {
  test('renders', () => {
    const component = (
      <Formik initialValues={FORMIK_INITIAL_VALUES} onSubmit={() => {}}>
        <DefineCompositeLevelTrigger
          isDarkMode={false}
          httpClient={{}}
          notifications={{}}
          notificationService={{}}
          plugins={{}}
          values={{}}
          touched={{}}
        />
      </Formik>
    );
    expect(render(component)).toMatchSnapshot();
  });
});
