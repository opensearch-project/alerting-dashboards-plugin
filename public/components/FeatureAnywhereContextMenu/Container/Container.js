import React, { useState } from 'react';
import AssociatedMonitors from '../AssociatedMonitors';
import AddAlertingMonitor from '../AddAlertingMonitor';
import { useMonitors } from '../../../utils/contextMenu/monitors';
import './styles.scss';

const Container = ({ startingFlyout, ...props }) => {
  const [mode, setMode] = useState(startingFlyout);
  const [selectedMonitorId, setSelectedMonitorId] = useState();
  const monitors = useMonitors();

  const Flyout = {
    associated: AssociatedMonitors,
    create: AddAlertingMonitor,
    existing: AddAlertingMonitor,
  }[mode];

  return (
    <Flyout
      {...{
        ...props,
        monitors,
        selectedMonitorId,
        setSelectedMonitorId,
        setMode,
        mode,
      }}
    />
  );
};

export default Container;
