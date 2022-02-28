/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from 'enzyme';
import { Formik } from 'formik';

import MonitorDefinition from './MonitorDefinition';

describe('MonitorDefinition', () => {
  test('renders', () => {
    const component = (
      <Formik>
        <MonitorDefinition resetResponse={() => {}} />
      </Formik>
    );
    expect(render(component)).toMatchSnapshot();
  });
});
