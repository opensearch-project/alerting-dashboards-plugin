/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  TopNavControlData,
  TopNavControlDescriptionData,
  TopNavControlLinkData,
  TopNavControlIconData
} from '../../../../../src/plugins/navigation/public';
import { getNavigationUI, getApplication, getUseUpdatedUx } from '../../services';


export interface PageHeaderProps {
  appRightControls?: TopNavControlData[];
  appBadgeControls?: TopNavControlData[];
  appDescriptionControls?: (TopNavControlDescriptionData | TopNavControlLinkData | TopNavControlIconData)[];
  appBottomControls?: TopNavControlData[];
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  children,
  appBadgeControls,
  appRightControls,
  appDescriptionControls,
  appBottomControls
}) => {
  const { HeaderControl } = getNavigationUI();
  const { setAppBadgeControls, setAppRightControls, setAppDescriptionControls, setAppBottomControls } = getApplication();

  return getUseUpdatedUx() ? (
    <>
      <HeaderControl setMountPoint={setAppBadgeControls} controls={appBadgeControls} />
      <HeaderControl setMountPoint={setAppRightControls} controls={appRightControls} />
      <HeaderControl setMountPoint={setAppDescriptionControls} controls={appDescriptionControls} />
      <HeaderControl setMountPoint={setAppBottomControls} controls={appBottomControls} />
    </>
  ) : (
    <>{children}</>
  );
};