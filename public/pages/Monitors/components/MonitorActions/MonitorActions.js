/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import {
  EuiButton,
  EuiContextMenuItem,
  EuiContextMenuPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPopover,
} from '@elastic/eui';

import { APP_PATH } from '../../../../utils/constants';
import { PLUGIN_NAME } from '../../../../../utils/constants';

export default class MonitorActions extends Component {
  state = {
    isActionsOpen: false,
  };

  getActions = () => {
    // TODO: Support bulk acknowledge alerts across multiple monitors after figuring out the correct parameter for getAlerts API.
    // Disabling the acknowledge button for now when more than 1 monitors selected.
    const { isEditDisabled } = this.props;
    const actions = [
      <EuiContextMenuItem
        key="acknowledge"
        data-test-subj="acknowledgeItem"
        onClick={() => {
          this.onCloseActions();
          this.props.onBulkAcknowledge();
        }}
      >
        Acknowledge
      </EuiContextMenuItem>,
      <EuiContextMenuItem
        key="enable"
        data-test-subj="enableItem"
        onClick={() => {
          this.onCloseActions();
          this.props.onBulkEnable();
        }}
      >
        Enable
      </EuiContextMenuItem>,
      <EuiContextMenuItem
        key="disable"
        data-test-subj="disableItem"
        onClick={() => {
          this.onCloseActions();
          this.props.onBulkDisable();
        }}
      >
        Disable
      </EuiContextMenuItem>,
      <EuiContextMenuItem
        key="delete"
        data-test-subj="deleteItem"
        onClick={() => {
          this.onCloseActions();
          this.props.onBulkDelete();
        }}
      >
        Delete
      </EuiContextMenuItem>,
    ];
    if (isEditDisabled) actions.splice(0, 1);
    return actions;
  };

  onCloseActions = () => {
    this.setState({ isActionsOpen: false });
  };

  onClickActions = () => {
    this.setState((prevState) => ({ isActionsOpen: !prevState.isActionsOpen }));
  };

  render() {
    const { isActionsOpen } = this.state;
    const { isEditDisabled, onClickEdit } = this.props;
    return (
      <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
        <EuiFlexItem grow={false}>
          <EuiPopover
            id="actionsPopover"
            button={
              <EuiButton
                onClick={this.onClickActions}
                iconType="arrowDown"
                iconSide="right"
                data-test-subj="actionsButton"
              >
                Actions
              </EuiButton>
            }
            isOpen={isActionsOpen}
            closePopover={this.onCloseActions}
            panelPaddingSize="none"
            anchorPosition="downLeft"
          >
            <EuiContextMenuPanel items={this.getActions()} />
          </EuiPopover>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton disabled={isEditDisabled} onClick={onClickEdit} data-test-subj="editButton">
            Edit
          </EuiButton>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton
            fill
            href={`${PLUGIN_NAME}#${APP_PATH.CREATE_MONITOR}`}
            data-test-subj="createButton"
          >
            Create monitor
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }
}
