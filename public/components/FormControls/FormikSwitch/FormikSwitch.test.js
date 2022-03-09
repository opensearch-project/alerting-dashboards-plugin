/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from 'enzyme';
import { Formik } from 'formik';

import FormikSwitch from './FormikSwitch';

describe('FormikSwitch', () => {
  test('renders', () => {
    const component = (
      <Formik>
        <FormikSwitch name="testing" />
      </Formik>
    );

    expect(render(component)).toMatchSnapshot();
  });
});
