/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from 'enzyme';
import { Formik } from 'formik';

import FormikSelect from './FormikSelect';

describe('FormikSelect', () => {
  test('renders', () => {
    const component = (
      <Formik>
        <FormikSelect name="testing" inputProps={{ options: [{ value: 'test', text: 'test' }] }} />
      </Formik>
    );

    expect(render(component)).toMatchSnapshot();
  });
});
