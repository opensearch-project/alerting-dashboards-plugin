/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  formikToGraphQuery,
  formikToUiGraphQuery,
  formikToIndices,
  formikToDocLevelInput,
} from '../../CreateMonitor/utils/formikToMonitor';
import { MONITOR_TYPE, SEARCH_TYPE } from '../../../../../utils/constants';

export const buildRequest = (values, uiGraphQuery = true) =>
  values.searchType === SEARCH_TYPE.GRAPH
    ? buildGraphSearchRequest(values, uiGraphQuery)
    : buildQuerySearchRequest(values);

function buildQuerySearchRequest(values) {
  switch (values.monitor_type) {
    case MONITOR_TYPE.DOC_LEVEL:
      return formikToDocLevelInput(values);
    default:
      const indices = formikToIndices(values);
      const query = JSON.parse(values.query);
      return { search: { query, indices } };
  }
}

function buildGraphSearchRequest(values, uiGraphQuery) {
  switch (values.monitor_type) {
    case MONITOR_TYPE.DOC_LEVEL:
      return formikToDocLevelInput(values);
    default:
      const query = uiGraphQuery ? formikToUiGraphQuery(values) : formikToGraphQuery(values);
      const indices = formikToIndices(values);
      return { search: { query, indices } };
  }
}
