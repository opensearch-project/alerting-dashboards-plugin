import React from 'react';
import {
  EuiContextMenu,
  EuiLink,
  EuiText,
  EuiHorizontalRule,
  EuiCallOut,
  EuiSpacer,
} from '@elastic/eui';
import { views } from '../helpers';
import ManageMonitors from './ManageMonitors';

const InitialMenu = ({ setView, monitors }) => (
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
              onClick: () => setView(views.createAlertingMonitor),
            },
            ...(monitors.length
              ? [
                  {
                    name: `Manage monitors (${monitors.length})`,
                    icon: 'wrench',
                    panel: 1,
                  },
                ]
              : []),
            {
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
          title: 'Manage Monitors',
          content: <ManageMonitors monitors={monitors} />,
        },
      ],
    }}
  />
);

export default InitialMenu;
