import React, { useState, useEffect } from 'react';
import AssociatedMonitors from '../AssociatedMonitors';
import AddAlertingMonitor from '../AddAlertingMonitor';
import './styles.scss';

const Container = ({ startingFlyout, startingFlyoutSize, ...props }) => {
  const [flyout, setFlyout] = useState(startingFlyout);

  const Flyout = {
    associated: AssociatedMonitors,
    add: AddAlertingMonitor,
  }[flyout];

  return <Flyout {...{ setFlyout, ...props }} />;
};

export default Container;
