import React, { useState } from 'react';
import AssociatedMonitors from '../AssociatedMonitors';
import AddAlertingMonitor from '../AddAlertingMonitor';
import { useMonitors } from '../../../utils/contextMenu/monitors';
import './styles.scss';

const Container = ({ defaultFlyoutMode, ...props }) => {
  const { embeddable } = props;
  const index = [{ label: embeddable?.vis?.data?.indexPattern?.title }];
  const [flyoutMode, setFlyoutMode] = useState(defaultFlyoutMode);
  const [selectedMonitorId, setSelectedMonitorId] = useState();
  const monitors = useMonitors(embeddable);

  const Flyout = {
    associated: AssociatedMonitors,
    create: AddAlertingMonitor,
    existing: AddAlertingMonitor,
    adMonitor: AddAlertingMonitor,
  }[flyoutMode];

  return (
    <Flyout
      {...{
        ...props,
        monitors,
        selectedMonitorId,
        setSelectedMonitorId,
        flyoutMode,
        setFlyoutMode,
        index,
      }}
    />
  );
};

export default Container;
