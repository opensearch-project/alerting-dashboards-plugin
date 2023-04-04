import _ from 'lodash';
import { DEFAULT_MESSAGE_SOURCE, FORMIK_INITIAL_ACTION_VALUES } from '../../utils/constants';
import { MONITOR_TYPE } from '../../../../utils/constants';

export const getInitialActionValues = ({ monitorType, numOfActions, flyoutMode }) => {
  const initialActionValues = _.cloneDeep(FORMIK_INITIAL_ACTION_VALUES);
  switch (monitorType) {
    case MONITOR_TYPE.BUCKET_LEVEL:
      _.set(
        initialActionValues,
        'message_template.source',
        DEFAULT_MESSAGE_SOURCE.BUCKET_LEVEL_MONITOR
      );
      break;
    case MONITOR_TYPE.QUERY_LEVEL:
    case MONITOR_TYPE.CLUSTER_METRICS:
      _.set(
        initialActionValues,
        'message_template.source',
        DEFAULT_MESSAGE_SOURCE.QUERY_LEVEL_MONITOR
      );
      break;
  }

  if (flyoutMode) {
    initialActionValues.name = `Notification ${(numOfActions || 0) + 1}`;
  }

  return initialActionValues;
};
