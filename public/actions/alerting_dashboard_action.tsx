import React from 'react';
import { i18n } from '@osd/i18n';
// import { IEmbeddable } from '../../../../src/plugins/dashboard/public/embeddable_plugin';
// import { ActionByType, IncompatibleActionError } from '../../../../src/plugins/dashboard/public/ui_actions_plugin';
// import { DASHBOARD_CONTAINER_TYPE, DashboardContainer } from '../../../../src/plugins/dashboard/public/application/embeddable';
import {
  IEmbeddable,
  ActionByType,
  IncompatibleActionError,
  DASHBOARD_CONTAINER_TYPE,
  DashboardContainer,
} from '../../../../src/plugins/dashboard/public';
import {
  toMountPoint,
  reactToUiComponent,
} from '../../../../src/plugins/opensearch_dashboards_react/public';
import { getContextMenuData as getMenuData } from '../utils/getContextMenuData/index';

export const ACTION_ALERTING = 'alerting';

function isDashboard(embeddable: IEmbeddable): embeddable is DashboardContainer {
  return embeddable.type === DASHBOARD_CONTAINER_TYPE;
}

function isExpanded(embeddable: IEmbeddable) {
  if (!embeddable.parent || !isDashboard(embeddable.parent)) {
    throw new IncompatibleActionError();
  }

  return embeddable.id === embeddable.parent.getInput().expandedPanelId;
}

export interface AlertingActionContext {
  embeddable: IEmbeddable;
}

export class AlertingAction implements ActionByType<typeof ACTION_ALERTING> {
  public readonly type = ACTION_ALERTING;
  public readonly id = ACTION_ALERTING;
  public order = 8;
  // This contains additional items that will be placed on the context menu, any
  // additional panels, and an order
  public getContextMenuData = getMenuData;

  constructor() {}

  // @ts-ignore
  public getDisplayName({ embeddable }: AlertingActionContext) {
    if (!embeddable.parent || !isDashboard(embeddable.parent)) {
      throw new IncompatibleActionError();
    }
    return i18n.translate('dashboard.actions.alertingMenuItem.displayName', {
      defaultMessage: 'New Actions',
    });
  }

  // @ts-ignore
  public async isCompatible({ embeddable }: AlertingActionContext) {
    return Boolean(embeddable.parent && isDashboard(embeddable.parent));
  }
}
