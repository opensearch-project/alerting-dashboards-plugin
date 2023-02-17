import React from 'react';
import { EuiIcon, EuiFlexItem, EuiFlexGroup } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { EuiIconType } from '@elastic/eui/src/components/icon/icon';
import { toMountPoint } from '../../../../src/plugins/opensearch_dashboards_react/public';
import CreateAlertingMonitor from '../components/FeatureAnywhereContextMenu/CreateAlertingMonitor';
import AssociatedMonitors from '../components/FeatureAnywhereContextMenu/AssociatedMonitors';
import { createAlertingAction } from '../actions/alerting_dashboard_action';
import { Action } from '../../../../src/plugins/ui_actions/public';

// This is used to create all actions in the same context menu
const grouping: Action['grouping'] = [
  {
    id: 'alerting-dashboard-context-menu',
    getDisplayName: () => 'Alerting',
    getIconType: () => 'bell',
  },
];

const DocumentationTitle = () => (
  <EuiFlexGroup>
    <EuiFlexItem>
      {i18n.translate('dashboard.actions.alertingMenuItem.documentation.displayName', {
        defaultMessage: 'Documentation',
      })}
    </EuiFlexItem>
    <EuiFlexItem grow={false}>
      <EuiIcon type="popout" />
    </EuiFlexItem>
  </EuiFlexGroup>
);

export const getActions = ({ core, plugins }) =>
  [
    {
      grouping,
      id: 'createAlertingMonitor',
      title: i18n.translate(
        'dashboard.actions.alertingMenuItem.createAlertingMonitor.displayName',
        {
          defaultMessage: 'Add alerting monitor',
        }
      ),
      icon: 'plusInCircle' as EuiIconType,
      order: 100,
      onClick: async ({ embeddable }) => {
        const services = await core.getStartServices();
        const openFlyout = services[0].overlays.openFlyout;
        const overlay = openFlyout(
          toMountPoint(
            <CreateAlertingMonitor
              {...{ embeddable, plugins, closeFlyout: () => overlay.close(), core, services }}
            />
          ),
          { size: 'l', className: 'create-alerting-monitor__flyout' }
        );
      },
    },
    {
      grouping,
      id: 'manageMonitors',
      title: i18n.translate('dashboard.actions.alertingMenuItem.manageMonitors.displayName', {
        defaultMessage: 'Associated monitors',
      }),
      icon: 'gear' as EuiIconType,
      order: 99,
      onClick: async ({ embeddable }) => {
        const services = await core.getStartServices();
        const openFlyout = services[0].overlays.openFlyout;
        const overlay = openFlyout(
          toMountPoint(
            <AssociatedMonitors
              {...{ embeddable, plugins, closeFlyout: () => overlay.close(), core, services }}
            />
          ),
          { size: 'm' }
        );
      },
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
