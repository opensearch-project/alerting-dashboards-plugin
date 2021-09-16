/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
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
