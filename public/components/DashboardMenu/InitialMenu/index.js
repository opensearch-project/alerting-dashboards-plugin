import React from 'react';
import {
  EuiContextMenu,
  EuiLink,
  EuiText,
  EuiHorizontalRule,
  EuiCallOut,
  EuiSpacer,
} from '@elastic/eui';
import ManageMonitors from './ManageMonitors';
import ViewAlerts from './ViewAlerts';
import CreateAlertingMonitor from './CreateAlertingMonitor';
import './styles.scss';

const InitialMenu = ({ setView, monitors, alerts, setAlerts, setMonitors }) => (
  <EuiContextMenu
    {...{
      initialPanelId: 0,
      panels: [
        {
          id: 0,
          width: 300,
          title: 'Alerts',
          items: [
            {
              name: 'Create alerting monitor',
              icon: 'plusInCircle',
              panel: 1,
            },
            {
              name: `View alerts${alerts.length ? ` (${alerts.length})` : ''}`,
              icon: 'bell',
              panel: 2,
            },
            {
              name: `Manage monitors${monitors.length ? ` (${monitors.length})` : ''}`,
              icon: 'wrench',
              panel: 3,
            },
            {
              className: 'initial-menu__text-content',
              name: (
                <>
                  <EuiHorizontalRule margin="none" />
                  <EuiSpacer size="m" />
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
          id: 1,
          initialFocusedItemIndex: 0,
          width: 400,
          title: 'Create Alerting Monitor',
          content: <CreateAlertingMonitor {...{ setView, setAlerts, setMonitors }} />,
        },
        {
          id: 2,
          initialFocusedItemIndex: 0,
          width: 400,
          title: 'View Alerts',
          content: <ViewAlerts {...{ alerts }} />,
        },
        {
          id: 3,
          initialFocusedItemIndex: 0,
          width: 400,
          title: 'Manage Monitors',
          content: <ManageMonitors {...{ setView, monitors }} />,
        },
      ],
    }}
  />
);

export default InitialMenu;
