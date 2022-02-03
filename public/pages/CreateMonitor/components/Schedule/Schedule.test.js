/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Formik } from 'formik';
import { render } from 'enzyme';

import { FORMIK_INITIAL_VALUES } from '../../containers/CreateMonitor/utils/constants';
import Schedule from './Schedule';

describe.skip('Schedule', () => {
  test('renders', () => {
    const component = <Formik initialValues={FORMIK_INITIAL_VALUES} render={() => <Schedule />} />;

    expect(render(component)).toMatchSnapshot();
  });
});
