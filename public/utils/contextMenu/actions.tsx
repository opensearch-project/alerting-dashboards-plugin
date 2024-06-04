/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiIconType } from '@elastic/eui/src/components/icon/icon';
import { toMountPoint } from '../../../../../src/plugins/opensearch_dashboards_react/public';
import { createAlertingAction } from '../../actions/alerting_dashboard_action';
import { Action } from '../../../../../src/plugins/ui_actions/public';
import DocumentationTitle from '../../components/FeatureAnywhereContextMenu/DocumentationTitle';
import Container from '../../components/FeatureAnywhereContextMenu/Container';
import { getOverlays, getSavedObjectsClient, setDataSource } from '../../services';

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

interface References {
  id: string;
  name: string;
  type: string;
}

export const openContainerInFlyout = async ({
  defaultFlyoutMode,
  embeddable,
  detectorId,
}: {
  defaultFlyoutMode: string;
  embeddable: any;
  detectorId?: string;
}) => {
  const indexPatternId = embeddable.vis.data.aggs.indexPattern.id;
  await setDataSourceIdFromSavedObject(indexPatternId);
  const clonedEmbeddable = await _.cloneDeep(embeddable);
  const overlayService = getOverlays();
  const openFlyout = overlayService.openFlyout;
  const overlay = openFlyout(
    toMountPoint(
      <Container
        {...{
          defaultFlyoutMode,
          embeddable: clonedEmbeddable,
          closeFlyout: () => overlay.close(),
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
    category: 'vis_augmenter',
    order: 30,
  },
];

export const getActions = () =>
  [
    {
      id: ALERTING_ACTION_ADD_ID,
      title: i18n.translate('dashboard.actions.alertingMenuItem.addAlertingMonitor.displayName', {
        defaultMessage: 'Add alerting monitor',
      }),
      icon: 'plusInCircle' as EuiIconType,
      order: 100,
      onExecute: ({ embeddable }) =>
        openContainerInFlyout({ embeddable, defaultFlyoutMode: 'create' }),
    },
    {
      id: ALERTING_ACTION_ASSOCIATED_ID,
      title: i18n.translate('dashboard.actions.alertingMenuItem.associatedMonitors.displayName', {
        defaultMessage: 'Associated monitors',
      }),
      icon: 'kqlSelector' as EuiIconType,
      order: 99,
      onExecute: ({ embeddable }) =>
        openContainerInFlyout({ embeddable, defaultFlyoutMode: 'associated' }),
    },
    {
      id: ALERTING_ACTION_DOC_ID,
      title: <DocumentationTitle />,
      icon: 'documentation' as EuiIconType,
      order: 98,
      onExecute: () => {
        window.open(
          'https://opensearch.org/docs/latest/observing-your-data/alerting/dashboards-alerting/',
          '_blank'
        );
      },
    },
  ].map((options) => createAlertingAction({ ...options, grouping, type: ALERTING_ACTION_CONTEXT }));

export const getAdAction = () =>
  createAlertingAction({
    type: ALERTING_ACTION_AD,
    grouping: [],
    id: ALERTING_TRIGGER_AD_ID,
    title: ALERTING_TRIGGER_AD_ID,
    icon: '' as EuiIconType,
    order: 1,
    onExecute: ({ embeddable, detectorId }) =>
      openContainerInFlyout({
        embeddable,
        detectorId,
        defaultFlyoutMode: 'adMonitor',
      }),
  });

async function setDataSourceIdFromSavedObject(indexPatternId: string) {
  try {
    const indexPattern = await getSavedObjectsClient().get('index-pattern', indexPatternId);
    const refs = indexPattern.references as References[];
    const foundRef = refs.find(ref => ref.type === 'data-source');
    const dataSourceId = foundRef ? foundRef.id : ''; 
    setDataSource({ dataSourceId });
  } catch (error) {
    console.error("Error fetching index pattern:", error);
  }
}

