/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { EuiInMemoryTable, EuiIcon, EuiToolTip } from '@elastic/eui';
import _ from 'lodash';

import ContentPanel from '../../../../components/ContentPanel';
import { DEFAULT_EMPTY_DATA } from '../../../../utils/constants';
import { formatDuration } from '../../../CreateMonitor/containers/CreateMonitor/utils/pplAlertingHelpers';

const MAX_TRIGGERS = 10;

const formatTriggerMode = (mode) => {
  if (!mode) return DEFAULT_EMPTY_DATA;
  switch (mode) {
    case 'result_set':
      return 'Per result';
    case 'per_execution':
    case 'execution':
    case 'once':
      return 'Once';
    default:
      return mode;
  }
};

const formatTriggerType = (type) => {
  if (!type) return DEFAULT_EMPTY_DATA;
  switch (type) {
    case 'number_of_results':
      return 'Number of results';
    case 'custom_script':
    case 'script':
      return 'Custom';
    default:
      return type;
  }
};

const formatMinutes = (value) =>
  value === 0
    ? '0 minutes'
    : value
    ? `${value} minute${value === 1 ? '' : 's'}`
    : DEFAULT_EMPTY_DATA;

const getExpireDurationHeader = () => {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
      Expire duration
      <EuiToolTip content="Default to 7 days if not specified">
        <EuiIcon type="iInCircle" size="s" style={{ marginLeft: '4px' }} />
      </EuiToolTip>
    </span>
  );
};

const normalizeTrigger = (trigger = {}) => ({
  ...trigger,
  id: trigger.id ?? trigger.name ?? `${trigger.type || 'trigger'}-${Math.random()}`,
});

class TriggersPpl extends Component {
  constructor(props) {
    super(props);

    this.state = {
      field: 'name',
      tableKey: `table-${Date.now()}-${Math.random()}`,
      direction: 'asc',
      selectedItems: [],
      items: [],
    };

    this.onSelectionChange = this.onSelectionChange.bind(this);
    this.onTableChange = this.onTableChange.bind(this);
  }

  componentDidMount() {
    this.updateMonitorState();
  }

  componentDidUpdate(prevProps) {
    if (this.props.monitor !== prevProps.monitor) {
      this.updateMonitorState();
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.monitor !== nextProps.monitor) {
      this.setState({ tableKey: `table-${Date.now()}-${Math.random()}` });
    }
  }

  updateMonitorState() {
    const { monitor } = this.props;

    const triggers = Array.isArray(monitor?.triggers) ? monitor.triggers.map(normalizeTrigger) : [];

    this.setState({ items: triggers });
  }

  onSelectionChange(selectedItems) {
    this.setState({ selectedItems });
  }

  onTableChange({ sort: { field, direction } = {} }) {
    this.setState({ field, direction });
  }

  render() {
    const { direction, field, tableKey, items } = this.state;
    const { monitor } = this.props;
    const numOfTriggers = Array.isArray(monitor?.triggers) ? monitor.triggers.length : 0;

    const columns = [
      {
        field: 'name',
        name: 'Name',
        sortable: true,
        truncateText: true,
        width: '15%',
      },
      {
        field: 'mode',
        name: 'Trigger mode',
        sortable: false,
        truncateText: false,
        width: '12%',
        render: (mode) => formatTriggerMode(mode),
      },
      {
        field: 'type',
        name: 'Trigger type',
        sortable: false,
        truncateText: false,
        width: '12%',
        render: (type) => formatTriggerType(type),
      },
      {
        field: 'actions',
        name: 'Number of actions',
        sortable: true,
        truncateText: false,
        render: (actions = []) => actions.length,
        width: '12%',
      },
      {
        field: 'severity',
        name: 'Severity',
        sortable: true,
        truncateText: false,
        width: '10%',
      },
      {
        field: 'num_results_condition',
        name: 'Num results condition',
        sortable: false,
        truncateText: false,
        width: '12%',
        render: (value, item) =>
          item.type === 'number_of_results' ? value || DEFAULT_EMPTY_DATA : DEFAULT_EMPTY_DATA,
      },
      {
        field: 'num_results_value',
        name: 'Num results value',
        sortable: false,
        truncateText: false,
        width: '12%',
        render: (value, item) =>
          item.type === 'number_of_results' ? value ?? DEFAULT_EMPTY_DATA : DEFAULT_EMPTY_DATA,
      },
      {
        name: 'Custom condition',
        sortable: false,
        truncateText: false,
        width: '20%',
        render: (item) =>
          item.type !== 'number_of_results'
            ? _.get(item, 'condition.script.source') || DEFAULT_EMPTY_DATA
            : DEFAULT_EMPTY_DATA,
      },
      {
        field: 'expires_minutes',
        name: getExpireDurationHeader(),
        sortable: false,
        truncateText: false,
        width: '12%',
        render: (value) => formatDuration(value),
      },
      {
        field: 'throttle_minutes',
        name: 'Throttle duration',
        sortable: false,
        truncateText: false,
        width: '12%',
        render: (value) => formatDuration(value),
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
          items={items}
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

TriggersPpl.propTypes = {
  monitor: PropTypes.object.isRequired,
};

export default TriggersPpl;
