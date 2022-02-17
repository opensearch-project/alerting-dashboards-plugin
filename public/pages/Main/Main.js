/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import { Switch, Route } from 'react-router-dom';
import { CoreConsumer } from '../../utils/CoreContext';

import Home from '../Home';
import Breadcrumbs from '../../components/Breadcrumbs';
import CreateMonitor from '../CreateMonitor';
import MonitorDetails from '../MonitorDetails/containers/MonitorDetails';
import CreateDestination from '../Destinations/containers/CreateDestination';
import Flyout from '../../components/Flyout';
import { APP_PATH } from '../../utils/constants';

class Main extends Component {
  state = { flyout: null };

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

  render() {
    const { flyout } = this.state;
    const { history, ...rest } = this.props;
    return (
      <CoreConsumer>
        {(core) =>
          core && (
            <div style={{ padding: '15px 0px' }}>
              <Breadcrumbs history={history} httpClient={core.http} {...rest} />
              <Flyout
                flyout={flyout}
                onClose={() => {
                  this.setFlyout(null);
                }}
              />
              <Switch>
                <Route
                  path={APP_PATH.CREATE_MONITOR}
                  render={(props) => (
                    <CreateMonitor
                      httpClient={core.http}
                      setFlyout={this.setFlyout}
                      notifications={core.notifications}
                      isDarkMode={core.isDarkMode}
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
                    />
                  )}
                />
              </Switch>
            </div>
          )
        }
      </CoreConsumer>
    );
  }
}

export default Main;
