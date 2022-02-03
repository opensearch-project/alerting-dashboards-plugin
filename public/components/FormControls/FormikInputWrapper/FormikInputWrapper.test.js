/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from 'enzyme';
import { Formik } from 'formik';

import FormikInputWrapper from './FormikInputWrapper';

describe('FormikInputWrapper', () => {
  test('renders', () => {
    const component = (
      <Formik>
        <FormikInputWrapper name="testing" fieldProps={{}} render={() => <div>test</div>} />
      </Formik>
    );

    expect(render(component)).toMatchSnapshot();
  });
});
