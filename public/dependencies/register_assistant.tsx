/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AssistantSetup } from '../types';
import AlertContainer from './component/AlertContainer';

export const registerAssistantDependencies = (setup?: AssistantSetup) => {
  if (!setup) return;

  setup.registerMessageRenderer('create_monitor_grid', (content, renderProps) => {
    const { content: rawContent} = content;
    return (
      <AlertContainer content={rawContent}/>
    );
  });
};
