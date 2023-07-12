/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from 'enzyme';

import { Formik } from 'formik';
import { FORMIK_INITIAL_VALUES } from '../../../containers/CreateMonitor/utils/constants';
import MonitorsList from './MonitorsList';

describe('MonitorsList', () => {
  test('renders', () => {
    const component = (
      <Formik initialValues={FORMIK_INITIAL_VALUES} onSubmit={() => {}}>
        <MonitorsList values={{}} httpClient={{}} />
      </Formik>
    );
    expect(render(component)).toMatchSnapshot();
  });
});
