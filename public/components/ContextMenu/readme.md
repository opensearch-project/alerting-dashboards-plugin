# Components
This document's goal is to outline the components used to create the DashboardMenu.

## Structure
The DashboardMenu is wrapped by a Formik provider that serves as a store for all values entered within the component. The component is either showing a `EuiContextMenu` that is generated using Elastic UI, or a `EuiFlyout`.

## Screens
- InitialMenu: This menu system provides a way to view alerts, monitors, and create new ones.
- CreateAlertingMonitorExpanded: Shown when in the expanded mode of creating an alert. This component shows the visualization from the original dashboard panel.

## Common components
- Notifications: This component allows users to review and manage notifications based on an alerting monitor. This is a more compact version than what is found within the main alerting plugin screens.
- SeverityLevel: This component allows users to select, on a 1 to 5 scale, the level of severity for an alerting monitor they are managing or creating. A similar component exists within the main alerting plugin screens.

## InitialMenu components
- CreateAlertingMonitor: This component is used create an alerting monitor in a quick way, with default settings and only a minor amount of customization. If the user wishes to, they can expand into the `CreateAlertingMonitorExpanded` screen to see more options.
- ManageMonitors: This component is used to show a list of monitors. Each monitor shows a health status, a disable button, the time of last alert, and a button to edit the monitor. 
- ViewAlerts: This component displays a list of alerts. Each alert has a severity level, the tally of alarms, the reason the alert is triggered, and the time of last occurrence.

## CreateAlertingMonitorExpanded components
- Advanced: This borrows components from the main alerting plugin screen. It provides options to change the metrics, time range, data filter, groups, and performance of a query of an alerting monitor.
- MonitorDetails :This is a simple component that allows editing the monitor name, description, and frequency the monitor runs.
- Triggers: This component allows creating and managing triggers for an alerting monitor. Each trigger can be removed or edited. Editing allows changing the name, conditions (such as average above a threshold), severity level of monitor, and managing notifications related to the trigger.