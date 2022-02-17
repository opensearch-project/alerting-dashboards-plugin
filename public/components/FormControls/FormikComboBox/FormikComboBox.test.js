/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from 'enzyme';
import { Formik } from 'formik';

import FormikComboBox from './FormikComboBox';

describe.skip('FormikComboBox', () => {
  test('renders', () => {
    const component = (
      <Formik>
        <FormikComboBox name="testing" />
      </Formik>
    );

    expect(render(component)).toMatchSnapshot();
  });
});
