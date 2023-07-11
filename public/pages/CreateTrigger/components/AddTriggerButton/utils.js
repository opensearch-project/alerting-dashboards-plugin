/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import { getDigitId, getUniqueName } from '../../../../utils/helpers';
import { FORMIK_INITIAL_TRIGGER_VALUES } from '../../containers/CreateTrigger/utils/constants';
import { getInitialActionValues } from '../AddActionButton/utils';

export const getInitialTriggerValues = ({
  script = FORMIK_INITIAL_TRIGGER_VALUES.script,
  flyoutMode,
  triggers,
  monitorType,
}) => {
  const initialValues = _.cloneDeep({ ...FORMIK_INITIAL_TRIGGER_VALUES, script });

  if (flyoutMode) {
    const id = getDigitId();

    initialValues.id = `trigger${id}`;
    initialValues.name = getUniqueName(triggers, 'Trigger ');
    const initialAction = getInitialActionValues({ monitorType, flyoutMode, actions: [] });
    initialValues.actions = [initialAction];
  }

  return initialValues;
};
