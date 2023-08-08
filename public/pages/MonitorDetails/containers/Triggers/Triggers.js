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
import { TRIGGER_TYPE } from '../../../CreateTrigger/containers/CreateTrigger/utils/constants';
import { conditionToExpressions } from '../../../CreateTrigger/utils/helper';

export const MAX_TRIGGERS = 10;

// TODO: For now, unwrapping all the Triggers since it's conflicting with the table
//   retrieving the 'id' and causing it to behave strangely
export function getUnwrappedTriggers(monitor) {
  return monitor.triggers.map((trigger) => {
    switch (monitor.monitor_type) {
      case MONITOR_TYPE.BUCKET_LEVEL:
        return trigger[TRIGGER_TYPE.BUCKET_LEVEL];
      case MONITOR_TYPE.DOC_LEVEL:
        return trigger[TRIGGER_TYPE.DOC_LEVEL];
      case MONITOR_TYPE.COMPOSITE_LEVEL:
        return trigger[TRIGGER_TYPE.COMPOSITE_LEVEL];
      default:
        return trigger[TRIGGER_TYPE.QUERY_LEVEL];
    }
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
      tableKey: uuidv4(),
      direction: 'asc',
      selectedItems: [],
      items: [],
      triggerConditionsById: {},
    };

    this.onDelete = this.onDelete.bind(this);
    this.onEdit = this.onEdit.bind(this);
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
      this.setState({ tableKey: uuidv4() });
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
    const { direction, field, tableKey, items } = this.state;
    const { monitor } = this.props;
    const numOfTriggers = _.get(monitor, 'triggers', []).length;

    const columns = [
      {
        field: 'name',
        name: 'Name',
        sortable: true,
        truncateText: true,
        width: '15%',
      },
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
  onEditTrigger: PropTypes.func.isRequired,
  onCreateTrigger: PropTypes.func.isRequired,
};
