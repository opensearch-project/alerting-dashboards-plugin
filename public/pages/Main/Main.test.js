/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Router, Route, HashRouter } from 'react-router-dom';
import { render, mount } from 'enzyme';
import * as Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs';
import { createMemoryHistory } from 'history';

import Main from './Main';

describe('Main', () => {
  test('renders', () => {
    const component = (
      <HashRouter>
        <Route render={(props) => <Main httpClient={{}} {...props} />} />
      </HashRouter>
    );

    expect(render(component)).toMatchSnapshot();
  });

  test('updates breadcrumbs when location updates', () => {
    const getBreadcrumbs = jest.spyOn(Breadcrumbs, 'getBreadcrumbs');
    const history = createMemoryHistory();
    history.push('/');
    mount(
      <Router history={history}>
        <Route render={(props) => <Main httpClient={{}} {...props} />} />
      </Router>
    );

    expect(getBreadcrumbs).toHaveBeenCalledTimes(1);
    history.push('/monitors');
    expect(getBreadcrumbs).toHaveBeenCalledTimes(2);
  });
});
