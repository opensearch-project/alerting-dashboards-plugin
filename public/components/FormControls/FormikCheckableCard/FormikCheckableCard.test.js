/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from 'enzyme';
import { Formik } from 'formik';

import FormikCheckableCard from './FormikCheckableCard';

describe('FormikCheckableCard', () => {
  test('render formRow', () => {
    const component = (
      <Formik>
        <FormikCheckableCard name="testing" formRow />
      </Formik>
    );

    expect(render(component)).toMatchSnapshot();
  });

  test('render', () => {
    const component = (
      <Formik>
        <FormikCheckableCard name="testing" />
      </Formik>
    );

    expect(render(component)).toMatchSnapshot();
  });
});
