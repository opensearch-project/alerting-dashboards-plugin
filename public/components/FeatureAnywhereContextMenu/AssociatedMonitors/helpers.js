import React from 'react';
import { EuiHealth } from '@elastic/eui';

export const dateOptions = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
  hour12: true,
  timeZone: 'America/Los_Angeles',
};

export const stateToLabel = {
  enabled: { label: 'Enabled', color: 'success' },
  disabled: { label: 'Disabled', color: 'danger' },
};

export const getColumns = ({ onUnlink, onEdit, onView }) => [
  {
    field: 'name',
    name: 'Monitor Name',
    sortable: true,
    truncateText: true,
    width: '50%',
  },
  {
    field: 'state',
    name: 'State',
    sortable: true,
    width: '105px',
    render: (state) => (
      <EuiHealth color={stateToLabel[state].color}>{stateToLabel[state].label}</EuiHealth>
    ),
  },
  {
    field: 'date',
    name: 'Last alert',
    sortable: true,
    truncateText: true,
    width: '50%',
    render: (date) => new Intl.DateTimeFormat('default', dateOptions).format(date),
  },
  {
    name: 'Actions',
    actions: [
      {
        type: 'icon',
        name: 'Unlink monitor',
        description: 'Unlink monitor',
        icon: 'unlink',
        onClick: onUnlink,
      },
      {
        type: 'icon',
        name: 'Edit monitor',
        description: 'Edit monitor',
        icon: 'pencil',
        onClick: onEdit,
      },
      {
        type: 'icon',
        name: 'View configuration',
        description: 'View configuration',
        icon: 'popout',
        onClick: onView,
      },
    ],
  },
];
