/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 *   Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 *   Licensed under the Apache License, Version 2.0 (the "License").
 *   You may not use this file except in compliance with the License.
 *   A copy of the License is located at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   or in the "license" file accompanying this file. This file is distributed
 *   on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 *   express or implied. See the License for the specific language governing
 *   permissions and limitations under the License.
 */

import _ from 'lodash';
import { formikToClusterMetricsInput } from '../../../containers/CreateMonitor/utils/formikToMonitor';
import {
  DEFAULT_CLUSTER_METRICS_SCRIPT,
  ILLEGAL_PATH_PARAMETER_CHARACTERS,
  PATH_PARAMETER_ILLEGAL_CHARACTER_TEXT,
  PATH_PARAMETERS_REQUIRED_TEXT,
  API_TYPES,
  NO_PATH_PARAMS_PLACEHOLDER_TEXT,
  GET_API_TYPE_DEBUG_TEXT,
} from './clusterMetricsMonitorConstants';
import { SEARCH_TYPE } from '../../../../../utils/constants';
import { FORMIK_INITIAL_TRIGGER_VALUES } from '../../../../CreateTrigger/containers/CreateTrigger/utils/constants';
import { FORMIK_INITIAL_VALUES } from '../../../containers/CreateMonitor/utils/constants';

export function buildClusterMetricsRequest(values) {
  return _.get(formikToClusterMetricsInput(values), 'uri');
}

export const canExecuteClusterMetricsMonitor = (uri = {}) => {
  const {
    api_type = FORMIK_INITIAL_VALUES.uri.api_type,
    path_params = FORMIK_INITIAL_VALUES.uri.path_params,
  } = uri;
  if (_.isEmpty(api_type)) return false;
  const requiresPathParams = _.isEmpty(_.get(API_TYPES, `${api_type}.paths.withoutPathParams`));
  const hasPathParams = !_.isEmpty(path_params);
  if (pathParamsContainIllegalCharacters(path_params)) return false;
  return requiresPathParams ? hasPathParams : true;
};

export const pathParamsContainIllegalCharacters = (pathParams) => {
  if (_.isEmpty(pathParams)) return false;
  const foundIllegalCharacters = ILLEGAL_PATH_PARAMETER_CHARACTERS.find((illegalCharacter) =>
    _.includes(pathParams, illegalCharacter)
  );
  return !_.isEmpty(foundIllegalCharacters);
};

export const getApiPath = (hasPathParams = false, apiType) => {
  let path = hasPathParams
    ? _.get(
        API_TYPES,
        `${apiType}.paths.withPathParams`,
        _.get(API_TYPES, `${apiType}.paths.withoutPathParams`)
      )
    : _.get(API_TYPES, `${apiType}.paths.withoutPathParams`);
  return path || FORMIK_INITIAL_VALUES.uri.path;
};

export const getApiTypesRequiringPathParams = () => {
  const apiList = [];
  _.keys(API_TYPES).forEach((api) => {
    const withoutPathParams = _.get(API_TYPES, `${api}.paths.withoutPathParams`, '');
    if (_.isEmpty(withoutPathParams))
      apiList.push({
        value: _.get(API_TYPES, `${api}.type`),
        label: _.get(API_TYPES, `${api}.label`),
      });
  });
  return apiList;
};

export const getDefaultScript = (monitorValues) => {
  const searchType = _.get(monitorValues, 'searchType', FORMIK_INITIAL_VALUES.searchType);
  switch (searchType) {
    case SEARCH_TYPE.CLUSTER_METRICS:
      const apiType = _.get(monitorValues, 'uri.api_type');
      return _.get(API_TYPES, `${apiType}.defaultCondition`, DEFAULT_CLUSTER_METRICS_SCRIPT);
    default:
      return FORMIK_INITIAL_TRIGGER_VALUES.script;
  }
};

export const getExamplePathParams = (apiType) => {
  if (_.isEmpty(apiType)) return NO_PATH_PARAMS_PLACEHOLDER_TEXT;
  let exampleText = _.get(API_TYPES, `${apiType}.exampleText`, '');
  _.isEmpty(exampleText)
    ? (exampleText = NO_PATH_PARAMS_PLACEHOLDER_TEXT)
    : (exampleText = `e.g., ${exampleText}`);
  return exampleText;
};

export const getApiType = (uri) => {
  let apiType = '';
  const path = _.get(uri, 'path');
  if (_.isEmpty(path)) return apiType;
  _.keys(API_TYPES).forEach((apiTypeKey) => {
    const withPathParams = _.get(API_TYPES, `${apiTypeKey}.paths.withPathParams`);
    const withoutPathParams = _.get(API_TYPES, `${apiTypeKey}.paths.withoutPathParams`);
    if (path === withPathParams || path === withoutPathParams) apiType = apiTypeKey;
  });
  if (_.isEmpty(apiType)) console.debug(GET_API_TYPE_DEBUG_TEXT);
  return apiType;
};

export const isInvalidApiPathParameter = (field, hidePathParams, pathParams, requirePathParams) => {
  if (hidePathParams) return false;
  const pathParamsTouched = _.get(field, 'touched.uri.path_params', false);
  if (pathParamsTouched) {
    if (requirePathParams && _.isEmpty(pathParams)) return true;
    return pathParamsContainIllegalCharacters(pathParams);
  } else return pathParamsTouched;
};

export const validateApiPathParameter = (field, hidePathParams, pathParams, requirePathParams) => {
  if (hidePathParams) return NO_PATH_PARAMS_PLACEHOLDER_TEXT;
  const pathParamsTouched = _.get(field, 'touched.uri.path_params', false);
  if (requirePathParams && pathParamsTouched && _.isEmpty(pathParams))
    return PATH_PARAMETERS_REQUIRED_TEXT;
  if (isInvalidApiPathParameter(field, hidePathParams, pathParams, requirePathParams))
    return PATH_PARAMETER_ILLEGAL_CHARACTER_TEXT;
};
