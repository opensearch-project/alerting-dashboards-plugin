import { EuiIconType } from '@elastic/eui/src/components/icon/icon';
import { IEmbeddable } from '../../../../src/plugins/dashboard/public/embeddable_plugin';
import {
  DASHBOARD_CONTAINER_TYPE,
  DashboardContainer,
} from '../../../../src/plugins/dashboard/public';
import { IncompatibleActionError, createAction } from '../../../../src/plugins/ui_actions/public';
import { isReferenceOrValueEmbeddable } from '../../../../src/plugins/embeddable/public';
import { Action } from '../../../../src/plugins/ui_actions/public';

export const ACTION_ALERTING = 'alerting';

function isDashboard(embeddable: IEmbeddable): embeddable is DashboardContainer {
  return embeddable.type === DASHBOARD_CONTAINER_TYPE;
}

export interface ActionContext {
  embeddable: IEmbeddable;
}

export interface CreateOptions {
  grouping: Action['grouping'];
  title: JSX.Element | string;
  icon: EuiIconType;
  id: string;
  type: Action['type'];
  order: number;
  onExecute: Function;
}

export const createAlertingAction = ({
  grouping,
  title,
  icon,
  id,
  order,
  onExecute,
  type,
}: CreateOptions) =>
  createAction({
    id,
    order,
    getDisplayName: ({ embeddable }: ActionContext) => {
      if (!embeddable.parent || !isDashboard(embeddable.parent)) {
        throw new IncompatibleActionError();
      }
      return title;
    },
    getIconType: () => icon,
    type,
    grouping,
    // Do not show actions for certin visualizations
    isCompatible: async ({ embeddable }: ActionContext) => {
      const paramsType = embeddable.vis?.params?.type;
      const seriesParams = embeddable.vis?.params?.seriesParams || [];
      const series = embeddable.vis?.params?.series || [];
      const isLineGraph =
        seriesParams.find((item) => item.type === 'line') ||
        series.find((item) => item.chart_type === 'line');
      const isValidVis = isLineGraph && paramsType !== 'table';
      return Boolean(embeddable.parent && isDashboard(embeddable.parent) && isValidVis);
    },
    execute: async (context: ActionContext) => {
      if (!isReferenceOrValueEmbeddable(context.embeddable)) {
        throw new IncompatibleActionError();
      }

      onExecute(context);
    },
  });
