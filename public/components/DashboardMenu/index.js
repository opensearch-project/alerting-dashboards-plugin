import React, { useState } from 'react';
import InitialMenu from './InitialMenu';
import CreateAlertingMonitor from './CreateAlertingMonitor';
import { getInitialMonitors, views } from './helpers';

const DashboardMenu = () => {
  const [view, setView] = useState('home');
  const [monitors, setMonitors] = useState(getInitialMonitors());

  if (view === views.createAlertingMonitor) {
    return <CreateAlertingMonitor {...{ setMonitors }} />;
  }

  return <InitialMenu {...{ setView, monitors }} />;
};

export default DashboardMenu;
