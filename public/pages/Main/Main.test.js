/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HashRouter as Router, Route } from 'react-router-dom';
import { render } from 'enzyme';

import Main from './Main';

describe('Main', () => {
  test('renders', () => {
    const component = (
      <Router>
        <Route render={(props) => <Main httpClient={{}} {...props} />} />
      </Router>
    );

    expect(render(component)).toMatchSnapshot();
  });
});
