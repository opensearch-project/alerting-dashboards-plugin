/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, useMemo } from 'react';
import { Switch, Route } from 'react-router-dom';
import { CoreConsumer, CoreContext } from '../../utils/CoreContext';
import Home from '../Home';
import CreateMonitor from '../CreateMonitor';
import MonitorDetails from '../MonitorDetails/containers/MonitorDetails';
import CreateDestination from '../Destinations/containers/CreateDestination';
import Flyout from '../../components/Flyout';
import { APP_PATH } from '../../utils/constants';
import { ServicesConsumer, getDataSource } from '../../services';
import { getBreadcrumbs } from '../../components/Breadcrumbs/Breadcrumbs';
import {
  getDataSourceManagementPlugin,
  getNotifications,
  getSavedObjectsClient,
  setDataSource,
} from '../../../public/services';

class Main extends Component {
  static contextType = CoreContext;
  state = { flyout: null };
  async componentDidMount() {
    if (this.context) {
      this.updateBreadcrumbs();
    }
  }

  async componentDidUpdate(prevProps) {
    const {
      location: { pathname: prevPathname, search: prevSearch },
    } = prevProps;
    const {
      location: { pathname, search },
    } = this.props;
    if (this.context && prevPathname + prevSearch !== pathname + search) {
      this.updateBreadcrumbs();
    }
  }

  async updateBreadcrumbs() {
    const breadcrumbs = await getBreadcrumbs(
      this.context.http,
      this.props.history,
      this.props.location
    );
    this.context.chrome?.setBreadcrumbs(breadcrumbs);
  }

  // TODO: Want to move this to redux store so we don't have to pass down setFlyout through components
  setFlyout = (flyout) => {
    const { flyout: currentFlyout } = this.state;
    // If current flyout and new flyout are same type, set to null to mimic closing flyout when clicking on same button
    if (currentFlyout && flyout && currentFlyout.type === flyout.type) {
      this.setState({ flyout: null });
    } else {
      this.setState({ flyout });
    }
  };

  handleDataSourceChange = ([dataSources]) => {
    const dataSourceId = dataSources?.id;
    if (this.props.dataSourceEnabled && dataSourceId === undefined) {
      getNotifications().toasts.addDanger('Unable to set data source.');
    } else if (this.state.selectedDataSourceId != dataSourceId) {
      this.setState({
        selectedDataSourceId: dataSourceId,
      });
      setDataSource({ dataSourceId });
    }
  };

  renderDataSourceComponent() {
    const { setActionMenu } = this.props;
    const DataSourceMenu = getDataSourceManagementPlugin()?.ui.getDataSourceMenu();
    const componentConfig = {
      fullWidth: false,
      activeOption:
        this.state.selectedDataSourceId === undefined
          ? undefined
          : [{ id: this.state.selectedDataSourceId }],
      savedObjects: getSavedObjectsClient(),
      notifications: getNotifications(),
      onSelectedDataSources: (dataSources) => this.handleDataSourceChange(dataSources),
    };

    return (
      <DataSourceMenu
        setMenuMountPoint={setActionMenu}
        componentType={'DataSourceSelectable'}
        componentConfig={componentConfig}
      />
    );
  }
  render() {
    const { flyout } = this.state;
    const { history, dataSourceEnabled, ...rest } = this.props;
    let renderDataSourceComponent = null;
    if (dataSourceEnabled) {
      renderDataSourceComponent = this.renderDataSourceComponent();
    }
    return (
      <CoreConsumer>
        {(core) =>
          core && (
            <ServicesConsumer>
              {(services) =>
                services && (
                  <div style={{ padding: '15px 0px' }}>
                    <Flyout
                      flyout={flyout}
                      onClose={() => {
                        this.setFlyout(null);
                      }}
                    />
                    {dataSourceEnabled && renderDataSourceComponent}
                    <Switch>
                      <Route
                        path={APP_PATH.CREATE_MONITOR}
                        render={(props) => (
                          <CreateMonitor
                            httpClient={core.http}
                            setFlyout={this.setFlyout}
                            notifications={core.notifications}
                            isDarkMode={core.isDarkMode}
                            notificationService={services.notificationService}
                            {...props}
                          />
                        )}
                      />
                      <Route
                        path={APP_PATH.CREATE_DESTINATION}
                        render={(props) => (
                          <CreateDestination
                            httpClient={core.http}
                            setFlyout={this.setFlyout}
                            notifications={core.notifications}
                            landingDataSourceId={this.state?.selectedDataSourceId}
                            {...props}
                          />
                        )}
                      />
                      <Route
                        path="/destinations/:destinationId"
                        render={(props) => (
                          <CreateDestination
                            httpClient={core.http}
                            setFlyout={this.setFlyout}
                            notifications={core.notifications}
                            setActionMenu={setActionMenu}
                            landingDataSourceId={this.state?.selectedDataSourceId}
                            {...props}
                            edit
                          />
                        )}
                      />
                      <Route
                        path="/monitors/:monitorId"
                        render={(props) => (
                          <MonitorDetails
                            httpClient={core.http}
                            setFlyout={this.setFlyout}
                            notifications={core.notifications}
                            isDarkMode={core.isDarkMode}
                            notificationService={services.notificationService}
                            landingDataSourceId={this.state?.selectedDataSourceId}
                            {...props}
                          />
                        )}
                      />
                      <Route
                        render={(props) => (
                          <Home
                            httpClient={core.http}
                            {...props}
                            setFlyout={this.setFlyout}
                            notifications={core.notifications}
                            landingDataSourceId={this.state?.selectedDataSourceId}
                          />
                        )}
                      />
                    </Switch>
                  </div>
                )
              }
            </ServicesConsumer>
          )
        }
      </CoreConsumer>
    );
  }
}

export default Main;
