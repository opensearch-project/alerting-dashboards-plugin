/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from 'enzyme';
import { Formik } from 'formik';

import FormikCheckbox from './FormikCheckbox';

describe('FormikCheckbox', () => {
  test('render formRow', () => {
    const component = (
      <Formik>
        <FormikCheckbox name="testing" formRow />
      </Formik>
    );

    expect(render(component)).toMatchSnapshot();
  });

  test('render', () => {
    const component = (
      <Formik>
        <FormikCheckbox name="testing" />
      </Formik>
    );

    expect(render(component)).toMatchSnapshot();
  });
});
