/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AssistantSetup, TAB_ID } from '../types';
import AlertContainer from './component/AlertContainer/AlertContainer';
import { EuiButton, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';

const override: TAB_ID = 'override' as TAB_ID;
const chat: TAB_ID = 'chat' as TAB_ID;

export const registerAssistantDependencies = (setup?: AssistantSetup) => {
  if (!setup) return;

  setup.registerMessageRenderer('create_alert_button', (content, renderProps) => {
    const { content: rawContent} = content;
    const { chatContext } = renderProps;
    const closeFlyout = () => {
      if (chatContext) {
        chatContext.setFlyoutComponent(null);
        chatContext.setOverrideName(undefined);
        chatContext.setSelectedTabId(chat);
      }
    };
    return (<EuiFlexGroup justifyContent="spaceBetween">
      <EuiFlexItem grow={false}>
        <EuiButton
          onClick={() => {
            if (chatContext) {
              if (chatContext.selectedTabId !== override) {
                chatContext.setSelectedTabId(override);
              }
              const component = <AlertContainer content={rawContent} closeFlyout={closeFlyout}/>
              chatContext.setFlyoutComponent(component);
              chatContext.setOverrideName('Create Alert');
            }
          }}
          fill
          isLoading={false}
          disabled={false}
        >
          Create monitor
        </EuiButton>
      </EuiFlexItem>
    </EuiFlexGroup>)
  });
};
