import React, { useCallback, useMemo } from 'react';
import {
  EuiFlyoutHeader,
  EuiTitle,
  EuiText,
  EuiSpacer,
  EuiInMemoryTable,
  EuiFlyoutBody,
} from '@elastic/eui';
import uuidv4 from 'uuid/v4';
import './styles.scss';
import { getColumns, search } from './helpers';

const AssociatedMonitors = ({ embeddable, closeFlyout }) => {
  const onUnlink = useCallback(
    (item) => {
      console.log('onUnlink', item);
      closeFlyout();
    },
    [closeFlyout]
  );
  const onEdit = useCallback(
    (item) => {
      console.log('onEdit', item);
      closeFlyout();
    },
    [closeFlyout]
  );
  const onView = useCallback(
    (item) => {
      console.log('onView', item);
      closeFlyout();
    },
    [closeFlyout]
  );
  const columns = useMemo(() => getColumns({ onUnlink, onEdit, onView }), [
    onUnlink,
    onEdit,
    onView,
  ]);
  const monitors = [
    // { name: 'CPU usage across world', state: 'enabled', date: Date.now(), id: uuidv4() },
    { name: 'Memory usage across world', state: 'disabled', date: Date.now(), id: uuidv4() },
    { name: 'Memory usage across world 2', state: 'disabled', date: Date.now(), id: uuidv4() },
    { name: 'Memory usage across world 3', state: 'disabled', date: Date.now(), id: uuidv4() },
    { name: 'Memory usage across world 4', state: 'disabled', date: Date.now(), id: uuidv4() },
    { name: 'Memory usage across world 5', state: 'disabled', date: Date.now(), id: uuidv4() },
    { name: 'Memory usage across world 6', state: 'disabled', date: Date.now(), id: uuidv4() },
    { name: 'Memory usage across world 7', state: 'disabled', date: Date.now(), id: uuidv4() },
    { name: 'Memory usage across world 8', state: 'disabled', date: Date.now(), id: uuidv4() },
    { name: 'Memory usage across world 9', state: 'disabled', date: Date.now(), id: uuidv4() },
    { name: 'Memory usage across world 10', state: 'disabled', date: Date.now(), id: uuidv4() },
    { name: 'Memory usage across world 11', state: 'disabled', date: Date.now(), id: uuidv4() },
    { name: 'Memory usage across world 12', state: 'disabled', date: Date.now(), id: uuidv4() },
    { name: 'Memory usage across world 13', state: 'disabled', date: Date.now(), id: uuidv4() },
    { name: 'Memory usage across world 14', state: 'disabled', date: Date.now(), id: uuidv4() },
    { name: 'Memory usage across world 15', state: 'disabled', date: Date.now(), id: uuidv4() },
    { name: 'Memory usage across world 16', state: 'disabled', date: Date.now(), id: uuidv4() },
    { name: 'Memory usage across world 17', state: 'disabled', date: Date.now(), id: uuidv4() },
    { name: 'Memory usage across world 18', state: 'disabled', date: Date.now(), id: uuidv4() },
    { name: 'Memory usage across world 19', state: 'disabled', date: Date.now(), id: uuidv4() },
    { name: 'Memory usage across world 20', state: 'disabled', date: Date.now(), id: uuidv4() },
  ];
  const tableProps = {
    items: monitors,
    columns,
    search,
    hasActions: true,
    pagination: true,
    sorting: true,
  };
  const title = embeddable.getTitle();

  return (
    <div className="associated-monitors">
      <EuiFlyoutHeader hasBorder>
        <EuiTitle size="s">
          <h2 id="associated-monitors__title">
            Associated monitors {monitors.length > 0 ? `(${monitors.length})` : ''}
          </h2>
        </EuiTitle>
      </EuiFlyoutHeader>
      <EuiFlyoutBody>
        <EuiText>
          <h4>{title}</h4>
        </EuiText>
        <EuiSpacer size="l" />
        <EuiInMemoryTable {...tableProps} />
      </EuiFlyoutBody>
    </div>
  );
};

export default AssociatedMonitors;
