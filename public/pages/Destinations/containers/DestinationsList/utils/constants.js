/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DESTINATION_OPTIONS } from '../../../utils/constants';

export const DEFAULT_QUERY_PARAMS = {
  from: 0,
  search: '',
  size: 20,
  sortDirection: 'desc',
  sortField: 'name',
  type: 'ALL',
};

export const MAX_DESTINATIONS = 200;

export const staticColumns = [
  {
    field: 'name',
    name: 'Destination name',
    sortable: true,
    truncateText: true,
    textOnly: true,
    width: '100px',
  },
  {
    field: 'type',
    name: 'Destination type',
    truncateText: true,
    sortable: true,
    textOnly: true,
    width: '100px',
    render: (value) => {
      //TODO:: Convert this to proper map of text to avoid filters always
      const actionType = DESTINATION_OPTIONS.filter((item) => item.value === value);
      if (actionType.length > 0) {
        return actionType[0].text;
      } else {
        return 'Unsupported Type';
      }
    },
  },
  {
    field: 'user',
    name: 'Last updated by',
    sortable: true,
    truncateText: true,
    textOnly: true,
    width: '100px',
    render: (value) => (value && value.name ? value.name : '-'),
  },
];
