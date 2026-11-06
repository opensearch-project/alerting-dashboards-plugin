/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from 'enzyme';

import MonitorDefinitionCard from './MonitorDefinitionCard';
import { Formik } from 'formik';
import { FORMIK_INITIAL_VALUES } from '../../containers/CreateMonitor/utils/constants';
import { OS_AD_PLUGIN } from '../../../../utils/constants';

describe('MonitorDefinitionCard', () => {
  test('renders without AD plugin', () => {
    const component = (
      <Formik initialValues={FORMIK_INITIAL_VALUES}>
        {() => <MonitorDefinitionCard values={{}} plugins={[]} />}
      </Formik>
    );

    expect(render(component)).toMatchSnapshot();
  });
  test('renders without AD plugin', () => {
    const component = (
      <Formik initialValues={FORMIK_INITIAL_VALUES}>
        {() => <MonitorDefinitionCard values={{}} plugins={[OS_AD_PLUGIN]} />}
      </Formik>
    );
    expect(render(component)).toMatchSnapshot();
  });
  // "Set up alerts" on a detector opens searchType=ad: whenever AD is available, the option must
  // be there, selected, whatever the data source.
  test('offers the anomaly detector option, selected, for searchType=ad', () => {
    const values = {
      ...FORMIK_INITIAL_VALUES,
      searchType: 'ad',
      monitor_type: 'query_level_monitor',
    };
    const component = (
      <Formik initialValues={values}>
        {() => <MonitorDefinitionCard values={values} plugins={[OS_AD_PLUGIN]} />}
      </Formik>
    );
    const html = render(component);
    expect(html.find('[data-test-subj="anomalyDetectorRadioCard"]')).toHaveLength(1);
    expect(html.find('#anomalyDetectorRadioCard').attr('checked')).toBe('checked');
  });
});
