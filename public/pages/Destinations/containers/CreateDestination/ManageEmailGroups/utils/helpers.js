/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import {
  FORMIK_INITIAL_EMAIL_GROUP_VALUES,
  STATE,
} from '../../../../components/createDestinations/Email/utils/constants';

export function emailGroupToFormik(emailGroup) {
  const { id, ifSeqNo, ifPrimaryTerm, name, emails } = emailGroup;
  return {
    ..._.cloneDeep(FORMIK_INITIAL_EMAIL_GROUP_VALUES),
    id,
    ifSeqNo,
    ifPrimaryTerm,
    name,
    emails: emails.map((e) => ({ label: e.email })),
    state: STATE.NO_OP,
  };
}
