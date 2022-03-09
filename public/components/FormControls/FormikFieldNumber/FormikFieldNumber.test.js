/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from 'enzyme';
import { Formik } from 'formik';

import FormikFieldNumber from './FormikFieldNumber';

describe('FormikFieldNumber', () => {
  test('renders', () => {
    const component = (
      <Formik>
        <FormikFieldNumber name="testing" />
      </Formik>
    );

    expect(render(component)).toMatchSnapshot();
  });
});
