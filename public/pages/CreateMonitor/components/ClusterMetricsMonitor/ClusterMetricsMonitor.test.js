/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from 'enzyme';
import { Formik } from 'formik';

import ClusterMetricsMonitor from './ClusterMetricsMonitor';

describe('ClusterMetricsMonitor', () => {
  test('renders', () => {
    const component = (
      <Formik>
        <ClusterMetricsMonitor values={{ searchType: 'clusterMetrics' }} />
      </Formik>
    );
    expect(render(component)).toMatchSnapshot();
  });
});
