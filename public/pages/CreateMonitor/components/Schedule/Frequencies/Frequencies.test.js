/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Formik } from 'formik';
import { render } from 'enzyme';

import { FORMIK_INITIAL_VALUES } from '../../../containers/CreateMonitor/utils/constants';
import Frequency from './Frequency';
import Interval from './Interval';
import Monthly from './Monthly';
import CustomCron from './CustomCron';
import FrequencyPicker from './FrequencyPicker';

describe('Frequencies', () => {
  test('renders Frequency', () => {
    const component = <Formik initialValues={FORMIK_INITIAL_VALUES} render={() => <Frequency />} />;

    expect(render(component)).toMatchSnapshot();
  });

  test('renders Interval', () => {
    const component = <Formik initialValues={FORMIK_INITIAL_VALUES} render={() => <Interval />} />;

    expect(render(component)).toMatchSnapshot();
  });

  test.skip('renders Monthly', () => {
    const component = <Formik initialValues={FORMIK_INITIAL_VALUES} render={() => <Monthly />} />;

    expect(render(component)).toMatchSnapshot();
  });

  test('renders CustomCron', () => {
    const component = (
      <Formik initialValues={FORMIK_INITIAL_VALUES} render={() => <CustomCron />} />
    );

    expect(render(component)).toMatchSnapshot();
  });

  test('renders FrequencyPicker', () => {
    const component = (
      <Formik initialValues={FORMIK_INITIAL_VALUES} render={() => <FrequencyPicker />} />
    );

    expect(render(component)).toMatchSnapshot();
  });
});
