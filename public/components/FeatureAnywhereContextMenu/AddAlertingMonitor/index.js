import React, { useState } from 'react';
import {
  EuiFlexItem,
  EuiFlexGroup,
  EuiFlyoutHeader,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiTitle,
  EuiSpacer,
  EuiButton,
  EuiButtonEmpty,
} from '@elastic/eui';
import './styles.scss';
import CreateMonitor from '../../../pages/CreateMonitor';
import { EmbeddablePanel } from '../../../../../../src/plugins/embeddable/public';

function AddAlertingMonitor({ embeddable, closeFlyout, core, services }) {
  const [isShowVis, setIsShowVis] = useState(true);
  const title = embeddable.getTitle();
  const toggleVis = () => {
    const flyoutEl = document.querySelector('.add-alerting-monitor__flyout');
    const small = 'euiFlyout--small';
    const large = 'euiFlyout--large';

    // If currently showing vis, then shrink width of flyout
    if (isShowVis) {
      flyoutEl.classList.remove(large);
      flyoutEl.classList.add(small);
    } else {
      flyoutEl.classList.remove(small);
      flyoutEl.classList.add(large);
    }

    setIsShowVis(!isShowVis);
  };
  const onCreate = () => {
    const event = new Event('createMonitor');
    document.dispatchEvent(event);
    closeFlyout();
  };
  const history = {
    location: { pathname: '/create-monitor', search: '', hash: '', state: undefined },
    push: (value) => console.log('pushed', value),
    goBack: closeFlyout,
  };
  const createMonitorProps = {
    ...history,
    history,
    httpClient: core.http,
    // This is not expected to be used
    setFlyout: () => null,
    notifications: core.notifications,
    isDarkMode: core.isDarkMode,
    notificationService: services.notificationService,
    edit: false,
    monitorToEdit: false,
    updateMonitor: () => null,
    staticContext: undefined,
    isMinimal: true,
  };

  return (
    <div className="add-alerting-monitor">
      <EuiFlyoutHeader hasBorder>
        <EuiTitle>
          <h2 id="add-alerting-monitor__title">Create alerting monitor</h2>
        </EuiTitle>
      </EuiFlyoutHeader>
      <EuiFlyoutBody>
        <EuiFlexGroup className="add-alerting-monitor__flex-group">
          <EuiFlexItem
            className={`add-alerting-monitor__vis ${
              !isShowVis && 'add-alerting-monitor__vis--hidden'
            }`}
          >
            <div className="add-alerting-monitor__vis">
              <EuiTitle size="xxs">
                <h4>{title}</h4>
              </EuiTitle>
              <EuiSpacer size="s" />
              <EmbeddablePanel
                embeddable={embeddable}
                getActions={() => Promise.resolve([])}
                inspector={{ isAvailable: () => false }}
                hideHeader
                isRetained
              />
            </div>
          </EuiFlexItem>
          <EuiFlexItem
            className={`add-alerting-monitor__aside ${
              !isShowVis && 'add-alerting-monitor__aside--full'
            }`}
          >
            <EuiSpacer size="xs" />
            <EuiButton size="s" onClick={toggleVis}>
              Toggle Visualization
            </EuiButton>
            <EuiSpacer />
            <CreateMonitor {...createMonitorProps} />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlyoutBody>
      <EuiFlyoutFooter>
        <EuiFlexGroup justifyContent="spaceBetween">
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty onClick={closeFlyout}>Cancel</EuiButtonEmpty>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton onClick={onCreate} fill>
              Create monitor
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlyoutFooter>
    </div>
  );
}

export default AddAlertingMonitor;
