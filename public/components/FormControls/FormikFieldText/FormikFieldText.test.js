/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from 'enzyme';
import { Formik } from 'formik';

import FormikFieldText from './FormikFieldText';

describe('FormikFieldText', () => {
  test('renders', () => {
    const component = (
      <Formik>
        <FormikFieldText name="testing" />
      </Formik>
    );

    expect(render(component)).toMatchSnapshot();
  });
});
