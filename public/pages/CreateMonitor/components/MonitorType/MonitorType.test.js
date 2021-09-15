/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import React from 'react';
import { render } from 'enzyme';

import MonitorType from './MonitorType';
import { Formik } from 'formik';
import { FORMIK_INITIAL_VALUES } from '../../containers/CreateMonitor/utils/constants';

describe('MonitorType', () => {
  test('renders', () => {
    const component = (
      <Formik initialValues={FORMIK_INITIAL_VALUES}>{() => <MonitorType values={{}} />}</Formik>
    );

    expect(render(component)).toMatchSnapshot();
  });
});
