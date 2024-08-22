/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import {
  EuiSmallButton,
  EuiContextMenuPanel,
  EuiContextMenuItem,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPopover,
} from '@elastic/eui';

export default class DestinationsActions extends Component {
  state = {
    isActionsOpen: false,
  };

  getActions = () => {
    return [
      <EuiContextMenuItem
        key="manageSenders"
        onClick={() => {
          this.onCloseActions();
          this.props.onClickManageSenders();
        }}
      >
        View email senders
      </EuiContextMenuItem>,
      <EuiContextMenuItem
        key="manageEmailGroups"
        onClick={() => {
          this.onCloseActions();
          this.props.onClickManageEmailGroups();
        }}
      >
        View email groups
      </EuiContextMenuItem>,
    ];
  };

  onCloseActions = () => {
    this.setState({ isActionsOpen: false });
  };

  onClickActions = () => {
    this.setState((prevState) => ({ isActionsOpen: !prevState.isActionsOpen }));
  };

  render() {
    const { isEmailAllowed } = this.props;
    const { isActionsOpen } = this.state;
    return (
      <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
        {isEmailAllowed ? (
          <EuiFlexItem>
            <EuiPopover
              id="destinationActionsPopover"
              button={
                <EuiSmallButton onClick={this.onClickActions} iconType="arrowDown" iconSide="right">
                  Actions
                </EuiSmallButton>
              }
              isOpen={isActionsOpen}
              closePopover={this.onCloseActions}
              panelPaddingSize="none"
              anchorPosition="downLeft"
            >
              <EuiContextMenuPanel items={this.getActions()} />
            </EuiPopover>
          </EuiFlexItem>
        ) : null}
      </EuiFlexGroup>
    );
  }
}
