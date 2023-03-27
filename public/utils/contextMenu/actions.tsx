/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiIconType } from '@elastic/eui/src/components/icon/icon';
import { toMountPoint } from '../../../../../src/plugins/opensearch_dashboards_react/public';
import { createAlertingAction } from '../../actions/alerting_dashboard_action';
import { Action } from '../../../../../src/plugins/ui_actions/public';
import DocumentationTitle from '../../components/FeatureAnywhereContextMenu/DocumentationTitle';
import Container from '../../components/FeatureAnywhereContextMenu/Container';

export const openContainerInFlyout = async ({ core, defaultFlyoutMode, embeddable }) => {
  const services = await core.getStartServices();
  const openFlyout = services[0].overlays.openFlyout;
  const overlay = openFlyout(
    toMountPoint(
      <Container
        {...{
          defaultFlyoutMode,
          embeddable,
          closeFlyout: () => overlay.close(),
          core,
          services,
        }}
      />
    ),
    { size: 'm', className: 'context-menu__flyout' }
  );
};

// This is used to create all actions in the same context menu
const grouping: Action['grouping'] = [
  {
    id: 'alerting-dashboard-context-menu',
    getDisplayName: () => 'Alerting',
    getIconType: () => 'bell',
  },
];

export const getActions = ({ core }) =>
  [
    {
      grouping,
      id: 'addAlertingMonitor',
      title: i18n.translate('dashboard.actions.alertingMenuItem.addAlertingMonitor.displayName', {
        defaultMessage: 'Add alerting monitor',
      }),
      icon: 'plusInCircle' as EuiIconType,
      order: 100,
      onClick: ({ embeddable }) =>
        openContainerInFlyout({ core, embeddable, defaultFlyoutMode: 'create' }),
    },
    {
      grouping,
      id: 'associatedMonitors',
      title: i18n.translate('dashboard.actions.alertingMenuItem.associatedMonitors.displayName', {
        defaultMessage: 'Associated monitors',
      }),
      icon: 'gear' as EuiIconType,
      order: 99,
      onClick: ({ embeddable }) =>
        openContainerInFlyout({ core, embeddable, defaultFlyoutMode: 'associated' }),
    },
    {
      id: 'documentation',
      title: <DocumentationTitle />,
      icon: 'documentation' as EuiIconType,
      order: 98,
      onClick: () => {
        window.open(
          'https://opensearch.org/docs/latest/monitoring-plugins/alerting/index/',
          '_blank'
        );
      },
    },
  ].map((options) => createAlertingAction({ ...options, grouping }));
