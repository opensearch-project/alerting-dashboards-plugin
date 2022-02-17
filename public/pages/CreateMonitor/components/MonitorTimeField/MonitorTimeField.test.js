/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, mount } from 'enzyme';
import { Formik } from 'formik';

import MonitorTimeField from './MonitorTimeField';

describe('MonitorTimeField', () => {
  test('renders', () => {
    const component = (
      <Formik initialValues={{}} onSubmit={() => {}}>
        <MonitorTimeField dataTypes={{}} />
      </Formik>
    );

    expect(render(component)).toMatchSnapshot();
  });

  test.skip('displays no options', () => {
    const wrapper = mount(
      <Formik initialValues={{}} onSubmit={() => {}}>
        <MonitorTimeField dataTypes={{}} />
      </Formik>
    );
    // Default blank option
    expect(wrapper.find('select').props().children[1].length).toBe(1);
  });

  test.skip('displays options', () => {
    const wrapper = mount(
      <Formik initialValues={{}} onSubmit={() => {}}>
        <MonitorTimeField dataTypes={{ date: ['date1', 'date2', 'date3'] }} />
      </Formik>
    );
    // 3 options + default blank option
    expect(wrapper.find('select').props().children[1].length).toBe(4);
  });
});
