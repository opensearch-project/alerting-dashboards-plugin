/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { EuiCallOut } from '@elastic/eui';
import AssociatedMonitors from '../AssociatedMonitors';
import AddAlertingMonitor from '../AddAlertingMonitor';
import { useMonitors } from '../../../utils/contextMenu/monitors';
import { useAllMonitors } from '../../../utils/contextMenu/allMonitors';
import { CoreContext } from '../../../utils/CoreContext';
import { validateAssociationIsAllow } from '../../../utils/savedObjectHelper';
import { getUISettings } from '../../../services';
import { PLUGIN_AUGMENTATION_MAX_OBJECTS_SETTING } from '../../../utils/constants';
import './styles.scss';

const Container = ({ defaultFlyoutMode, ...props }) => {
  const { embeddable, core } = props;
  const index = [{ label: embeddable?.vis?.data?.indexPattern?.title }];
  const [flyoutMode, setFlyoutMode] = useState(defaultFlyoutMode);
  const [selectedMonitorId, setSelectedMonitorId] = useState();
  const [monitors, setMonitors] = useState<any[] | null>();
  useMonitors(embeddable, monitors, setMonitors);
  const [allMonitors, setAllMonitors] = useState<any[] | null>();
  useAllMonitors(embeddable, allMonitors, setAllMonitors);

  const [isAssociateAllowed, setIsAssociateAllowed] = useState<any[] | null>();

  const state = {
    monitors, setMonitors, allMonitors, setAllMonitors, isAssociateAllowed
  }

  useEffect(() => {
    const getIsAssociateAllowed = async () => {
      const isAllowed = await validateAssociationIsAllow(embeddable.vis.id);
      setIsAssociateAllowed(isAllowed);
    };

    getIsAssociateAllowed();
  }, []);
  const uiSettings = getUISettings();
  const maxAssociatedCount = uiSettings.get(PLUGIN_AUGMENTATION_MAX_OBJECTS_SETTING);
  const limitReachedTitle = `Limit reached. No more than ${maxAssociatedCount} objects can be associated with a visualizations.`

  const limitReachedCallout = (
    <EuiCallOut title={limitReachedTitle} color="warning" iconType="alert">
      Adding more objects may affect cluster performance and prevent dashboards from rendering properly. Remove associations before add new ones.
    </EuiCallOut>
  );

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
          isAssociateAllowed,
          limitReachedCallout,
          state,
        }}
      />
    </CoreContext.Provider>
  );
};

export default Container;
