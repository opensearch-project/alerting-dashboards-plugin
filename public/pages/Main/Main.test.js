/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Router, Route, HashRouter } from 'react-router-dom';
import { render as enzymeRender } from 'enzyme';
import { render, waitFor } from '@testing-library/react';
import * as Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs';
import { createMemoryHistory } from 'history';

import Main from './Main';
import { setupCoreStart } from '../../../test/utils/helpers';

beforeAll(() => {
  setupCoreStart();
});

describe('Main', () => {
  test('renders', () => {
    const component = (
      <HashRouter>
        <Route render={(props) => <Main httpClient={{}} {...props} />} />
      </HashRouter>
    );

    expect(enzymeRender(component)).toMatchSnapshot();
  });

  test('updates breadcrumbs when location updates', async () => {
    const getBreadcrumbs = jest.spyOn(Breadcrumbs, 'getBreadcrumbs');
    const history = createMemoryHistory();
    history.push('/');

    const { rerender } = render(
      <Router history={history}>
        <Route render={(props) => <Main httpClient={{}} {...props} />} />
      </Router>
    );

    expect(getBreadcrumbs).toHaveBeenCalledTimes(1);

    history.push('/monitors');

    // Force re-render to trigger route change
    rerender(
      <Router history={history}>
        <Route render={(props) => <Main httpClient={{}} {...props} />} />
      </Router>
    );

    await waitFor(() => {
      expect(getBreadcrumbs).toHaveBeenCalledTimes(2);
    });
  });
});
