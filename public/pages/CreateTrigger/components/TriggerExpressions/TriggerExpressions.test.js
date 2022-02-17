/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { mount, shallow } from 'enzyme';
import { EuiExpression } from '@elastic/eui';
import { Formik } from 'formik';

import TriggerExpressions, { Expressions } from './TriggerExpressions';

const props = {
  thresholdEnum: 'ABOVE',
  thresholdValue: 500,
};

describe('TriggerExpressions', () => {
  test('renders', () => {
    const wrapper = shallow(<TriggerExpressions {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});
