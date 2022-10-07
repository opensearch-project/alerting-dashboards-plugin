export const views = {
  home: 'home',
  createAlertingMonitorExpanded: 'create-alerting-monitor-expanded',
  manageMonitor: 'manage-monitor',
};

export const getInitialMonitors = () => [
  { name: 'Some monitor', last: Date.now(), status: 'success', id: 1 },
  { name: 'Another monitor here', last: Date.now(), status: 'warning', id: 2 },
  { name: 'Additional monitor', last: Date.now(), status: 'danger', id: 3 },
];

export const dateOptions = {
  year: '2-digit',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
  hour12: true,
  timeZone: 'America/Los_Angeles',
};

export const getInitialAlerts = () => [];
