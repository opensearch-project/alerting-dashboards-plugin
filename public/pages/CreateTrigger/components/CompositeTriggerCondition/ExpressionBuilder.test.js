/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from 'enzyme';

import { Formik } from 'formik';
import { FORMIK_INITIAL_VALUES } from '../../../CreateMonitor/containers/CreateMonitor/utils/constants';
import ExpressionBuilder from './ExpressionBuilder';

describe('ExpressionBuilder', () => {
  test('renders', () => {
    const component = (
      <Formik initialValues={FORMIK_INITIAL_VALUES} onSubmit={() => {}}>
        <ExpressionBuilder
          formikFieldPath={'path'}
          formikFieldName={'triggerCondition'}
          values={{
            triggerDefinitions: [],
          }}
          touched={{}}
          httpClient={{}}
        />
      </Formik>
    );
    expect(render(component)).toMatchSnapshot();
  });
});
