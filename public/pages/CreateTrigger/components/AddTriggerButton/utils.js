import _ from 'lodash';
import { getDigitId } from '../../../../utils/helpers';
import { getInitialActionValues } from '../../../CreateTrigger/components/AddActionButton/utils';
import { FORMIK_INITIAL_TRIGGER_VALUES } from '../../containers/CreateTrigger/utils/constants';

export const getInitialTriggerValues = ({
  script = FORMIK_INITIAL_TRIGGER_VALUES.script,
  flyoutMode,
  monitorType,
}) => {
  const values = _.cloneDeep({ ...FORMIK_INITIAL_TRIGGER_VALUES, script });
  const id = getDigitId();

  values.id = `trigger${id}`;

  if (flyoutMode) {
    values.name = `Trigger ${id}`;
    values.actions = [getInitialActionValues({ monitorType, numOfActions: 0, flyoutMode })];
  }

  return values;
};
