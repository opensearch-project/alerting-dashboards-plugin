/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from 'enzyme';

import { Formik } from 'formik';
import { FORMIK_INITIAL_VALUES } from '../../../containers/CreateMonitor/utils/constants';
import MonitorsEditor from './MonitorsEditor';

describe('MonitorsEditor', () => {
  test('renders', () => {
    const component = (
      <Formik initialValues={FORMIK_INITIAL_VALUES} onSubmit={() => {}}>
        <MonitorsEditor isDarkMode={false} values={{}} errors={{}} />
      </Formik>
    );
    expect(render(component)).toMatchSnapshot();
  });
});
