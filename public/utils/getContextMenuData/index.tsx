import React from 'react';
import {
  EuiContextMenu,
  EuiLink,
  EuiText,
  EuiCallOut,
  EuiSpacer,
  EuiIcon,
  EuiToolTip,
} from '@elastic/eui';
import { v4 as uuid } from 'uuid';
import ManageMonitors from '../../components/ContextMenu/ManageMonitors';
import ViewAlerts from '../../components/ContextMenu/ViewAlerts';
import CreateAlertingMonitor from '../../components/ContextMenu/CreateAlertingMonitor';
import './styles.scss';

export function getContextMenuData(context) {
  const alerts = [];
  const monitors = [];
  const setView = () => null;

  const alertsId = uuid();
  const createAlertingMonitorId = uuid();
  const manageMonitorsId = uuid();
  const viewAlertsByTriggerId = uuid();
  const additionalFirstPanelItems = [
    {
      name: 'Alerts',
      icon: 'bell',
      panel: alertsId,
    },
    {
      isSeparator: true,
      key: 'sep',
    },
    {
      name: (
        <EuiText color="success" className="alerting-dashboards-context-menu__view-events-text">
          <h5>View events:</h5>
        </EuiText>
      ),
      className: 'alerting-dashboards-context-menu__no-action',
    },
    {
      name: alerts.length ? (
        `Alerts (${alerts.length})`
      ) : (
        <EuiText>
          Alerts{' '}
          <EuiToolTip position="left" content="Here is some tooltip text">
            <EuiLink href="#">
              <EuiIcon type="questionInCircle" />
            </EuiLink>
          </EuiToolTip>
        </EuiText>
      ),
      icon: 'bell',
      panel: viewAlertsByTriggerId,
      className: alerts.length ? '' : 'alerting-dashboards-context-menu__no-action',
      disabled: !alerts.length,
    },
  ];
  const additionalPanels = [
    {
      id: alertsId,
      width: 300,
      title: 'Alerts',
      items: [
        {
          name: 'Create alerting monitor',
          icon: 'plusInCircle',
          panel: createAlertingMonitorId,
        },
        {
          name: `Manage monitors${monitors.length ? ` (${monitors.length})` : ''}`,
          icon: 'wrench',
          panel: manageMonitorsId,
        },
        {
          isSeparator: true,
          key: 'sep',
        },
        {
          className: 'alerting-dashboards-context-menu__text-content',
          name: (
            <>
              <EuiText size="xs">
                Learn more about{' '}
                <EuiLink href="#" external>
                  Alerts Anywhere
                </EuiLink>
              </EuiText>
              <EuiSpacer size="m" />
              <EuiCallOut>
                <EuiText size="xs">
                  Share your feedback for the feature by creating on issue on{' '}
                  <EuiLink href="#" external>
                    GitHub
                  </EuiLink>
                </EuiText>
              </EuiCallOut>
            </>
          ),
        },
      ],
    },
    {
      id: createAlertingMonitorId,
      width: 400,
      title: 'Create Alerting Monitor',
      content: <CreateAlertingMonitor {...{ setView }} />,
    },
    {
      id: manageMonitorsId,
      width: 400,
      title: 'Manage Monitors',
      content: <ManageMonitors {...{ setView, monitors }} />,
    },
    {
      id: viewAlertsByTriggerId,
      width: 400,
      title: 'View Alerts by Trigger',
      content: <ViewAlerts {...{ alerts }} />,
    },
  ];
  return { additionalFirstPanelItems, additionalPanels, additionalFirstPanelItemsOrder: 100 };
}
