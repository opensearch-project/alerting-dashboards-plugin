/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import {
  FORMIK_INITIAL_SENDER_VALUES,
  STATE,
} from '../../../../components/createDestinations/Email/utils/constants';

export function senderToFormik(sender) {
  return {
    ..._.cloneDeep(FORMIK_INITIAL_SENDER_VALUES),
    ...sender,
    state: STATE.NO_OP,
  };
}
