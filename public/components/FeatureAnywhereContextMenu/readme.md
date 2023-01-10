# ContextMenu Feature
This document's goal is to outline the components used to create the Dashboard context menu.

## How it is used
The contxt menu options are created within `public/plugin.tsx` by looping through a given set of actions and creating them with functions found in `public/actions/alerting_dashboard_action.tsx`. These actions are then automatically added to the Dashboard if the embeddable is compatible. Actions are grouped within an `Alerts` menu option. When an action is triggered, the `execute` function will run, usually causing a Flyout or a link to open, depending on the action.

## CreateAlertingMonitor component
This is the screen for creating new monitors. The component uses Formik to store form state. In a flyout it shows the same visualization from the dashboard and a group of accordion options for creating a new monitor. Here is a quick summary of the accordions:

- MonitorDetails: This is a simple component that allows editing the monitor name, description, and frequency the monitor runs.
- Advanced: This provides options to change the metrics, time range, data filter, groups, and performance of a query of an alerting monitor.
- Triggers: This component allows creating and managing triggers for an alerting monitor. Each trigger can be removed or edited. Editing allows changing the name, conditions (such as average above a threshold), severity level of monitor, and managing notifications related to the trigger.

## ManageMonitors component
This component displays a list of monitors within a narrow Flyout. The list is dynamically generated based on the embeddable and context. A user can Edit or Disable a monitor from this screen.