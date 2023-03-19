import React, { useCallback } from 'react';
import {
  EuiFlyoutHeader,
  EuiTitle,
  EuiText,
  EuiSpacer,
  EuiInMemoryTable,
  EuiFlyoutBody,
  EuiEmptyPrompt,
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLoadingSpinner,
  EuiTextColor,
} from '@elastic/eui';
import './styles.scss';
import { useColumns } from './helpers';

const AssociatedMonitors = ({ embeddable, closeFlyout, setMode, monitors }) => {
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
  const columns = useColumns({ onUnlink, onEdit });
  const empty = (
    <EuiEmptyPrompt
      title={<h3>No monitors to display</h3>}
      titleSize="s"
      body={`There are no alerting monitors associated with ${title} visualization.`}
    />
  );
  const loading = <EuiEmptyPrompt body={<EuiLoadingSpinner size="l" />} />;
  const tableProps = {
    items: monitors || [],
    columns,
    search: {
      box: {
        disabled: !monitors || monitors.length === 0,
        incremental: true,
        schema: true,
      },
    },
    hasActions: true,
    pagination: true,
    sorting: true,
    message: monitors ? empty : loading,
  };

  return (
    <div className="associated-monitors">
      <EuiFlyoutHeader hasBorder>
        <EuiTitle>
          <h2 id="associated-monitors__title">
            Associated monitors{' '}
            {monitors && (
              <EuiTextColor color={monitors.length > 0 ? 'default' : 'subdued'}>
                ({monitors.length})
              </EuiTextColor>
            )}
          </h2>
        </EuiTitle>
      </EuiFlyoutHeader>
      <EuiFlyoutBody>
        <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
          <EuiFlexItem>
            <EuiText>
              <h4>{title}</h4>
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton iconType="link" fill onClick={() => setMode('existing')}>
              Associate a monitor
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="l" />
        <EuiInMemoryTable {...tableProps} />
      </EuiFlyoutBody>
    </div>
  );
};

export default AssociatedMonitors;
