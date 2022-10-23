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
import ManageMonitors from './ManageMonitors';
import ViewAlerts from './ViewAlerts';
import CreateAlertingMonitor from './CreateAlertingMonitor';
import './styles.scss';

const InitialMenu = ({ setView, monitors, alerts }) => (
  <EuiContextMenu
    {...{
      initialPanelId: 0,
      panels: [
        {
          id: 0,
          width: 300,
          title: 'Options',
          items: [
            {
              name: 'Alerts',
              icon: 'bell',
              panel: 1,
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
              panel: 4,
              className: alerts.length ? '' : 'initial-menu__no-action',
              disabled: !alerts.length,
            },
          ],
        },
        {
          id: 1,
          width: 300,
          title: 'Alerts',
          items: [
            {
              name: 'Create alerting monitor',
              icon: 'plusInCircle',
              panel: 2,
            },
            {
              name: `Manage monitors${monitors.length ? ` (${monitors.length})` : ''}`,
              icon: 'wrench',
              panel: 3,
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
          id: 2,
          width: 400,
          title: 'Create Alerting Monitor',
          content: <CreateAlertingMonitor {...{ setView }} />,
        },
        {
          id: 3,
          width: 400,
          title: 'Manage Monitors',
          content: <ManageMonitors {...{ setView, monitors }} />,
        },
        {
          id: 4,
          width: 400,
          title: 'View Alerts by Trigger',
          content: <ViewAlerts {...{ alerts }} />,
        },
      ],
    }}
  />
);

export default InitialMenu;
