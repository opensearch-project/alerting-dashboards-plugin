/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiText } from '@elastic/eui';
import { htmlIdGenerator } from '@elastic/eui/lib/services';

export const makeId = htmlIdGenerator();

// A helper function that wraps an event handler and filters out ESCAPE keys
export const ignoreEscape = (eventHandler) => (event) => {
  if (!(event.keyCode === 27)) {
    eventHandler();
  }
};

// A helper function that shows toast messages for backend errors.
export const backendErrorNotification = (notifications, actionName, objectName, errorMessage) => {
  notifications.toasts.addDanger({
    title: `Failed to ${actionName} the ${objectName}`,
    text: errorMessage,
    toastLifeTimeMs: 20000, // the default lifetime for toasts is 10 sec
  });
};

// A helper function to generate a simple string explaining how many elements a user can add to a list.
export const inputLimitText = (
  currCount = 0,
  limit = 0,
  singularKeyword = '',
  pluralKeyword = '',
  styleProps = {}
) => {
  const difference = limit - currCount;
  const remainingLimit = `You can add up to ${difference} ${limit === 1 ? '' : 'more'} ${
    difference === 1 ? singularKeyword : pluralKeyword
  }.`;
  const reachedLimit = `You have reached the limit of ${limit} ${
    limit === 1 ? singularKeyword : pluralKeyword
  }.`;
  return (
    <EuiText color={'subdued'} size={'xs'} style={styleProps}>
      {difference > 0 ? remainingLimit : reachedLimit}
    </EuiText>
  );
};
