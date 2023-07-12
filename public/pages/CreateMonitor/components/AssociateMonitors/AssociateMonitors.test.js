/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from 'enzyme';

import AssociateMonitors from './AssociateMonitors';
import { Formik } from 'formik';
import { FORMIK_INITIAL_VALUES } from '../../containers/CreateMonitor/utils/constants';

describe('AssociateMonitors', () => {
  test('renders', () => {
    const component = (
      <Formik initialValues={FORMIK_INITIAL_VALUES} onSubmit={() => {}}>
        <AssociateMonitors isDarkMode={false} values={{}} httpClient={{}} errors={{}} />
      </Formik>
    );
    expect(render(component)).toMatchSnapshot();
  });
});
