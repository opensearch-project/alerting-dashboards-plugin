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
import { IncontextInsightComponent } from '../../../../../../../../plugins/dashboards-assistant/public';

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
    render: (name, item) =>
      IncontextInsightComponent ? (
        <IncontextInsightComponent
          contextProvider={async () => {
            return '';
          }}
        >
          <EuiLink
            key={`${item.item_type}`}
            data-test-subj={name}
            href={`${PLUGIN_NAME}#/monitors/${item.id}?type=${item.monitor.type}`}
          >
            {name}
          </EuiLink>
        </IncontextInsightComponent>
      ) : (
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
    name: 'Associations with composite monitors',
    truncateText: false,
    render: (count, item) => (item.item_type === MONITOR_TYPE.COMPOSITE_LEVEL ? '–' : count),
  },
];
