/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from 'enzyme';

import { Formik } from 'formik';
import CompositeTriggerCondition from './CompositeTriggerCondition';
import { FORMIK_INITIAL_VALUES } from '../../../CreateMonitor/containers/CreateMonitor/utils/constants';

describe('CompositeTriggerCondition', () => {
  test('renders', () => {
    const component = (
      <Formik initialValues={FORMIK_INITIAL_VALUES} onSubmit={() => {}}>
        <CompositeTriggerCondition
          label={'Trigger label'}
          formikFieldPath={'path'}
          formikFieldName={'triggerCondition'}
          values={{}}
          touched={{}}
          isDarkMode={false}
          httpClient={{}}
        />
      </Formik>
    );
    expect(render(component)).toMatchSnapshot();
  });
});
