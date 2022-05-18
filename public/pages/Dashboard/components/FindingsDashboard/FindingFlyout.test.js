/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from 'enzyme';
import { Formik } from 'formik';
import FindingFlyout from './FindingFlyout';

describe('FindingFlyout', () => {
  test('renders', () => {
    const component = (
      <Formik>
        <FindingFlyout />
      </Formik>
    );
    expect(render(component)).toMatchSnapshot();
  });
});
