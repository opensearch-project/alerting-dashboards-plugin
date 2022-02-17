/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { EuiConfirmModal, EuiInMemoryTable, EuiOverlayMask } from '@elastic/eui';

export default class AcknowledgeModal extends Component {
  constructor(props) {
    super(props);

    this.state = { selectedItems: [] };

    this.onConfirm = this.onConfirm.bind(this);
    this.onSelectionChange = this.onSelectionChange.bind(this);
  }

  onConfirm() {
    const { selectedItems } = this.state;
    if (!selectedItems.length) return;
    this.props.onAcknowledge(selectedItems);
  }

  onSelectionChange(selectedItems) {
    this.setState({ selectedItems });
  }

  renderTime(time) {
    const momentTime = moment(time);
    if (time && momentTime.isValid()) return momentTime.format('MM/DD/YY h:mm a');
    return '--';
  }

  render() {
    const { alerts, totalAlerts } = this.props;

    const columns = [
      {
        field: 'monitor_name',
        name: 'Monitor',
        truncateText: true,
      },
      {
        field: 'trigger_name',
        name: 'Trigger',
        truncateText: true,
      },
      {
        field: 'start_time',
        name: 'Start Time',
        truncateText: false,
        render: this.renderTime,
      },
      {
        field: 'severity',
        name: 'Severity',
        align: 'right',
        truncateText: false,
      },
    ];
    // TODO: Acknowledge loading, disable selection
    // TODO: Empty state, no active alerts found, or too many alerts found
    const selection = { onSelectionChange: this.onSelectionChange };

    return (
      <EuiOverlayMask>
        <EuiConfirmModal
          title="Acknowledge Alerts"
          maxWidth={650}
          onCancel={this.props.onClickCancel}
          onConfirm={this.onConfirm}
          cancelButtonText="cancel"
          confirmButtonText="Acknowledge"
        >
          <p>Select which alerts to acknowledge.</p>
          <EuiInMemoryTable
            items={alerts}
            itemId="id"
            columns={columns}
            isSelectable={true}
            selection={selection}
            onTableChange={this.onTableChange}
            style={{
              // TODO: Move to classname
              borderTop: '1px solid #D9D9D9',
              borderLeft: '1px solid #D9D9D9',
              borderRight: '1px solid #D9D9D9',
            }}
          />
        </EuiConfirmModal>
      </EuiOverlayMask>
    );
  }
}

const AlertType = PropTypes.shape({});

AcknowledgeModal.propTypes = {
  alerts: PropTypes.arrayOf(PropTypes.any).isRequired,
  totalAlerts: PropTypes.number.isRequired,
  onClickCancel: PropTypes.func.isRequired,
  onAcknowledge: PropTypes.func.isRequired,
};
