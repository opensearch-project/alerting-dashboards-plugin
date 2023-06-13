import React, { useMemo } from 'react';
import { EuiHealth, EuiLink } from '@elastic/eui';
import { stateToLabel } from '../../../utils/contextMenu/monitors';
import { dateOptionsLong } from '../../../utils/contextMenu/helpers';
import { PLUGIN_NAME } from '../../../../utils/constants';

export const useColumns = ({ onUnlink, onEdit }) => {
  const columns = useMemo(
    () => [
      {
        field: 'name',
        name: 'Monitor Name',
        sortable: true,
        truncateText: true,
        width: '50%',
        render: (name, monitor) => (
          <EuiLink href={`${PLUGIN_NAME}#/monitors/${monitor.id}`} target="_blank">
            {name}
          </EuiLink>
        ),
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
        name: 'Latest alert',
        sortable: true,
        truncateText: true,
        width: '50%',
        render: (date) => new Intl.DateTimeFormat('default', dateOptionsLong).format(date),
      },
      {
        name: 'Actions',
        actions: [
          {
            type: 'icon',
            name: 'Edit monitor',
            description: 'Edit monitor',
            icon: 'pencil',
            onClick: onEdit,
          },
          {
            type: 'icon',
            name: 'Unlink monitor',
            description: 'Unlink monitor',
            icon: 'unlink',
            onClick: onUnlink,
          },
        ],
      },
    ],
    [onUnlink, onEdit]
  );
  return columns;
};
