/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import uuidv4 from 'uuid/v4';
import { EuiInMemoryTable } from '@elastic/eui';
import _ from 'lodash';

import ContentPanel from '../../../../components/ContentPanel';
import { MONITOR_TYPE } from '../../../../utils/constants';

export const MAX_TRIGGERS = 10;

// TODO: For now, unwrapping all the Triggers since it's conflicting with the table
//   retrieving the 'id' and causing it to behave strangely
export function getUnwrappedTriggers(monitor) {
  const isBucketLevelMonitor = monitor.monitor_type === MONITOR_TYPE.BUCKET_LEVEL;
  return isBucketLevelMonitor
    ? monitor.triggers.map((trigger) => {
        return trigger.bucket_level_trigger;
      })
    : monitor.triggers.map((trigger) => {
        return trigger.query_level_trigger;
      });
}

export default class Triggers extends Component {
  constructor(props) {
    super(props);

    this.state = {
      field: 'name',
      tableKey: uuidv4(),
      direction: 'asc',
      selectedItems: [],
    };

    this.onDelete = this.onDelete.bind(this);
    this.onEdit = this.onEdit.bind(this);
    this.onSelectionChange = this.onSelectionChange.bind(this);
    this.onTableChange = this.onTableChange.bind(this);
  }

  componentWillReceiveProps(nextProps, nextContext) {
    if (this.props.monitor !== nextProps.monitor) {
      // In the React version OpenSearch Dashboards uses there is a bug regarding getDerivedStateFromProps
      // which EuiInMemoryTable uses which causes items to not be updated correctly.
      // Whenever the monitor is updated we'll generate a new key for the table
      // which will cause the table component to remount
      this.setState({ tableKey: uuidv4() });
    }
  }

  onDelete() {
    const { selectedItems } = this.state;
    const { updateMonitor, monitor } = this.props;
    const triggersToDelete = selectedItems.reduce(
      (map, item) => ({
        ...map,
        [item.name]: true,
      }),
      {}
    );
    const shouldKeepTrigger = (trigger) => !triggersToDelete[trigger.name];
    const updatedTriggers = getUnwrappedTriggers(monitor).filter(shouldKeepTrigger);
    updateMonitor({ triggers: updatedTriggers });
  }

  onEdit() {
    const { monitor } = this.props;
    this.props.onEditTrigger(monitor.triggers);
  }

  onSelectionChange(selectedItems) {
    this.setState({ selectedItems });
  }

  onTableChange({ sort: { field, direction } = {} }) {
    this.setState({ field, direction });
  }

  render() {
    const { direction, field, tableKey } = this.state;
    const { monitor } = this.props;
    const numOfTriggers = _.get(monitor, 'triggers', []).length;

    const columns = [
      {
        field: 'name',
        name: 'Name',
        sortable: true,
        truncateText: true,
        width: '25%',
      },
      {
        field: 'actions',
        name: 'Number of actions',
        sortable: true,
        truncateText: false,
        render: (actions) => actions.length,
        width: '25%',
      },
      {
        field: 'severity',
        name: 'Severity',
        sortable: true,
        truncateText: false,
        width: '50%',
      },
    ];

    const sorting = { sort: { field, direction } };

    return (
      <ContentPanel
        title={`Triggers (${numOfTriggers})`}
        titleSize="s"
        bodyStyles={{ padding: 'initial' }}
      >
        <EuiInMemoryTable
          items={getUnwrappedTriggers(monitor)}
          itemId="id"
          key={tableKey}
          columns={columns}
          sorting={sorting}
          onTableChange={this.onTableChange}
          noItemsMessage={'There are no triggers.'}
        />
      </ContentPanel>
    );
  }
}

Triggers.propTypes = {
  monitor: PropTypes.object.isRequired,
  updateMonitor: PropTypes.func.isRequired,
  onEditTrigger: PropTypes.func.isRequired,
  onCreateTrigger: PropTypes.func.isRequired,
};
