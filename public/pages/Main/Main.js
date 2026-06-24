/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import { Switch, Route } from 'react-router-dom';
import { CoreConsumer, CoreContext } from '../../utils/CoreContext';
import Home from '../Home';
import CreateMonitor from '../CreateMonitor';
import MonitorDetails from '../MonitorDetails/containers/MonitorDetails';
import CreateDestination from '../Destinations/containers/CreateDestination';
import Flyout from '../../components/Flyout';
import { APP_PATH } from '../../utils/constants';
import {
  ServicesConsumer,
  getDataSourceManagementPlugin,
  getDataSourceMetadata,
  getNotifications,
  getSavedObjectsClient,
  setDataSource,
  setDataSourceMetadata,
  isServerlessDataSource,
} from '../../services';
import { getBreadcrumbs } from '../../components/Breadcrumbs/Breadcrumbs';
import { MultiDataSourceContext } from '../../utils/MultiDataSourceContext';
import { parseQueryStringAndGetDataSource } from '../utils/helpers';
import { dataSourceObservable } from '../utils/constants';
import { dataSourceFilterFn, isMustangDomain, prefetchMustangStatus } from '../../utils/helpers';

class Main extends Component {
  static contextType = CoreContext;
  state = {
    flyout: null,
    selectedDataSourceId: undefined,
    dataSourceLoading: this.props.dataSourceEnabled,
    dataSourceEndpoint: '',
  };
  async componentDidMount() {
    if (this.context) {
      this.updateBreadcrumbs();
    }
    if (this.props.dataSourceEnabled) {
      try {
        const allDataSources = await getSavedObjectsClient().find({
          type: 'data-source',
          perPage: 1000,
        });
        await prefetchMustangStatus(this.context?.http, allDataSources.savedObjects || []);
      } catch (e) {
        /* ignore - filter will fall back to default behavior */
      }
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

  async resolveAndSetDataSource(dataSourceId) {
    setDataSource({ dataSourceId });
    let dataSourceEndpoint = '';
    let dataSourceLabel = '';
    try {
      const savedObject = await getSavedObjectsClient().get('data-source', dataSourceId);
      dataSourceEndpoint = savedObject?.attributes?.endpoint || '';
      dataSourceLabel = savedObject?.attributes?.title || '';
      setDataSourceMetadata({
        dataSourceVersion: savedObject?.attributes?.dataSourceVersion || '',
        dataSourceEngineType: savedObject?.attributes?.dataSourceEngineType || '',
        dataSourceLabel,
      });
      await prefetchMustangStatus(this.context?.http, [savedObject]);
      setDataSourceMetadata({
        ...getDataSourceMetadata(),
        isMustang: isMustangDomain(dataSourceId),
      });
    } catch (e) {
      setDataSourceMetadata({ dataSourceVersion: '', dataSourceEngineType: '' });
    }
    this.setState({ selectedDataSourceId: dataSourceId, dataSourceEndpoint });
  }

  async updateBreadcrumbs() {
    if (this.props.dataSourceEnabled && this.props.location) {
      const search = this.props.location?.search;
      const dataSourceId = parseQueryStringAndGetDataSource(
        search || this.props.location?.pathname
      );
      if (dataSourceId !== undefined) {
        if (this.state.selectedDataSourceId !== dataSourceId) {
          await this.resolveAndSetDataSource(dataSourceId);
        }
        if (this.state.dataSourceLoading) {
          this.setState({ dataSourceLoading: false });
        }
      }
    }
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

  handleDataSourceChange = async ([dataSource]) => {
    const dataSourceId = dataSource?.id;
    const dataSourceLabel = dataSource?.label;
    if (this.props.dataSourceEnabled && dataSourceId === undefined) {
      getNotifications().toasts.addDanger('Unable to set data source.');
    } else if (this.state.selectedDataSourceId !== dataSourceId) {
      await this.resolveAndSetDataSource(dataSourceId);
    }
    dataSourceObservable.next({ id: dataSourceId, label: dataSourceLabel });
    if (this.state.dataSourceLoading) {
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
        : [
            {
              id: this.state.selectedDataSourceId,
              label: getDataSourceMetadata()?.dataSourceLabel,
            },
          ],
      savedObjects: getSavedObjectsClient(),
      notifications: getNotifications(),
      dataSourceFilter: dataSourceFilterFn,
    };
    if (dataSourceType === 'DataSourceSelectable') {
      componentConfig.onSelectedDataSources = this.handleDataSourceChange;
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
    const isServerless = isServerlessDataSource();
    return (
      <CoreConsumer>
        {(core) =>
          core && (
            <ServicesConsumer>
              {(services) =>
                services && (
                  <MultiDataSourceContext.Provider
                    value={{ dataSourceId: this.state.selectedDataSourceId }}
                  >
                    <div>
                      <Flyout
                        flyout={flyout}
                        onClose={() => {
                          this.setFlyout(null);
                        }}
                      />
                      {dataSourceEnabled && (
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
                              services={core.services}
                              {...props}
                              landingDataSourceId={this.state.selectedDataSourceId}
                              dataSourceEndpoint={this.state.dataSourceEndpoint}
                              isServerless={isServerless}
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
                        {!this.state.dataSourceLoading && (
                          <Switch>
                            <Route
                              path="/monitors/:monitorId"
                              render={(props) => (
                                <MonitorDetails
                                  httpClient={core.http}
                                  setFlyout={this.setFlyout}
                                  notifications={core.notifications}
                                  isDarkMode={core.isDarkMode}
                                  notificationService={services.notificationService}
                                  services={core.services}
                                  {...props}
                                  landingDataSourceId={this.state.selectedDataSourceId}
                                  dataSourceEndpoint={this.state.dataSourceEndpoint}
                                  isServerless={isServerless}
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
                                  landingDataSourceId={this.state.selectedDataSourceId}
                                  defaultRoute={
                                    core.chrome?.navGroup?.getNavGroupEnabled()
                                      ? this.props.defaultRoute
                                      : undefined
                                  }
                                />
                              )}
                            />
                          </Switch>
                        )}
                      </Switch>
                    </div>
                  </MultiDataSourceContext.Provider>
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
