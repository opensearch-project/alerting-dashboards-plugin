import React, { useState } from 'react';
import AssociatedMonitors from '../AssociatedMonitors';
import AddAlertingMonitor from '../AddAlertingMonitor';
import { useMonitors } from '../../../utils/contextMenu/monitors';
import { useAllMonitors } from '../../../utils/contextMenu/allMonitors';
import { CoreContext } from '../../../utils/CoreContext';
import './styles.scss';

const Container = ({ defaultFlyoutMode, ...props }) => {
  const { embeddable, core } = props;
  const index = [{ label: embeddable?.vis?.data?.indexPattern?.title }];
  const [flyoutMode, setFlyoutMode] = useState(defaultFlyoutMode);
  const [selectedMonitorId, setSelectedMonitorId] = useState();
  const monitors = useMonitors(embeddable);
  const allMonitors = useAllMonitors(embeddable);

  const Flyout = {
    associated: AssociatedMonitors,
    create: AddAlertingMonitor,
    existing: AddAlertingMonitor,
    adMonitor: AddAlertingMonitor,
  }[flyoutMode];

  return (
    <CoreContext.Provider value={core}>
      <Flyout
        {...{
          ...props,
          monitors: flyoutMode === 'existing' ? allMonitors : monitors,
          selectedMonitorId,
          setSelectedMonitorId,
          flyoutMode,
          setFlyoutMode,
          index,
        }}
      />
    </CoreContext.Provider>
  );
};

export default Container;
