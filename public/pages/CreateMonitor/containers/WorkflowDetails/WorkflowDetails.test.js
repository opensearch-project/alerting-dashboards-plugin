/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from 'enzyme';

import { Formik } from 'formik';
import { FORMIK_INITIAL_VALUES } from '../CreateMonitor/utils/constants';
import WorkflowDetails from './WorkflowDetails';

describe('WorkflowDetails', () => {
  test('renders', () => {
    const component = (
      <Formik initialValues={FORMIK_INITIAL_VALUES} onSubmit={() => {}}>
        <WorkflowDetails isDarkMode={false} values={{}} httpClient={{}} errors={{}} />
      </Formik>
    );
    expect(render(component)).toMatchSnapshot();
  });
});
