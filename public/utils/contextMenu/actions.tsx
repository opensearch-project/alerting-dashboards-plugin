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

export const ALERTING_ACTION_CONTEXT = 'ALERTING_ACTION_CONTEXT';
export const ALERTING_ACTION_CONTEXT_GROUP_ID = 'ALERTING_ACTION_CONTEXT_GROUP_ID';
export const ALERTING_ACTION_ADD_ID = 'ALERTING_ACTION_ADD_ID';
export const ALERTING_ACTION_ASSOCIATED_ID = 'ALERTING_ACTION_ASSOCIATED_ID';
export const ALERTING_ACTION_DOC_ID = 'ALERTING_ACTION_DOC_ID';
export const ALERTING_ACTION_AD = 'ALERTING_ACTION_AD';
export const ALERTING_TRIGGER_AD_ID = 'ALERTING_TRIGGER_AD_ID';

declare module '../../../../../src/plugins/ui_actions/public' {
  export interface ActionContextMapping {
    [ALERTING_ACTION_CONTEXT]: {};
    [ALERTING_ACTION_AD]: {};
  }
}

export const openContainerInFlyout = async ({
  core,
  defaultFlyoutMode,
  embeddable,
  plugins,
  detectorId,
}: {
  core: any;
  defaultFlyoutMode: string;
  embeddable: any;
  plugins: any;
  detectorId?: string;
}) => {
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
          plugins,
          detectorId,
        }}
      />
    ),
    { size: 'm', className: 'context-menu__flyout' }
  );
};

// This is used to create all actions in the same context menu
const grouping: Action['grouping'] = [
  {
    id: ALERTING_ACTION_CONTEXT_GROUP_ID,
    getDisplayName: () => 'Alerting',
    getIconType: () => 'bell',
  },
];

export const getActions = ({ core, plugins }) =>
  [
    {
      id: ALERTING_ACTION_ADD_ID,
      title: i18n.translate('dashboard.actions.alertingMenuItem.addAlertingMonitor.displayName', {
        defaultMessage: 'Add alerting monitor',
      }),
      icon: 'plusInCircle' as EuiIconType,
      order: 100,
      onExecute: ({ embeddable }) =>
        openContainerInFlyout({ core, embeddable, plugins, defaultFlyoutMode: 'create' }),
    },
    {
      id: ALERTING_ACTION_ASSOCIATED_ID,
      title: i18n.translate('dashboard.actions.alertingMenuItem.associatedMonitors.displayName', {
        defaultMessage: 'Associated monitors',
      }),
      icon: 'gear' as EuiIconType,
      order: 99,
      onExecute: ({ embeddable }) =>
        openContainerInFlyout({ core, embeddable, plugins, defaultFlyoutMode: 'associated' }),
    },
    {
      id: ALERTING_ACTION_DOC_ID,
      title: <DocumentationTitle />,
      icon: 'documentation' as EuiIconType,
      order: 98,
      onExecute: () => {
        window.open(
          'https://opensearch.org/docs/latest/monitoring-plugins/alerting/index/',
          '_blank'
        );
      },
    },
  ].map((options) => createAlertingAction({ ...options, grouping, type: ALERTING_ACTION_CONTEXT }));

export const getAdAction = ({ core, plugins }) =>
  createAlertingAction({
    type: ALERTING_ACTION_AD,
    grouping: [],
    id: ALERTING_TRIGGER_AD_ID,
    title: ALERTING_TRIGGER_AD_ID,
    icon: '' as EuiIconType,
    order: 1,
    onExecute: ({ embeddable, detectorId }) =>
      openContainerInFlyout({
        core,
        embeddable,
        plugins,
        detectorId,
        defaultFlyoutMode: 'adMonitor',
      }),
  });
