/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiLink } from '@elastic/eui';
import moment from 'moment';
import { DEFAULT_EMPTY_DATA } from '../../../../../utils/constants';
import { PLUGIN_NAME } from '../../../../../../utils/constants';

const renderTime = (time) => {
  const momentTime = moment(time);
  if (time && momentTime.isValid()) return momentTime.format('MM/DD/YY h:mm a');
  return DEFAULT_EMPTY_DATA;
};

export const columns = [
  {
    field: 'name',
    name: 'Monitor name',
    sortable: true,
    textOnly: true,
    render: (name, item) => (
      <EuiLink data-test-subj={name} href={`${PLUGIN_NAME}#/monitors/${item.id}`}>
        {name}
      </EuiLink>
    ),
  },
  {
    field: 'latestAlert',
    name: 'Latest alert',
    sortable: false,
    truncateText: true,
    textOnly: true,
  },
  {
    field: 'enabled',
    name: 'State',
    sortable: false,
    truncateText: false,
    render: (enabled) => (enabled ? 'Enabled' : 'Disabled'),
  },
  {
    field: 'lastNotificationTime',
    name: 'Last notification time',
    sortable: true,
    truncateText: false,
    render: renderTime,
    dataType: 'date',
  },
  {
    field: 'active',
    name: 'Active',
    sortable: true,
    truncateText: false,
    render: (count) => count || 0,
  },
  {
    field: 'acknowledged',
    name: 'Acknowledged',
    sortable: true,
    truncateText: false,
    render: (count) => count || 0,
  },
  {
    field: 'errors',
    name: 'Errors',
    sortable: true,
    truncateText: false,
    render: (count) => count || 0,
  },
  {
    field: 'ignored',
    name: 'Ignored',
    sortable: true,
    truncateText: false,
    render: (count) => count || 0,
  },
];
