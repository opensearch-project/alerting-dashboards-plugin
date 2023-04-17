import _ from 'lodash';
import { getDigitId, getUniqueName } from '../../../../utils/helpers';
import { FORMIK_INITIAL_TRIGGER_VALUES } from '../../containers/CreateTrigger/utils/constants';

export const getInitialTriggerValues = ({
  script = FORMIK_INITIAL_TRIGGER_VALUES.script,
  flyoutMode,
  triggers,
}) => {
  const initialValues = _.cloneDeep({ ...FORMIK_INITIAL_TRIGGER_VALUES, script });
  const id = getDigitId();

  initialValues.id = `trigger${id}`;

  if (flyoutMode) {
    initialValues.name = getUniqueName(triggers, 'Trigger ');
    initialValues.actions = [];
  }

  return initialValues;
};
