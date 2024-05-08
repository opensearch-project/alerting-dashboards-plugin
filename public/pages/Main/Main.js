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
  getDataSourceEnabled,
} from '../../../public/services';

class Main extends Component {
  static contextType = CoreContext;
  state = {
    flyout: null,
    selectedDataSourceId: undefined,
    dataSourceLoading: this.props.dataSourceEnabled,
  };
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
    if (this.props.dataSourceEnabled && this.state.dataSourceLoading) {
      this.setState({
        dataSourceLoading: false,
      });
    }
  };

  renderDataSourceComponent(dataSourceType) {
    const { setActionMenu } = this.props;
    const componentConfig = {
      fullWidth: false,
      activeOption: this.state.dataSourceLoading
        ? undefined
        : [{ id: this.state.selectedDataSourceId }],
      savedObjects: getSavedObjectsClient(),
      notifications: getNotifications(),
    };
    if (dataSourceType === 'DataSourceSelectable') {
      componentConfig.onSelectedDataSources = this.handleDataSourceChange; // Remove parentheses
    }

    const DataSourceMenu = getDataSourceManagementPlugin()?.ui.getDataSourceMenu();

    return (
      <DataSourceMenu
        setMenuMountPoint={setActionMenu}
        componentType={dataSourceType}
        componentConfig={componentConfig}
      />
    );
  }

  render() {
    const { flyout } = this.state;
    const { history, dataSourceEnabled, ...rest } = this.props;
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
                    {dataSourceEnabled && (
                      <>
                        <Switch>
                          <Route
                            path={['/monitors/:monitorId', '/destinations/:destinationId']}
                            render={(props) => this.renderDataSourceComponent('DataSourceView')}
                          />
                          <Route
                            path={[APP_PATH.CREATE_MONITOR, APP_PATH.CREATE_DESTINATION]}
                            render={(props) =>
                              this.renderDataSourceComponent('DataSourceSelectable')
                            }
                          />
                          <Route
                            render={() => this.renderDataSourceComponent('DataSourceSelectable')}
                          />
                        </Switch>
                      </>
                    )}
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
                            landingDataSourceId={this.state.selectedDataSourceId}
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
                            {...props}
                            landingDataSourceId={this.state.selectedDataSourceId}
                          />
                        )}
                      />
                      {!this.state.dataSourceLoading && (
                        <Route
                          render={(props) => (
                            <Home
                              httpClient={core.http}
                              {...props}
                              setFlyout={this.setFlyout}
                              notifications={core.notifications}
                              landingDataSourceId={this.state.selectedDataSourceId}
                            />
                          )}
                        />
                      )}
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
