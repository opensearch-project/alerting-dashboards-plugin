import React, { useState } from 'react';
import InitialMenu from './InitialMenu';
import CreateAlertingMonitorExpanded from './CreateAlertingMonitorExpanded';
import { getInitialMonitors, views, getInitialAlerts } from './helpers';

const DashboardMenu = () => {
  const [view, setView] = useState('home');
  const [alerts, setAlerts] = useState(getInitialAlerts());
  const [monitors, setMonitors] = useState(getInitialMonitors());

  if (view === views.createAlertingMonitorExpanded) {
    return <CreateAlertingMonitorExpanded {...{ setMonitors }} />;
  }

  return <InitialMenu {...{ setMonitors, setView, monitors, alerts, setAlerts }} />;
};

export default DashboardMenu;
