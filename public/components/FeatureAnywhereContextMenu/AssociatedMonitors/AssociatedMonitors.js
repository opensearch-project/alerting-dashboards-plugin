import React, { useCallback, useMemo } from 'react';
import {
  EuiFlyoutHeader,
  EuiTitle,
  EuiText,
  EuiSpacer,
  EuiInMemoryTable,
  EuiFlyoutBody,
  EuiEmptyPrompt,
  EuiButton,
} from '@elastic/eui';
import uuidv4 from 'uuid/v4';
import './styles.scss';
import { getColumns } from './helpers';

const AssociatedMonitors = ({ embeddable, closeFlyout, setPanel }) => {
  const title = embeddable.getTitle();
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
    // { name: 'Memory usage across world', state: 'disabled', date: Date.now(), id: uuidv4() },
    // { name: 'Memory usage across world 2', state: 'disabled', date: Date.now(), id: uuidv4() },
    // { name: 'Memory usage across world 3', state: 'disabled', date: Date.now(), id: uuidv4() },
    // { name: 'Memory usage across world 4', state: 'disabled', date: Date.now(), id: uuidv4() },
    // { name: 'Memory usage across world 5', state: 'disabled', date: Date.now(), id: uuidv4() },
    // { name: 'Memory usage across world 6', state: 'disabled', date: Date.now(), id: uuidv4() },
    // { name: 'Memory usage across world 7', state: 'disabled', date: Date.now(), id: uuidv4() },
    // { name: 'Memory usage across world 8', state: 'disabled', date: Date.now(), id: uuidv4() },
    // { name: 'Memory usage across world 9', state: 'disabled', date: Date.now(), id: uuidv4() },
    // { name: 'Memory usage across world 10', state: 'disabled', date: Date.now(), id: uuidv4() },
    // { name: 'Memory usage across world 11', state: 'disabled', date: Date.now(), id: uuidv4() },
    // { name: 'Memory usage across world 12', state: 'disabled', date: Date.now(), id: uuidv4() },
    // { name: 'Memory usage across world 13', state: 'disabled', date: Date.now(), id: uuidv4() },
    // { name: 'Memory usage across world 14', state: 'disabled', date: Date.now(), id: uuidv4() },
    // { name: 'Memory usage across world 15', state: 'disabled', date: Date.now(), id: uuidv4() },
    // { name: 'Memory usage across world 16', state: 'disabled', date: Date.now(), id: uuidv4() },
    // { name: 'Memory usage across world 17', state: 'disabled', date: Date.now(), id: uuidv4() },
    // { name: 'Memory usage across world 18', state: 'disabled', date: Date.now(), id: uuidv4() },
    // { name: 'Memory usage across world 19', state: 'disabled', date: Date.now(), id: uuidv4() },
    // { name: 'Memory usage across world 20', state: 'disabled', date: Date.now(), id: uuidv4() },
  ];
  const empty = (
    <EuiEmptyPrompt
      title={<h3>No monitors to display</h3>}
      titleSize="s"
      body={`There are no alerting monitors associated with ${title} visualization. You will need to add a monitor to the visualization to be able to list it here`}
      actions={
        <EuiButton fill onClick={() => setPanel('add')}>
          Add alerting monitor
        </EuiButton>
      }
    />
  );
  const tableProps = {
    items: monitors,
    columns,
    search: {
      box: {
        disabled: monitors.length === 0,
        incremental: true,
        schema: true,
      },
    },
    hasActions: true,
    pagination: true,
    sorting: true,
    message: empty,
  };

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
