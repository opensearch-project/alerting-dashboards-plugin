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

  test('displays no options', () => {
    const wrapper = mount(
      <Formik initialValues={{}} onSubmit={() => {}}>
        <MonitorTimeField dataTypes={{}} />
      </Formik>
    );
    // Default blank option
    expect(wrapper.find('EuiComboBox').props().options.length).toBe(0);
  });

  test('displays options', () => {
    const wrapper = mount(
      <Formik initialValues={{}} onSubmit={() => {}}>
        <MonitorTimeField dataTypes={{ date: ['date1', 'date2', 'date3'] }} />
      </Formik>
    );
    // 3 options
    expect(wrapper.find('EuiComboBox').props().options.length).toBe(3);
  });

  test('displays options includes date_nanos', () => {
    const wrapper = mount(
      <Formik initialValues={{}} onSubmit={() => {}}>
        <MonitorTimeField
          dataTypes={{ date: ['date1', 'date2', 'date3'], date_nanos: ['date_nanos1'] }}
        />
      </Formik>
    );
    expect(wrapper).toMatchSnapshot();

    // 4 options
    expect(wrapper.find('EuiComboBox').props().options.length).toBe(4);
    expect(wrapper.find('EuiComboBox').props().options).toEqual(
      expect.arrayContaining([{ label: 'date_nanos1' }])
    );
  });
});
