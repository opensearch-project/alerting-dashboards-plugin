/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Formik } from 'formik';
import { render } from 'enzyme';

import { FORMIK_INITIAL_VALUES } from '../../../containers/CreateMonitor/utils/constants';
import OfExpression from './OfExpression';
import { DEFAULT_CLOSED_STATES } from '../MonitorExpressions';

describe('OfExpression', () => {
  test('renders', () => {
    const component = (
      <Formik initialValues={FORMIK_INITIAL_VALUES}>
        {(props) => (
          <OfExpression
            formik={props}
            openedStates={DEFAULT_CLOSED_STATES}
            openExpression={() => {}}
            closeExpression={() => {}}
            dataTypes={[]}
          />
        )}
      </Formik>
    );

    expect(render(component)).toMatchSnapshot();
  });
});
