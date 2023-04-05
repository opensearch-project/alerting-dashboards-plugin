/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import uuidv4 from 'uuid/v4';
import { EuiTitle, EuiSpacer, EuiIcon, EuiText, EuiSwitch, EuiLoadingSpinner } from '@elastic/eui';
import CreateMonitor from '../../../../pages/CreateMonitor';
import { EmbeddablePanel } from '../../../../../../../src/plugins/embeddable/public';
import { NotificationService } from '../../../../services';
import './styles.scss';

function CreateNew({
  embeddable,
  closeFlyout,
  core,
  index,
  flyoutMode,
  onPreSubmitCallback,
  onPostSubmitCallback,
}) {
  const [isShowVis, setIsShowVis] = useState(false);
  const title = embeddable.getTitle();
  const history = {
    location: { pathname: '/create-monitor', search: '', hash: '', state: undefined },
    push: (value) => console.log('pushed', value),
    goBack: closeFlyout,
  };
  const notificationService = useMemo(() => new NotificationService(core.http), [core]);
  const createMonitorProps = {
    ...history,
    history,
    httpClient: core.http,
    // This is not expected to be used
    setFlyout: () => null,
    notifications: core.notifications,
    isDarkMode: core.isDarkMode,
    notificationService,
    edit: false,
    monitorToEdit: false,
    updateMonitor: () => null,
    staticContext: undefined,
    flyoutMode,
    defaultName: `${title} monitor ${uuidv4().substring(0, 4)}`,
    defaultIndex: index,
    defaultTimeField: embeddable.vis.data?.aggs.aggs[1].params.field.displayName,
    isDefaultTriggerEnabled: true,
    isDefaultMetricsEnabled: true,
    isDefaultNotificationEnabled: true,
    onPreSubmitCallback,
    onPostSubmitCallback,
    visualizationId: embeddable.vis.id,
  };

  return (
    <div className="create-new">
      <EuiText size="xs">
        <p>
          {flyoutMode === 'create' &&
            'Create query level monitor, associated with the visualization. Learn more in the documentation.'}
          {flyoutMode === 'adMonitor' &&
            'Set up and configure alerting monitor for the anomaly detector to receive notifications on visualization when anomalies detected.'}{' '}
          <a
            href="https://opensearch.org/docs/latest/monitoring-plugins/alerting/index/"
            target="_blank"
          >
            Learn more <EuiIcon type="popout" />
          </a>
        </p>
      </EuiText>
      <EuiSpacer size="m" />
      <div className="create-new__title-and-toggle">
        <EuiTitle size="xxs">
          <h4>
            <EuiIcon type="visLine" className="create-new__title-icon" />
            {title}
          </h4>
        </EuiTitle>
        <EuiSwitch
          label="Show visualization"
          checked={isShowVis}
          onChange={() => setIsShowVis(!isShowVis)}
        />
      </div>
      <div className={`create-new__vis ${!isShowVis && 'create-new__vis--hidden'}`}>
        <EuiSpacer size="s" />
        <EmbeddablePanel
          embeddable={embeddable}
          getActions={() => Promise.resolve([])}
          inspector={{ isAvailable: () => false }}
          hideHeader
          isDestroyPrevented
          isBorderless
        />
      </div>
      <EuiSpacer size="l" />
      <EuiTitle size="s">
        <h3>Monitor details</h3>
      </EuiTitle>
      <EuiSpacer size="m" />
      {!index && <EuiLoadingSpinner size="l" />}
      {/* Do not initialize until index is available */}
      {index && <CreateMonitor {...createMonitorProps} />}
    </div>
  );
}

export default CreateNew;
