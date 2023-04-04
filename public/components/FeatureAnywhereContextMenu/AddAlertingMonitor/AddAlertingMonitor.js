/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
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
  EuiFormFieldset,
  EuiCheckableCard,
} from '@elastic/eui';
import './styles.scss';
import CreateNew from './CreateNew';
import AssociateExisting from './AssociateExisting';

function AddAlertingMonitor({
  embeddable,
  closeFlyout,
  core,
  services,
  flyoutMode,
  setFlyoutMode,
  monitors,
  selectedMonitorId,
  setSelectedMonitorId,
  index,
}) {
  const onCreate = () => {
    const event = new Event('createMonitor');
    document.dispatchEvent(event);
    closeFlyout();
  };

  return (
    <div className="add-alerting-monitor">
      <EuiFlyoutHeader hasBorder>
        <EuiTitle>
          <h2 id="add-alerting-monitor__title">
            {flyoutMode === 'adMonitor' ? 'Set up alerts' : 'Add alerting monitor'}
          </h2>
        </EuiTitle>
      </EuiFlyoutHeader>
      <EuiFlyoutBody>
        <div className="add-alerting-monitor__scroll">
          {flyoutMode !== 'adMonitor' && (
            <>
              <EuiFormFieldset
                legend={{
                  display: 'hidden',
                  children: (
                    <EuiTitle>
                      <span>Options to create a new monitor or associate an existing monitor</span>
                    </EuiTitle>
                  ),
                }}
                className="add-alerting-monitor__modes"
              >
                {[
                  {
                    id: 'add-alerting-monitor__create',
                    label: 'Create new monitor',
                    value: 'create',
                  },
                  {
                    id: 'add-alerting-monitor__existing',
                    label: 'Associate existing monitor',
                    value: 'existing',
                  },
                ].map((option) => (
                  <EuiCheckableCard
                    {...{
                      ...option,
                      key: option.id,
                      name: option.id,
                      checked: option.value === flyoutMode,
                      onChange: () => setFlyoutMode(option.value),
                    }}
                  />
                ))}
              </EuiFormFieldset>
              <EuiSpacer size="m" />
            </>
          )}
          {['create', 'adMonitor'].includes(flyoutMode) && (
            <CreateNew {...{ embeddable, closeFlyout, core, services, index, flyoutMode }} />
          )}
          {flyoutMode === 'existing' && (
            <AssociateExisting
              {...{
                embeddable,
                closeFlyout,
                core,
                services,
                monitors,
                selectedMonitorId,
                setSelectedMonitorId,
              }}
            />
          )}
          <EuiSpacer size="l" />
        </div>
      </EuiFlyoutBody>
      <EuiFlyoutFooter>
        <EuiFlexGroup justifyContent="spaceBetween">
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty onClick={closeFlyout}>Cancel</EuiButtonEmpty>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton onClick={onCreate} fill>
              {flyoutMode === 'existing' ? 'Associate' : 'Create'} monitor
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlyoutFooter>
    </div>
  );
}

export default AddAlertingMonitor;
