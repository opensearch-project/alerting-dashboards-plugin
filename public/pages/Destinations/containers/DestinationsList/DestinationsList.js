/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import PropTypes from 'prop-types';
import {
  EuiBasicTable,
  EuiCallOut,
  EuiHorizontalRule,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import queryString from 'query-string';
import _ from 'lodash';
import ContentPanel from '../../../../components/ContentPanel';
import {
  EmptyDestinations,
  DestinationsActions,
  DestinationsControls,
  DeleteConfirmation,
} from '../../components/DestinationsList';
import { staticColumns } from './utils/constants';
import { getURLQueryParams } from './utils/helpers';
import { isDeleteAllowedQuery } from './utils/deleteHelpers';
import { INDEX } from '../../../../../utils/constants';
import { DESTINATION_ACTIONS, OS_NOTIFICATION_PLUGIN } from '../../../../utils/constants';
import ManageSenders from '../CreateDestination/ManageSenders';
import ManageEmailGroups from '../CreateDestination/ManageEmailGroups';
import { getAllowList } from '../../utils/helpers';
import { DESTINATION_TYPE } from '../../utils/constants';
import { backendErrorNotification } from '../../../../utils/helpers';
import NotificationsInfoCallOut from '../../components/NotificationsInfoCallOut';
import FullPageNotificationsInfoCallOut from '../../components/FullPageNotificationsInfoCallOut';

class DestinationsList extends React.Component {
  constructor(props) {
    super(props);

    const { from, size, search, sortField, sortDirection, type } = getURLQueryParams(
      props.location
    );

    this.state = {
      showDeleteConfirmation: false,
      isDestinationLoading: true,
      destinations: [],
      destinationToDelete: undefined,
      totalDestinations: 0,
      page: Math.floor(from / size),
      queryParams: {
        size,
        search,
        sortField,
        sortDirection,
        type,
      },
      selectedItems: [],
      allowList: [],
      showManageSenders: false,
      showManageEmailGroups: false,
      hasNotificationPlugin: false,
    };

    this.columns = [
      ...staticColumns,
      {
        name: 'Actions',
        width: '35px',
        actions: [
          {
            // Editing Destinations is now disabled since Destinations are deprecated
            // and will automatically be migrated to Notifications Channels
            name: 'View',
            description: 'View this destination.',
            onClick: this.handleEditDestination,
          },
        ],
      },
    ];

    this.getPlugins = this.getPlugins.bind(this);
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      !_.isEqual(
        { page: prevState.page, ...prevState.queryParams },
        { page: this.state.page, ...this.state.queryParams }
      )
    ) {
      const { page, queryParams } = this.state;
      this.getDestinations(page * queryParams.size, queryParams);
    }
  }

  async componentDidMount() {
    this.getPlugins();
    const { httpClient } = this.props;
    const allowList = await getAllowList(httpClient);
    this.setState({ allowList });

    const { page, queryParams } = this.state;
    this.getDestinations(page * queryParams.size, queryParams);
  }

  async getPlugins() {
    const { httpClient } = this.props;
    try {
      const pluginsResponse = await httpClient.get('../api/alerting/_plugins');
      if (pluginsResponse.ok) {
        const plugins = pluginsResponse.resp.map((plugin) => plugin.component);
        const hasNotificationPlugin = plugins.indexOf(OS_NOTIFICATION_PLUGIN) !== -1;
        this.setState({ hasNotificationPlugin });
      } else {
        console.error('There was a problem getting plugins list');
      }
    } catch (e) {
      console.error('There was a problem getting plugins list', e);
    }
  }

  isEmailAllowed = () => {
    const { allowList } = this.state;
    return allowList.includes(DESTINATION_TYPE.EMAIL);
  };

  isDeleteAllowed = async (type, id) => {
    const { httpClient } = this.props;
    const requestBody = {
      query: isDeleteAllowedQuery(type, id),
      index: INDEX.SCHEDULED_JOBS,
    };
    const resp = await httpClient.post('../api/alerting/monitors/_search', {
      body: JSON.stringify(requestBody),
    });
    const total = _.get(resp, 'resp.hits.total.value');
    return total === 0;
  };

  handleDeleteAction = async (destinationToDelete) => {
    const { id, type } = destinationToDelete;
    const allowDelete = await this.isDeleteAllowed(type, id);
    if (allowDelete) {
      this.setState({
        showDeleteConfirmation: true,
        destinationToDelete,
      });
    } else {
      this.setState({
        destinationConsumedByOthers: true,
        destinationToDelete,
      });
      //dismiss callout after 30 Seconds
      setTimeout(
        () => this.setState({ destinationConsumedByOthers: false, destinationToDelete: null }),
        5000
      );
    }
  };

  handleDeleteDestination = async () => {
    const { id: destinationId } = this.state.destinationToDelete;
    const { httpClient, notifications } = this.props;
    try {
      const resp = await httpClient.delete(`../api/alerting/destinations/${destinationId}`);
      if (resp.ok) {
        await this.getDestinations();
      } else {
        // TODO::handle error
        //Something went wrong unable to delete if trying to delete already deleted destination
        console.log('Unable to delete destination');
        backendErrorNotification(notifications, 'delete', 'destination', resp.resp);
      }
      this.setState({
        showDeleteConfirmation: false,
        destinationToDelete: null,
      });
    } catch (e) {
      console.log('unable to delete destination', e);
    }
  };

  handleEditDestination = (destinationToEdit) => {
    this.props.history.push({
      pathname: `destinations/${destinationToEdit.id}`,
      search: `?action=${DESTINATION_ACTIONS.UPDATE_DESTINATION}`,
      state: { destinationToEdit },
    });
  };

  handleSearchChange = (e) => {
    const searchText = e.target.value;
    this.setState((state) => ({
      page: 0,
      queryParams: { ...state.queryParams, search: searchText },
    }));
  };

  handleTypeChange = (e) => {
    const type = e.target.value;
    this.setState((state) => {
      return {
        page: 0,
        queryParams: { ...state.queryParams, type },
      };
    });
  };

  getDestinations = _.debounce(
    async (from, params) => {
      this.setState({
        isDestinationLoading: true,
      });
      const { history, httpClient } = this.props;
      const queryParms = queryString.stringify({ from, ...params });
      history.replace({
        ...this.props.location,
        search: queryParms,
      });
      try {
        const resp = await httpClient.get('../api/alerting/destinations', {
          query: { from, ...params },
        });
        if (resp.ok) {
          this.setState({
            isDestinationLoading: false,
            destinations: resp.destinations,
            totalDestinations: resp.totalDestinations,
          });
        } else {
          // TODO: 'response.ok' is 'false' when there is no alerting config index in the cluster, and notification should not be shown to new Alerting users
          // backendErrorNotification(notifications, 'get', 'destinations', resp.err);
          this.setState({
            isDestinationLoading: false,
          });
        }
      } catch (err) {
        console.error('Unable to get destinations', err);
      }
    },
    500,
    { leading: true }
  );

  handlePageChange = ({ page: tablePage = {}, sort = {} }) => {
    const { index: page, size } = tablePage;
    const { field: sortField, direction: sortDirection } = sort;

    this.setState((state) => ({
      page,
      queryParams: {
        ...state.queryParams,
        size,
        sortField,
        sortDirection,
      },
    }));
  };

  handlePageClick = (page) => {
    this.setState({ page });
  };

  handleResetFilter = () => {
    this.setState((state) => ({
      ...state,
      queryParams: {
        ...state.queryParams,
        search: '',
        type: 'ALL',
      },
    }));
  };

  hideManageSendersModal = () => {
    this.setState({ showManageSenders: false });
  };

  hideManageEmailGroupsModal = () => {
    this.setState({ showManageEmailGroups: false });
  };

  render() {
    const { httpClient, notifications } = this.props;
    const {
      destinations,
      destinationToDelete,
      page,
      queryParams: { size, search, type, sortDirection, sortField },
      totalDestinations,
      isDestinationLoading,
      destinationConsumedByOthers,
      allowList,
      hasNotificationPlugin,
    } = this.state;
    const isFilterApplied = !!search || type !== 'ALL';
    const pagination = {
      pageIndex: page,
      pageSize: size,
      totalItemCount: totalDestinations,
      pageSizeOptions: [5, 10, 20, 50],
    };
    const sorting = {
      sort: {
        direction: sortDirection,
        field: sortField,
      },
    };
    return (
      <React.Fragment>
        {destinationConsumedByOthers ? (
          <EuiCallOut
            title={`Couldn't delete destination ${destinationToDelete.name}. One or more monitors uses this destination.`}
            iconType="cross"
            color="danger"
          />
        ) : null}

        {isDestinationLoading || totalDestinations > 0 || isFilterApplied ? (
          <div>
            <EuiTitle size={'l'}>
              <h3>Destinations (deprecated)</h3>
            </EuiTitle>
            <EuiSpacer size={'l'} />
            <NotificationsInfoCallOut hasNotificationPlugin={hasNotificationPlugin} />
            <ContentPanel
              bodyStyles={{ padding: 'initial' }}
              title={
                <div>
                  <EuiTitle size={'s'} style={{ paddingBottom: '0px', marginBottom: '0px' }}>
                    <h3>Destinations pending for migration</h3>
                  </EuiTitle>
                  {hasNotificationPlugin ? (
                    <EuiText
                      color={'subdued'}
                      size={'s'}
                      style={{ paddingTop: '0px', marginTop: '0px' }}
                    >
                      Destinations that are pending migration will continue to work.
                    </EuiText>
                  ) : null}
                </div>
              }
              actions={
                <DestinationsActions
                  isEmailAllowed={this.isEmailAllowed()}
                  onClickManageSenders={() => {
                    this.setState({ showManageSenders: true });
                  }}
                  onClickManageEmailGroups={() => {
                    this.setState({ showManageEmailGroups: true });
                  }}
                />
              }
            >
              <DeleteConfirmation
                isVisible={this.state.showDeleteConfirmation}
                onCancel={() => {
                  this.setState({ showDeleteConfirmation: false });
                }}
                onConfirm={this.handleDeleteDestination}
              />

              <ManageSenders
                httpClient={httpClient}
                isEmailAllowed={this.isEmailAllowed()}
                isVisible={this.state.showManageSenders}
                onClickCancel={this.hideManageSendersModal}
                onClickSave={this.hideManageSendersModal}
                notifications={notifications}
              />

              <ManageEmailGroups
                httpClient={httpClient}
                isEmailAllowed={this.isEmailAllowed()}
                isVisible={this.state.showManageEmailGroups}
                onClickCancel={this.hideManageEmailGroupsModal}
                onClickSave={this.hideManageEmailGroupsModal}
                notifications={notifications}
              />

              <DestinationsControls
                activePage={page}
                pageCount={Math.ceil(totalDestinations / size) || 1}
                search={search}
                type={type}
                onSearchChange={this.handleSearchChange}
                onTypeChange={this.handleTypeChange}
                onPageClick={this.handlePageClick}
                allowList={allowList}
              />
              <EuiHorizontalRule margin="xs" />
              <EuiBasicTable
                columns={this.columns}
                hasActions={true}
                isSelectable={true}
                items={destinations}
                pagination={pagination}
                noItemsMessage={
                  isDestinationLoading ? (
                    'Loading destinations...'
                  ) : (
                    <EmptyDestinations
                      hasNotificationPlugin={hasNotificationPlugin}
                      isFilterApplied={isFilterApplied}
                      onResetFilters={this.handleResetFilter}
                    />
                  )
                }
                onChange={this.handlePageChange}
                sorting={sorting}
              />
            </ContentPanel>
          </div>
        ) : (
          <FullPageNotificationsInfoCallOut hasNotificationPlugin={hasNotificationPlugin} />
        )}
      </React.Fragment>
    );
  }
}

DestinationsList.propTypes = {
  httpClient: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
  notifications: PropTypes.object.isRequired,
};
export default DestinationsList;
