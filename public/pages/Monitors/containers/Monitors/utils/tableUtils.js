/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiLink } from '@elastic/eui';
import moment from 'moment';
import { DEFAULT_EMPTY_DATA, MONITOR_TYPE } from '../../../../../utils/constants';
import { PLUGIN_NAME } from '../../../../../../utils/constants';
import { getItemLevelType } from './helpers';

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
      <EuiLink
        data-test-subj={name}
        href={`${PLUGIN_NAME}#/monitors/${item.id}?type=${item.monitor.type}`}
      >
        {name}
      </EuiLink>
    ),
  },
  {
    field: 'enabled',
    name: 'State',
    sortable: false,
    truncateText: false,
    render: (enabled) => (enabled ? 'Enabled' : 'Disabled'),
  },
  {
    field: 'item_type',
    name: 'Type',
    sortable: false,
    truncateText: false,
    render: (item_type) => getItemLevelType(item_type),
  },
  {
    field: 'user',
    name: 'Last updated by',
    sortable: true,
    truncateText: true,
    textOnly: true,
    /* There are 3 cases:
    1. Monitors created by older versions and never updated.
       These monitors won’t have User details in the monitor object. `monitor.user` will be null.
    2. Monitors are created when security plugin is disabled, these will have empty User object.
       (`monitor.user.name`, `monitor.user.roles` are empty )
    3. Monitors are created when security plugin is enabled, these will have an User object. */
    render: (_, item) => (item.user && item.user.name ? item.user.name : '-'),
  },
  {
    field: 'latestAlert',
    name: 'Latest alert',
    sortable: false,
    truncateText: true,
    textOnly: true,
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
  {
    field: 'associatedCompositeMonitorCnt',
    name: 'Associated composite monitors',
    truncateText: false,
    render: (count, item) => (item.item_type === MONITOR_TYPE.COMPOSITE_LEVEL ? '–' : count),
  },
];
