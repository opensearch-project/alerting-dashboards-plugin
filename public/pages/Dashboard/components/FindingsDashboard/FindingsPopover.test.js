/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from 'enzyme';
import { Formik } from 'formik';
import FindingsPopover from './FindingsPopover';

describe('FindingsPopover', () => {
  test('renders', () => {
    const component = (
      <Formik>
        <FindingsPopover />
      </Formik>
    );
    expect(render(component)).toMatchSnapshot();
  });
});
