import { i18n } from '@osd/i18n';
import { IEmbeddable } from '../../../../src/plugins/dashboard/public/embeddable_plugin';
import {
  DASHBOARD_CONTAINER_TYPE,
  DashboardContainer,
} from '../../../../src/plugins/dashboard/public';
import { getContextMenuData as getMenuData } from '../utils/contextMenu/getContextMenuData';
import { IncompatibleActionError, createAction } from '../../../../src/plugins/ui_actions/public';
import { isReferenceOrValueEmbeddable } from '../../../../src/plugins/embeddable/public';

export const ACTION_ALERTING = 'alerting';

function isDashboard(embeddable: IEmbeddable): embeddable is DashboardContainer {
  return embeddable.type === DASHBOARD_CONTAINER_TYPE;
}

export interface ActionContext {
  embeddable: IEmbeddable;
}

export const createAlertingAction = () =>
  createAction({
    getDisplayName: ({ embeddable }: ActionContext) => {
      if (!embeddable.parent || !isDashboard(embeddable.parent)) {
        throw new IncompatibleActionError();
      }
      return i18n.translate('dashboard.actions.alertingMenuItem.displayName', {
        defaultMessage: 'Alerting',
      });
    },
    type: ACTION_ALERTING,
    isCompatible: async ({ embeddable }: ActionContext) => {
      return Boolean(embeddable.parent && isDashboard(embeddable.parent));
    },
    execute: async ({ embeddable }: ActionContext) => {
      if (!isReferenceOrValueEmbeddable(embeddable)) {
        throw new IncompatibleActionError();
      }
    },
    getContextMenuData: getMenuData,
  });
