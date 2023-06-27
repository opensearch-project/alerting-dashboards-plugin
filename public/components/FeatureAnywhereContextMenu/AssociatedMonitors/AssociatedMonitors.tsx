import React, { useCallback, useState } from 'react';
import {
  EuiFlyout,
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
} from '@elastic/eui';
import './styles.scss';
import { useColumns } from './helpers';
import { ConfirmUnlinkDetectorModal } from './ConfirmUnlinkModal';
import { deleteAlertingAugmentVisSavedObj } from '../../../utils/savedObjectHelper';
import { getNotifications } from '../../../services';

const AssociatedMonitors = ({ embeddable, closeFlyout, setFlyoutMode, monitors, isAssociateAllowed, limitReachedCallout, state }) => {
  const title = embeddable.vis.title;
  const [modalState, setModalState] = useState(undefined);
  const notifications = getNotifications();
  const onUnlink = useCallback((item) => {
    setModalState({
      monitor: {
        name: item.name,
        id: item.id,
      },
    });
  }, []);
  const onEdit = useCallback(
    (item) => {
      window.open(`alerting#/monitors/${item.id}?action=update-monitor`, '_blank');
      // closeFlyout();
    },
    [closeFlyout]
  );
  const onUnlinkMonitor = useCallback(async () => {
    try {
      await deleteAlertingAugmentVisSavedObj(embeddable.vis.id, modalState.monitor.id);
      notifications.toasts.addSuccess({
        title: `Association removed between the ${modalState.monitor.name} monitor and the ${title} visualization`,
        text:
          "The monitor's alerts do not automatically appear on the visualization. Refresh your dashboard to update the visualization.",
      });
      // Need to remove the monitor the below does not work.
      // maybe need to export
      const newMonitors = monitors.filter((monitor) => monitor.id !== modalState.monitor.id);
      state.setMonitors(newMonitors);
    } catch (e) {
      notifications.toasts.addDanger(
        `Failed to remove the association between the "${modalState.monitor.name}" monitor with the ${title} visualization. Failed due to ${e.message}.`
      );
    } finally {
      handleHideModal();
    }
  }, [closeFlyout, modalState]);
  const columns = useColumns({ onUnlink, onEdit });
  const emptyMsg = (
    <EuiEmptyPrompt
      title={<h3>No monitors to display</h3>}
      titleSize="s"
      body={`There are no alerting monitors associated with ${title} visualization.`}
    />
  );
  const noResultsMsg = (
    <EuiEmptyPrompt
      title={<h3>No monitors to display</h3>}
      titleSize="s"
      body="There are no alerting monitors that match the search result."
    />
  );

  const loadingMsg = <EuiEmptyPrompt body={<EuiLoadingSpinner size="l" />} />;
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
    message: monitors ? (monitors.length ? noResultsMsg : emptyMsg) : loadingMsg,
    loading: !monitors,
  };

  const handleHideModal = useCallback(() => {
    setModalState(undefined);
  }, []);

  return (
    <div className="associated-monitors">
      {modalState ? (
        <ConfirmUnlinkDetectorModal
          monitor={modalState.monitor}
          onHide={handleHideModal}
          onConfirm={onUnlinkMonitor}
          isListLoading={!monitors}
        />
      ) : null}
      <EuiFlyoutHeader hasBorder>
        <EuiTitle>
          <h2 id="associated-monitors__title">Associated monitors</h2>
        </EuiTitle>
      </EuiFlyoutHeader>
      {!isAssociateAllowed && (
        <EuiFlyoutHeader>
          {limitReachedCallout}
        </EuiFlyoutHeader>
      )}
      <EuiFlyoutBody>
        <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
          <EuiFlexItem>
            <EuiText>
              <h4>Visualization: {title}</h4>
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton iconType="link" isDisabled={!isAssociateAllowed} fill onClick={() => setFlyoutMode('existing')}>
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
