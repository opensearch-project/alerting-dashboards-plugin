/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from 'enzyme';
import { Formik } from 'formik';

import FormikFieldPassword from './FormikFieldPassword';

describe('FormikFieldPassword', () => {
  test('renders', () => {
    const component = (
      <Formik>
        <FormikFieldPassword name="testing" />
      </Formik>
    );

    expect(render(component)).toMatchSnapshot();
  });
});
