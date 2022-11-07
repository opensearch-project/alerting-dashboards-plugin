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
import ManageMonitors from './ManageMonitors';
import ViewAlerts from './ViewAlerts';
import CreateAlertingMonitor from './CreateAlertingMonitor';
import './styles.scss';

export const getContextMenuData = ({ setView = () => null, monitors = [], alerts = [] } = {}) => {
  const alertsId = uuid();
  const createAlertingMonitorId = uuid();
  const manageMonitorsId = uuid();
  const viewAlertsByTriggerId = uuid();
  const items = [
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
        <EuiText color="success" className="initial-menu__view-events-text">
          <h5>View events:</h5>
        </EuiText>
      ),
      className: 'initial-menu__no-action',
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
      className: alerts.length ? '' : 'initial-menu__no-action',
      disabled: !alerts.length,
    },
  ];
  const panels = [
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
          className: 'initial-menu__text-content',
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
  return { items, panels, order: 100 };
};

const InitialMenu = ({ setView, monitors, alerts }) => {
  const { panels, items } = getContextMenuData({ setView, monitors, alerts });
  const allPanels = [
    {
      id: uuid(),
      width: 300,
      name: 'Options',
      items,
    },
    ...panels,
  ];

  return (
    <EuiContextMenu
      {...{
        initialPanelId: allPanels[0].id,
        panels: allPanels,
      }}
    />
  );
};

export default InitialMenu;
