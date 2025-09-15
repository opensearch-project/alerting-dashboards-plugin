/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import { getDigitId, getUniqueName } from '../../../../utils/helpers';
import {
  FORMIK_COMPOSITE_INITIAL_TRIGGER_VALUES,
  FORMIK_INITIAL_TRIGGER_VALUES,
} from '../../containers/CreateTrigger/utils/constants';
import { getInitialActionValues } from '../AddActionButton/utils';
import { MONITOR_TYPE } from '../../../../utils/constants';

export const getInitialTriggerValues = ({
  script = FORMIK_INITIAL_TRIGGER_VALUES.script,
  flyoutMode,
  triggers,
  monitorType,
  monitorMode,
}) => {
  const initialValues =
    monitorType === MONITOR_TYPE.COMPOSITE_LEVEL
      ? _.cloneDeep(FORMIK_COMPOSITE_INITIAL_TRIGGER_VALUES)
      : _.cloneDeep({ ...FORMIK_INITIAL_TRIGGER_VALUES, script });

  if (flyoutMode) {
    const id = getDigitId();

    initialValues.id = `trigger${id}`;
    initialValues.name = getUniqueName(triggers, 'Trigger ');
    const initialAction = getInitialActionValues({
      monitorType,
      monitorMode,
      flyoutMode,
      actions: [],
    });
    initialValues.actions = [initialAction];
  }

  return initialValues;
};
