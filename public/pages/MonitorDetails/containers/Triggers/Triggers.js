/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { EuiInMemoryTable } from '@elastic/eui';
import _ from 'lodash';

import ContentPanel from '../../../../components/ContentPanel';
import { DEFAULT_EMPTY_DATA, MONITOR_TYPE } from '../../../../utils/constants';
import { TRIGGER_TYPE } from '../../../CreateTrigger/containers/CreateTrigger/utils/constants';
import { conditionToExpressions } from '../../../CreateTrigger/utils/helper';

export const MAX_TRIGGERS = 10;

// TODO: For now, unwrapping all the Triggers since it's conflicting with the table
//   retrieving the 'id' and causing it to behave strangely
export function getUnwrappedTriggers(monitor) {
  return monitor.triggers.map((trigger) => {
    let unwrappedTrigger = trigger;

    const isPPLTrigger = trigger && (trigger.mode || trigger.type) && !trigger.query_level_trigger;
    if (isPPLTrigger) {
      return trigger;
    }

    if (Object.keys(trigger).length === 1) {
      switch (monitor.monitor_type) {
        case MONITOR_TYPE.BUCKET_LEVEL:
          unwrappedTrigger = trigger[TRIGGER_TYPE.BUCKET_LEVEL];
          break;
        case MONITOR_TYPE.DOC_LEVEL:
          unwrappedTrigger = trigger[TRIGGER_TYPE.DOC_LEVEL];
          break;
        case MONITOR_TYPE.COMPOSITE_LEVEL:
          unwrappedTrigger = trigger[TRIGGER_TYPE.COMPOSITE_LEVEL];
          break;
        case MONITOR_TYPE.CLUSTER_METRICS:
        case MONITOR_TYPE.QUERY_LEVEL:
        default:
          unwrappedTrigger = trigger[TRIGGER_TYPE.QUERY_LEVEL];
          break;
      }
    }
    return unwrappedTrigger;
  });
}

const expressionsToFormattedCondition = (expressions) => {
  const conditionMap = {
    AND: 'AND ',
    OR: 'OR ',
    NOT: 'NOT',
    '': '',
    AND_NOT: 'AND NOT',
    OR_NOT: 'OR NOT',
  };

  const condition = expressions.reduce((query, expression) => {
    if (expression?.monitor_name) {
      query += ` ${conditionMap[expression.description]} ${expression.monitor_name}`;
      query = query.trim();
    }
    return query;
  }, '');

  return condition;
};

export default class Triggers extends Component {
  constructor(props) {
    super(props);

    this.state = {
      field: 'name',
      tableKey: `table-${Date.now()}-${Math.random()}`,
      direction: 'asc',
      selectedItems: [],
      items: [],
      triggerConditionsById: {},
    };

    this.onDelete = this.onDelete.bind(this);
    this.onSelectionChange = this.onSelectionChange.bind(this);
    this.onTableChange = this.onTableChange.bind(this);
    this.monitorsById = {};
  }

  componentDidMount() {
    this.updateMonitorState();
    this.formatTriggerCondtions();
  }

  componentDidUpdate(prevProps) {
    if (this.props.monitor !== prevProps.monitor) {
      this.updateMonitorState();
    }

    if (this.props.delegateMonitors !== prevProps.delegateMonitors) {
      this.formatTriggerCondtions();
    }
  }

  async updateMonitorState() {
    const { monitor } = this.props;
    const triggers = getUnwrappedTriggers(monitor);
    this.setState({ items: triggers });
  }

  componentWillReceiveProps(nextProps, nextContext) {
    if (this.props.monitor !== nextProps.monitor) {
      // In the React version OpenSearch Dashboards uses there is a bug regarding getDerivedStateFromProps
      // which EuiInMemoryTable uses which causes items to not be updated correctly.
      // Whenever the monitor is updated we'll generate a new key for the table
      // which will cause the table component to remount
      this.setState({ tableKey: `table-${Date.now()}-${Math.random()}` });
    }
  }

  formatTriggerCondtions() {
    const { monitor, delegateMonitors } = this.props;

    if (!delegateMonitors?.length) {
      return;
    }

    const triggers = getUnwrappedTriggers(monitor);
    const formattedTriggerConditionById = {};

    for (const trigger of triggers) {
      const { condition, id } = trigger;
      const expressions = conditionToExpressions(condition.script.source, delegateMonitors);
      formattedTriggerConditionById[id] = expressionsToFormattedCondition(expressions);
    }

    this.setState({
      triggerConditionsById: formattedTriggerConditionById,
    });
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

  onSelectionChange(selectedItems) {
    this.setState({ selectedItems });
  }

  onTableChange({ sort: { field, direction } = {} }) {
    this.setState({ field, direction });
  }

  render() {
    const { direction, field, tableKey, items } = this.state;
    const { monitor, showPplColumns } = this.props;
    const numOfTriggers = _.get(monitor, 'triggers', []).length;

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

    const columns = [
      {
        field: 'name',
        name: 'Name',
        sortable: true,
        truncateText: true,
        width: '15%',
      },
      ...(showPplColumns
        ? [
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
          ]
        : []),
      {
        field: 'actions',
        name: 'Number of actions',
        sortable: true,
        truncateText: false,
        render: (actions) => actions.length,
        width: '15%',
      },
      {
        field: 'severity',
        name: 'Severity',
        sortable: true,
        truncateText: false,
        width: '10%',
      },
      ...(showPplColumns
        ? [
            {
              field: 'num_results_condition',
              name: 'Num results condition',
              sortable: false,
              truncateText: false,
              width: '12%',
              render: (value, item) =>
                item.type === 'number_of_results'
                  ? value || DEFAULT_EMPTY_DATA
                  : DEFAULT_EMPTY_DATA,
            },
            {
              field: 'num_results_value',
              name: 'Num results value',
              sortable: false,
              truncateText: false,
              width: '12%',
              render: (value, item) =>
                item.type === 'number_of_results'
                  ? value ?? DEFAULT_EMPTY_DATA
                  : DEFAULT_EMPTY_DATA,
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
              name: 'Expire duration',
              sortable: false,
              truncateText: false,
              width: '12%',
              render: (value) => formatMinutes(value),
            },
            {
              field: 'throttle_minutes',
              name: 'Throttle duration',
              sortable: false,
              truncateText: false,
              width: '12%',
              render: (value) => formatMinutes(value),
            },
          ]
        : []),
    ];

    if (monitor.monitor_type === MONITOR_TYPE.COMPOSITE_LEVEL) {
      columns.splice(1, 0, {
        name: 'Condition',
        render: (item) => {
          return this.state.triggerConditionsById[item.id] ?? '–';
        },
        width: '50%',
      });
    }

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

Triggers.propTypes = {
  monitor: PropTypes.object.isRequired,
  httpClient: PropTypes.object.isRequired,
  updateMonitor: PropTypes.func.isRequired,
  showPplColumns: PropTypes.bool,
};

Triggers.defaultProps = {
  showPplColumns: false,
};
