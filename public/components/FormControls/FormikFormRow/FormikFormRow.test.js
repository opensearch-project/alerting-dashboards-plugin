/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from 'enzyme';

import FormikFormRow from './FormikFormRow';

describe('FormikFormRow', () => {
  const Child = () => <div id="mine">child</div>;
  test('renders', () => {
    const component = (
      <FormikFormRow name="testing" rowProps={{}} form={{}}>
        <Child />
      </FormikFormRow>
    );

    expect(render(component)).toMatchSnapshot();
  });
});
