/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Formik } from 'formik';
import { render } from 'enzyme';

import { FORMIK_INITIAL_VALUES } from '../../../containers/CreateMonitor/utils/constants';
import ForExpression from './ForExpression';
import { DEFAULT_CLOSED_STATES } from '../MonitorExpressions';

describe('ForExpression', () => {
  test('renders', () => {
    const component = (
      <Formik initialValues={FORMIK_INITIAL_VALUES}>
        {(props) => (
          <ForExpression
            formik={props}
            openedStates={DEFAULT_CLOSED_STATES}
            openExpression={() => {}}
            closeExpression={() => {}}
          />
        )}
      </Formik>
    );

    expect(render(component)).toMatchSnapshot();
  });
});
