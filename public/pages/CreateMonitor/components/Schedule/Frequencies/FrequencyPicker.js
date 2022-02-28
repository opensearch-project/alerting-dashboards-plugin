/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { connect } from 'formik';

import CustomCron from './CustomCron';
import Daily from './Daily';
import Interval from './Interval';
import Monthly from './Monthly';
import Weekly from './Weekly';

const components = {
  daily: Daily,
  weekly: Weekly,
  monthly: Monthly,
  cronExpression: CustomCron,
  interval: Interval,
};

const FrequencyPicker = (props) => {
  const type = props.formik.values.frequency;
  const Component = components[type];
  return <Component />;
};

export default connect(FrequencyPicker);
