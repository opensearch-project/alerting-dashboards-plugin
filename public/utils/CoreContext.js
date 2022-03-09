/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

const CoreContext = React.createContext({});

const CoreConsumer = CoreContext.Consumer;

export { CoreContext, CoreConsumer };
