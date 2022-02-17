/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from 'enzyme';
import { Formik } from 'formik';

import MonitorState from './MonitorState';

describe('MonitorState', () => {
  test('renders', () => {
    const component = (
      <Formik>
        <MonitorState />
      </Formik>
    );

    expect(render(component)).toMatchSnapshot();
  });
});
