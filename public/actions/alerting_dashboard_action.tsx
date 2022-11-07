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
import { getContextMenuData } from '../components/DashboardMenu/InitialMenu';

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
  public services = {};
  // This contains items that will be placed on the context menu and
  // any panels that might be required
  public contextMenuData = getContextMenuData();

  constructor(services) {
    this.services = services;
  }

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
  public getIconType({ embeddable }: AlertingActionContext) {
    if (!embeddable.parent || !isDashboard(embeddable.parent)) {
      throw new IncompatibleActionError();
    }
    return 'bell';
  }

  // @ts-ignore
  public async isCompatible({ embeddable }: AlertingActionContext) {
    return Boolean(embeddable.parent && isDashboard(embeddable.parent));
  }

  // @ts-ignore
  public async execute(context: AlertingActionContext) {
    const {
      embeddable,
      // value: { overlays },
    } = context;

    if (!embeddable.parent || !isDashboard(embeddable.parent)) {
      console.log('Alerting action is incompatible');
      throw new IncompatibleActionError();
    }

    // TODO: here is where the logic for handling the action being clicked should be handled - e.g., open some side panel
    // to construct and run an anomaly detector.
    // console.log('executing Alerting action');
    // console.log('context: ', context);

    // See below example of the expand panel action. It calls back to the parent embeddable and updates the expanded panel ID,
    // such that the subscription on the input reads this new field, updates state, and will render the specific panel
    // in an expanded fashion.
    // const newValue = isExpanded(embeddable) ? undefined : embeddable.id;
    // console.log(newValue);
    // embeddable.parent.updateInput({
    //   expandedPanelId: newValue,
    // });

    // embeddable.parent.options.overlays.openFlyout(<DashboardMenu />);
    this.services.openMenu({ context });
  }
}
