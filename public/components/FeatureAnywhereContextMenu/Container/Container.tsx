/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { EuiCallOut } from '@elastic/eui';
import AssociatedMonitors from '../AssociatedMonitors';
import { retrieveAssociatedMonitors, retrieveUnassociatedMonitors } from '../../../utils/contextMenu/monitors';
import { validateAssociationIsAllow } from '../../../utils/savedObjectHelper';
import { getUISettings } from '../../../services';
import { PLUGIN_AUGMENTATION_MAX_OBJECTS_SETTING } from '../../../utils/constants';
import './styles.scss';

const Container = ({ defaultFlyoutMode, ...props }) => {
  const { embeddable } = props;
  const index = [{ label: embeddable?.vis?.data?.indexPattern?.title }];
  const [flyoutMode, setFlyoutMode] = useState(defaultFlyoutMode);
  const [selectedMonitorId, setSelectedMonitorId] = useState();
  const [associatedMonitors, setAssociatedMonitors] = useState<any[]>([]);
  retrieveAssociatedMonitors(embeddable.vis.id, setAssociatedMonitors);
  const [unassociatedMonitors, setUnassociatedMonitors] = useState<any[]>([]);
  retrieveUnassociatedMonitors(embeddable.vis.id, setUnassociatedMonitors);
  const [isAssociateAllowed, setIsAssociateAllowed] = useState(true);

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
      Adding more objects may affect cluster performance and prevent dashboards from rendering properly. Remove associations before adding new ones.
    </EuiCallOut>
  );

  const Flyout = {
    associated: AssociatedMonitors,
  }[flyoutMode];

  return (
    <Flyout
      {...{
        ...props,
        monitors: flyoutMode === 'existing' ? unassociatedMonitors : associatedMonitors,
        selectedMonitorId,
        setSelectedMonitorId,
        flyoutMode,
        setFlyoutMode,
        index,
        isAssociateAllowed,
        limitReachedCallout,
        setAssociatedMonitors
      }}
    />
  );
};

export default Container;
