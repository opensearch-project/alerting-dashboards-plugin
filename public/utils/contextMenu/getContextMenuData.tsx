import React from 'react';
import {
  EuiLink,
  EuiText,
  EuiCallOut,
  EuiSpacer,
  EuiIcon,
  EuiToolTip,
  EuiContextMenuPanelDescriptor,
} from '@elastic/eui';
import { v4 as uuid } from 'uuid';
import ManageMonitors from '../../components/contextMenu/ManageMonitors';
import ViewAlerts from '../../components/contextMenu/ViewAlerts';
import CreateAlertingMonitor from '../../components/contextMenu/CreateAlertingMonitor';
import FormikWrapper from '../../components/contextMenu/FormikWrapper';
import './styles.scss';
import { getInitialValues } from './helpers';
import { GetActionContextMenuDataArgs, Action } from '../../../../../src/plugins/ui_actions/public';

export const getContextMenuData: Action['getContextMenuData'] = (
  options: GetActionContextMenuDataArgs
) => {
  const initialValues = getInitialValues();
  const { alerts, monitors } = initialValues;
  const getFormikOptions = () => ({
    initialValues,
    onSubmit: (values) => {
      console.log(values);
    },
  });
  const alertsId = uuid();
  const createAlertingMonitorId = uuid();
  const manageMonitorsId = uuid();
  const viewAlertsByTriggerId = uuid();
  const additionalFirstPanelGroups = [
    {
      name: 'Initial group',
      order: 11,
      items: [
        {
          name: 'Alerts',
          icon: 'bell',
          panel: alertsId,
        },
      ],
    },
    {
      name: 'View events',
      isTitleVisible: true,
      order: 10,
      items: [
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
      ],
    },
  ];
  const additionalPanels: EuiContextMenuPanelDescriptor[] = [
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
      content: (
        <FormikWrapper {...{ getFormikOptions }}>
          <CreateAlertingMonitor {...options} />
        </FormikWrapper>
      ),
    },
    {
      id: manageMonitorsId,
      width: 400,
      title: 'Manage Monitors',
      content: (
        <FormikWrapper {...{ getFormikOptions }}>
          <ManageMonitors />
        </FormikWrapper>
      ),
    },
    {
      id: viewAlertsByTriggerId,
      width: 400,
      title: 'View Alerts by Trigger',
      content: (
        <FormikWrapper {...{ getFormikOptions }}>
          <ViewAlerts />
        </FormikWrapper>
      ),
    },
  ];

  return {
    additionalFirstPanelGroups,
    additionalPanels,
  };
};
