/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  formikToGraphQuery,
  formikToUiGraphQuery,
  formikToIndices,
} from '../../CreateMonitor/utils/formikToMonitor';
import { SEARCH_TYPE } from '../../../../../utils/constants';

export const buildSearchRequest = (values, uiGraphQuery = true) =>
  values.searchType === SEARCH_TYPE.GRAPH
    ? buildGraphSearchRequest(values, uiGraphQuery)
    : buildQuerySearchRequest(values);

function buildQuerySearchRequest(values) {
  const indices = formikToIndices(values);
  const query = JSON.parse(values.query);
  return { query, indices };
}

function buildGraphSearchRequest(values, uiGraphQuery) {
  const query = uiGraphQuery ? formikToUiGraphQuery(values) : formikToGraphQuery(values);
  const indices = formikToIndices(values);
  return { query, indices };
}
