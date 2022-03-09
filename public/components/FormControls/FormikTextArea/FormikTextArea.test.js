/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from 'enzyme';
import { Formik } from 'formik';

import FormikTextArea from './FormikTextArea';

describe('FormikTextArea', () => {
  test('renders', () => {
    const component = (
      <Formik>
        <FormikTextArea name="testing" />
      </Formik>
    );

    expect(render(component)).toMatchSnapshot();
  });
});
