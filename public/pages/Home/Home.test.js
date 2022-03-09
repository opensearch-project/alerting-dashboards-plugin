/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HashRouter as Router, Route } from 'react-router-dom';
import { render } from 'enzyme';

import Home from './Home';

describe('Home', () => {
  test('renders', () => {
    const component = (
      <Router>
        <Route render={(props) => <Home httpClient={{}} {...props} />} />
      </Router>
    );

    expect(render(component)).toMatchSnapshot();
  });
});
