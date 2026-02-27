/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter as Router, Route } from 'react-router-dom';
import { Provider } from 'react-redux';

import 'react-vis/dist/style.css';
// TODO: review the CSS style and migrate the necessary style to SASS, as Less is not supported in OpenSearch Dashboards "new platform" anymore
// import './less/main.less';
import './app.scss';
import Main from './pages/Main';
import { CoreContext } from './utils/CoreContext';
import { ServicesContext, NotificationService, getDataSourceEnabled } from './services';
import { initManageChannelsUrl } from './utils/helpers';
import { OpenSearchDashboardsContextProvider } from '../../../src/plugins/opensearch_dashboards_react/public';
import { getAlertingStore } from './redux/store';
import { DatasetProvider } from './contexts';

export function renderApp(coreStart, depsStart, params, defaultRoute) {
  const isDarkMode = coreStart.uiSettings.get('theme:darkMode') || false;
  const http = coreStart.http;
  coreStart.chrome.setBreadcrumbs([{ text: 'Alerting' }]); // Set Breadcrumbs for the plugin
  const notificationService = new NotificationService(http);
  const services = { notificationService, data: depsStart?.data };
  const mdsProps = {
    setActionMenu: params.setHeaderActionMenu,
    dataSourceEnabled: getDataSourceEnabled()?.enabled,
  };

  const navProps = {
    defaultRoute: defaultRoute,
  };

  // Load Chart's dark mode CSS
  if (isDarkMode) {
    require('@elastic/charts/dist/theme_only_dark.css');
  } else {
    require('@elastic/charts/dist/theme_only_light.css');
  }

  initManageChannelsUrl(coreStart.http);

  // Initialize Redux store
  const store = getAlertingStore();

  const root = createRoot(params.element);
  root.render(
    <Provider store={store}>
      <OpenSearchDashboardsContextProvider services={{ ...coreStart, ...depsStart }}>
        <OpenSearchDashboardsContextProvider services={{ data: depsStart?.data }}>
          <DatasetProvider>
            <Router>
              <ServicesContext.Provider value={services}>
                <CoreContext.Provider
                  value={{
                    http: coreStart.http,
                    isDarkMode,
                    notifications: coreStart.notifications,
                    chrome: coreStart.chrome,
                    defaultRoute: defaultRoute,
                    data: depsStart?.data,
                    services: { ...coreStart, ...depsStart },
                  }}
                >
                  <Route
                    render={(props) => (
                      <Main title="Alerting" {...mdsProps} {...navProps} {...props} />
                    )}
                  />
                </CoreContext.Provider>
              </ServicesContext.Provider>
            </Router>
          </DatasetProvider>
        </OpenSearchDashboardsContextProvider>
      </OpenSearchDashboardsContextProvider>
    </Provider>
  );
  return () => root.unmount();
}
