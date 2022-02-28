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
import {
  API_TYPES,
  DEFAULT_CLUSTER_METRICS_SCRIPT,
  GET_API_TYPE_DEBUG_TEXT,
  ILLEGAL_PATH_PARAMETER_CHARACTERS,
  NO_PATH_PARAMS_PLACEHOLDER_TEXT,
  PATH_PARAMETER_ILLEGAL_CHARACTER_TEXT,
  PATH_PARAMETERS_REQUIRED_TEXT,
} from './clusterMetricsMonitorConstants';
import {
  buildClusterMetricsRequest,
  canExecuteClusterMetricsMonitor,
  getApiPath,
  getApiType,
  getApiTypesRequiringPathParams,
  getDefaultScript,
  getExamplePathParams,
  isInvalidApiPathParameter,
  pathParamsContainIllegalCharacters,
  validateApiPathParameter,
} from './clusterMetricsMonitorHelpers';
import { FORMIK_INITIAL_VALUES } from '../../../containers/CreateMonitor/utils/constants';
import { SEARCH_TYPE } from '../../../../../utils/constants';
import { FORMIK_INITIAL_TRIGGER_VALUES } from '../../../../CreateTrigger/containers/CreateTrigger/utils/constants';

describe('clusterMetricsMonitorHelpers', () => {
  describe('buildClusterMetricsRequest', () => {
    test('when all fields are blank', () => {
      const values = {
        uri: {
          api_type: '',
          path: '',
          path_params: '',
          url: '',
        },
      };
      expect(buildClusterMetricsRequest(values)).toEqual(FORMIK_INITIAL_VALUES.uri);
    });

    test('when all fields are undefined', () => {
      const values = {
        uri: {
          api_type: undefined,
          path: undefined,
          path_params: undefined,
          url: undefined,
        },
      };
      expect(buildClusterMetricsRequest(values)).toEqual(FORMIK_INITIAL_VALUES.uri);
    });

    describe('when api_type is blank', () => {
      test('path is provided', () => {
        const path = API_TYPES[API_TYPES.CLUSTER_HEALTH.type].paths.withoutPathParams;
        const values = {
          uri: {
            api_type: '',
            path: path,
            path_params: '',
            url: '',
          },
        };
        const expectedResult = {
          uri: {
            api_type: API_TYPES.CLUSTER_HEALTH.type,
            path: path,
            path_params: '',
            url: `http://localhost:9200/${path}`,
          },
        };
        expect(buildClusterMetricsRequest(values)).toEqual(expectedResult.uri);
      });

      test('path and path_params are provided', () => {
        const path = API_TYPES[API_TYPES.CLUSTER_HEALTH.type].paths.withoutPathParams;
        const pathParams = 'params';
        const values = {
          uri: {
            api_type: '',
            path: path,
            path_params: pathParams,
            url: '',
          },
        };
        const expectedResult = {
          uri: {
            api_type: API_TYPES.CLUSTER_HEALTH.type,
            path: path,
            path_params: pathParams,
            url: `http://localhost:9200/${path}${pathParams}`,
          },
        };
        expect(buildClusterMetricsRequest(values)).toEqual(expectedResult.uri);
      });
    });
  });

  describe('canExecuteClusterMetricsMonitor', () => {
    test('with blank apiType and other fields defined', () => {
      const testUri = {
        ...FORMIK_INITIAL_VALUES.uri,
        api_type: '',
        path: '_cluster/health/',
        path_params: 'params',
      };
      expect(canExecuteClusterMetricsMonitor(testUri)).toEqual(false);
    });
    test('with blank apiType and other fields empty', () => {
      const testUri = {
        ...FORMIK_INITIAL_VALUES.uri,
        api_type: '',
      };
      expect(canExecuteClusterMetricsMonitor(testUri)).toEqual(false);
    });
    test('with undefined apiType and other fields defined', () => {
      const testUri = {
        ...FORMIK_INITIAL_VALUES.uri,
        api_type: undefined,
        path: '_cluster/health/',
        path_params: 'params',
      };
      expect(canExecuteClusterMetricsMonitor(testUri)).toEqual(false);
    });
    test('with undefined apiType and other fields empty', () => {
      const testUri = {
        ...FORMIK_INITIAL_VALUES.uri,
        api_type: undefined,
      };
      expect(canExecuteClusterMetricsMonitor(testUri)).toEqual(false);
    });
    test('with pathParams when apiType requires pathParams', () => {
      const testUri = {
        ...FORMIK_INITIAL_VALUES.uri,
        api_type: 'CAT_SNAPSHOTS',
        path_params: 'params',
      };
      expect(canExecuteClusterMetricsMonitor(testUri)).toEqual(true);
    });
    test('with pathParams containing illegal characters when apiType requires pathParams', () => {
      const testUri = {
        ...FORMIK_INITIAL_VALUES.uri,
        api_type: 'CAT_SNAPSHOTS',
        path_params: 'par?ams',
      };
      expect(canExecuteClusterMetricsMonitor(testUri)).toEqual(false);
    });
    test('with blank pathParams when apiType requires pathParams', () => {
      const testUri = {
        ...FORMIK_INITIAL_VALUES.uri,
        api_type: 'CAT_SNAPSHOTS',
        path_params: '',
      };
      expect(canExecuteClusterMetricsMonitor(testUri)).toEqual(false);
    });
    test('with undefined pathParams when apiType requires pathParams', () => {
      const testUri = {
        ...FORMIK_INITIAL_VALUES.uri,
        api_type: 'CAT_SNAPSHOTS',
        path_params: undefined,
      };
      expect(canExecuteClusterMetricsMonitor(testUri)).toEqual(false);
    });

    test('with pathParams when apiType supports pathParams', () => {
      const testUri = {
        ...FORMIK_INITIAL_VALUES.uri,
        api_type: 'CLUSTER_HEALTH',
        path_params: 'params',
      };
      expect(canExecuteClusterMetricsMonitor(testUri)).toEqual(true);
    });
    test('with pathParams containing illegal characters when apiType supports pathParams', () => {
      const testUri = {
        ...FORMIK_INITIAL_VALUES.uri,
        api_type: 'CLUSTER_HEALTH',
        path_params: 'par?ams',
      };
      expect(canExecuteClusterMetricsMonitor(testUri)).toEqual(false);
    });
    test('with blank pathParams when apiType supports pathParams', () => {
      const testUri = {
        ...FORMIK_INITIAL_VALUES.uri,
        api_type: 'CLUSTER_HEALTH',
        path_params: '',
      };
      expect(canExecuteClusterMetricsMonitor(testUri)).toEqual(true);
    });
    test('with undefined pathParams when apiType supports pathParams', () => {
      const testUri = {
        ...FORMIK_INITIAL_VALUES.uri,
        api_type: 'CLUSTER_HEALTH',
        path_params: undefined,
      };
      expect(canExecuteClusterMetricsMonitor(testUri)).toEqual(true);
    });
  });

  describe('pathParamsContainIllegalCharacters', () => {
    test('with blank pathParams', () => {
      const testPathParams = '';
      expect(pathParamsContainIllegalCharacters(testPathParams)).toEqual(false);
    });
    test('with undefined pathParams', () => {
      const testPathParams = undefined;
      expect(pathParamsContainIllegalCharacters(testPathParams)).toEqual(false);
    });
    test('with pathParams containing illegal characters', () => {
      ILLEGAL_PATH_PARAMETER_CHARACTERS.forEach((char) => {
        const testPathParams = `par${char}ams`;
        expect(pathParamsContainIllegalCharacters(testPathParams)).toEqual(true);
      });
    });
    test('with valid pathParams', () => {
      const testPathParams = 'params';
      expect(pathParamsContainIllegalCharacters(testPathParams)).toEqual(false);
    });
  });

  describe('getApiPath', () => {
    describe('when hasPathParams is FALSE', () => {
      test('apiType is blank', () => {
        const apiType = '';
        expect(getApiPath(false, apiType)).toEqual(FORMIK_INITIAL_VALUES.uri.path);
      });
      test('apiType is undefined', () => {
        const apiType = undefined;
        expect(getApiPath(false, apiType)).toEqual(FORMIK_INITIAL_VALUES.uri.path);
      });
    });

    describe('when hasPathParams is TRUE', () => {
      test('apiType is blank', () => {
        const apiType = '';
        expect(getApiPath(true, apiType)).toEqual(FORMIK_INITIAL_VALUES.uri.path);
      });
      test('apiType is undefined', () => {
        const apiType = undefined;
        expect(getApiPath(true, apiType)).toEqual(FORMIK_INITIAL_VALUES.uri.path);
      });
    });

    _.keys(API_TYPES).forEach((apiType) => {
      test(`for ${apiType} when hasPathParams is FALSE`, () => {
        const withoutPathParams = _.get(API_TYPES, `${apiType}.paths.withoutPathParams`, '');
        expect(getApiPath(false, apiType)).toEqual(withoutPathParams);
      });
      test(`for ${apiType} when hasPathParams is TRUE`, () => {
        const withPathParams = _.get(
          API_TYPES,
          `${apiType}.paths.withPathParams`,
          _.get(API_TYPES, `${apiType}.paths.withoutPathParams`)
        );
        expect(getApiPath(true, apiType)).toEqual(withPathParams);
      });
    });
  });

  describe('getApiTypesRequiringPathParams', () => {
    const expectedApiTypes = [API_TYPES.CAT_SNAPSHOTS.type];
    test('returns expected apiTypes', () => {
      const results = getApiTypesRequiringPathParams();
      expect(results.length).toEqual(expectedApiTypes.length);
      results.forEach((entry) => {
        const entryExpected = _.includes(expectedApiTypes, entry.value);
        expect(entryExpected).toEqual(true);
      });
    });
  });

  describe('getDefaultScript', () => {
    test('when searchType is undefined', () => {
      const monitorValues = undefined;
      expect(getDefaultScript(monitorValues)).toEqual(FORMIK_INITIAL_TRIGGER_VALUES.script);
    });
    test('when searchType is clusterMetrics and api_type is undefined', () => {
      const monitorValues = {
        searchType: SEARCH_TYPE.CLUSTER_METRICS,
        uri: undefined,
      };
      expect(getDefaultScript(monitorValues)).toEqual(DEFAULT_CLUSTER_METRICS_SCRIPT);
    });
    test('when searchType is clusterMetrics and api_type is empty', () => {
      const monitorValues = {
        searchType: SEARCH_TYPE.CLUSTER_METRICS,
        uri: {
          api_type: '',
        },
      };
      expect(getDefaultScript(monitorValues)).toEqual(DEFAULT_CLUSTER_METRICS_SCRIPT);
    });
    test('when searchType is clusterMetrics and api_type does not have a default condition', () => {
      const monitorValues = {
        searchType: SEARCH_TYPE.CLUSTER_METRICS,
        uri: {
          api_type: 'unknownApi',
        },
      };
      expect(getDefaultScript(monitorValues)).toEqual(DEFAULT_CLUSTER_METRICS_SCRIPT);
    });

    _.keys(SEARCH_TYPE).forEach((searchType) => {
      test(`when searchType is ${searchType}`, () => {
        if (SEARCH_TYPE[searchType] !== SEARCH_TYPE.CLUSTER_METRICS) {
          const monitorValues = { searchType: searchType };
          expect(getDefaultScript(monitorValues)).toEqual(FORMIK_INITIAL_TRIGGER_VALUES.script);
        }
      });
    });

    _.keys(API_TYPES).forEach((apiType) => {
      test(`when searchType is clusterMetrics and api_type is ${apiType}`, () => {
        const monitorValues = {
          searchType: SEARCH_TYPE.CLUSTER_METRICS,
          uri: {
            api_type: apiType,
          },
        };
        const expectedOutput = _.get(API_TYPES, `${apiType}.defaultCondition`);
        if (!_.isEmpty(expectedOutput))
          expect(getDefaultScript(monitorValues)).toEqual(expectedOutput);
      });
    });
  });

  describe('getExamplePathParams', () => {
    test('when apiType has no example text', () => {
      const apiType = 'apiTypeWithoutExampleText';
      expect(getExamplePathParams(apiType)).toEqual(NO_PATH_PARAMS_PLACEHOLDER_TEXT);
    });
    test('when apiType is blank', () => {
      const apiType = '';
      expect(getExamplePathParams(apiType)).toEqual(NO_PATH_PARAMS_PLACEHOLDER_TEXT);
    });
    test('when apiType is undefined', () => {
      const apiType = undefined;
      expect(getExamplePathParams(apiType)).toEqual(NO_PATH_PARAMS_PLACEHOLDER_TEXT);
    });
    _.keys(API_TYPES).forEach((apiType) => {
      const withPathParams = _.get(API_TYPES, `${apiType}.paths.withPathParams`);
      const supportsPathParams = !_.isEmpty(withPathParams);
      test(`when apiType is ${apiType}`, () => {
        const expectedResults = supportsPathParams
          ? `e.g., ${API_TYPES[apiType].exampleText}`
          : NO_PATH_PARAMS_PLACEHOLDER_TEXT;
        expect(getExamplePathParams(apiType)).toEqual(expectedResults);
      });
    });
  });

  describe('getApiType', () => {
    test(`when uri.path is blank`, () => {
      const uri = {
        ...FORMIK_INITIAL_VALUES.uri,
        path: '',
      };
      expect(getApiType(uri)).toEqual('');
    });
    test(`when uri.path is blank and has path params`, () => {
      const uri = {
        ...FORMIK_INITIAL_VALUES.uri,
        path: '',
        path_params: 'params',
      };
      expect(getApiType(uri)).toEqual('');
    });

    test(`when uri.path is undefined`, () => {
      const uri = {
        ...FORMIK_INITIAL_VALUES.uri,
        path: undefined,
      };
      expect(getApiType(uri)).toEqual('');
    });
    test(`when uri.path is undefined and has path params`, () => {
      const uri = {
        ...FORMIK_INITIAL_VALUES.uri,
        path: undefined,
        path_params: 'params',
      };
      expect(getApiType(uri)).toEqual('');
    });

    test(`when uri.path is unsupported`, () => {
      const uri = {
        ...FORMIK_INITIAL_VALUES.uri,
        path: '_unsupported/api',
      };
      console.debug = jest.fn();
      expect(getApiType(uri)).toEqual('');
      expect(console.debug).toHaveBeenCalledWith(GET_API_TYPE_DEBUG_TEXT);
    });
    test(`when uri.path is unsupported and has path params`, () => {
      const uri = {
        ...FORMIK_INITIAL_VALUES.uri,
        path: '_unsupported/api',
        path_params: 'params',
      };
      console.debug = jest.fn();
      expect(getApiType(uri)).toEqual('');
      expect(console.debug).toHaveBeenCalledWith(GET_API_TYPE_DEBUG_TEXT);
    });

    _.keys(API_TYPES).forEach((apiType) => {
      const withPathParams = _.get(API_TYPES, `${apiType}.paths.withPathParams`);
      if (!_.isEmpty(withPathParams)) {
        test(`when apiType is ${apiType} and has path params`, () => {
          const uri = {
            ...FORMIK_INITIAL_VALUES.uri,
            path: withPathParams,
            path_params: 'params',
          };
          expect(getApiType(uri)).toEqual(apiType);
        });
      }

      const withoutPathParams = _.get(API_TYPES, `${apiType}.paths.withoutPathParams`);
      if (!_.isEmpty(withoutPathParams)) {
        test(`when apiType is ${apiType} and has no path params`, () => {
          const uri = {
            ...FORMIK_INITIAL_VALUES.uri,
            path: withoutPathParams,
          };
          expect(getApiType(uri)).toEqual(apiType);
        });
      }
    });
  });

  describe('isInvalidApiPathParameter', () => {
    describe('when hidePathParams is TRUE', () => {
      const hidePathParams = true;
      describe('pathParams fieldTouched is TRUE', () => {
        const field = _.set({}, 'touched.uri.path_params', true);
        describe('pathParams are required', () => {
          const requirePathParams = true;
          test('pathParams are blank', () => {
            const pathParams = '';
            expect(
              isInvalidApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
            ).toEqual(false);
          });
          test('pathParams are undefined', () => {
            const pathParams = undefined;
            expect(
              isInvalidApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
            ).toEqual(false);
          });
          test('pathParams contain illegal character', () => {
            ILLEGAL_PATH_PARAMETER_CHARACTERS.forEach((char) => {
              const pathParams = `par${char}ams`;
              expect(
                isInvalidApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
              ).toEqual(false);
            });
          });
          test('pathParams are valid', () => {
            const pathParams = 'params';
            expect(
              isInvalidApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
            ).toEqual(false);
          });
        });
        describe('pathParams are not required', () => {
          const requirePathParams = false;
          test('pathParams are blank', () => {
            const pathParams = '';
            expect(
              isInvalidApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
            ).toEqual(false);
          });
          test('pathParams are undefined', () => {
            const pathParams = undefined;
            expect(
              isInvalidApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
            ).toEqual(false);
          });
          test('pathParams contain illegal character', () => {
            ILLEGAL_PATH_PARAMETER_CHARACTERS.forEach((char) => {
              const pathParams = `par${char}ams`;
              expect(
                isInvalidApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
              ).toEqual(false);
            });
          });
          test('pathParams are valid', () => {
            const pathParams = 'params';
            expect(
              isInvalidApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
            ).toEqual(false);
          });
        });
      });
      describe('pathParams fieldTouched is false', () => {
        const field = _.set({}, 'touched.uri.path_params', false);
        describe('pathParams are required', () => {
          const requirePathParams = true;
          test('pathParams are blank', () => {
            const pathParams = '';
            expect(
              isInvalidApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
            ).toEqual(false);
          });
          test('pathParams are undefined', () => {
            const pathParams = undefined;
            expect(
              isInvalidApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
            ).toEqual(false);
          });
          test('pathParams contain illegal character', () => {
            ILLEGAL_PATH_PARAMETER_CHARACTERS.forEach((char) => {
              const pathParams = `par${char}ams`;
              expect(
                isInvalidApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
              ).toEqual(false);
            });
          });
          test('pathParams are valid', () => {
            const pathParams = 'params';
            expect(
              isInvalidApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
            ).toEqual(false);
          });
        });
        describe('pathParams are not required', () => {
          const requirePathParams = false;
          test('pathParams are blank', () => {
            const pathParams = '';
            expect(
              isInvalidApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
            ).toEqual(false);
          });
          test('pathParams are undefined', () => {
            const pathParams = undefined;
            expect(
              isInvalidApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
            ).toEqual(false);
          });
          test('pathParams contain illegal character', () => {
            ILLEGAL_PATH_PARAMETER_CHARACTERS.forEach((char) => {
              const pathParams = `par${char}ams`;
              expect(
                isInvalidApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
              ).toEqual(false);
            });
          });
          test('pathParams are valid', () => {
            const pathParams = 'params';
            expect(
              isInvalidApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
            ).toEqual(false);
          });
        });
      });
    });
    describe('when hidePathParams is FALSE', () => {
      const hidePathParams = false;
      describe('pathParams fieldTouched is TRUE', () => {
        const field = _.set({}, 'touched.uri.path_params', true);
        describe('pathParams are required', () => {
          const requirePathParams = true;
          test('pathParams are blank', () => {
            const pathParams = '';
            expect(
              isInvalidApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
            ).toEqual(true);
          });
          test('pathParams are undefined', () => {
            const pathParams = undefined;
            expect(
              isInvalidApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
            ).toEqual(true);
          });
          test('pathParams contain illegal character', () => {
            ILLEGAL_PATH_PARAMETER_CHARACTERS.forEach((char) => {
              const pathParams = `par${char}ams`;
              expect(
                isInvalidApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
              ).toEqual(true);
            });
          });
          test('pathParams are valid', () => {
            const pathParams = 'params';
            expect(
              isInvalidApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
            ).toEqual(false);
          });
        });
        describe('pathParams are not required', () => {
          const requirePathParams = false;
          test('pathParams are blank', () => {
            const pathParams = '';
            expect(
              isInvalidApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
            ).toEqual(false);
          });
          test('pathParams are undefined', () => {
            const pathParams = undefined;
            expect(
              isInvalidApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
            ).toEqual(false);
          });
          test('pathParams contain illegal character', () => {
            ILLEGAL_PATH_PARAMETER_CHARACTERS.forEach((char) => {
              const pathParams = `par${char}ams`;
              expect(
                isInvalidApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
              ).toEqual(true);
            });
          });
          test('pathParams are valid', () => {
            const pathParams = 'params';
            expect(
              isInvalidApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
            ).toEqual(false);
          });
        });
      });
      describe('pathParams fieldTouched is false', () => {
        const field = _.set({}, 'touched.uri.path_params', false);
        describe('pathParams are required', () => {
          const requirePathParams = true;
          test('pathParams are blank', () => {
            const pathParams = '';
            expect(
              isInvalidApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
            ).toEqual(false);
          });
          test('pathParams are undefined', () => {
            const pathParams = undefined;
            expect(
              isInvalidApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
            ).toEqual(false);
          });
          test('pathParams contain illegal character', () => {
            ILLEGAL_PATH_PARAMETER_CHARACTERS.forEach((char) => {
              const pathParams = `par${char}ams`;
              expect(
                isInvalidApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
              ).toEqual(false);
            });
          });
          test('pathParams are valid', () => {
            const pathParams = 'params';
            expect(
              isInvalidApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
            ).toEqual(false);
          });
        });
        describe('pathParams are not required', () => {
          const requirePathParams = false;
          test('pathParams are blank', () => {
            const pathParams = '';
            expect(
              isInvalidApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
            ).toEqual(false);
          });
          test('pathParams are undefined', () => {
            const pathParams = undefined;
            expect(
              isInvalidApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
            ).toEqual(false);
          });
          test('pathParams contain illegal character', () => {
            ILLEGAL_PATH_PARAMETER_CHARACTERS.forEach((char) => {
              const pathParams = `par${char}ams`;
              expect(
                isInvalidApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
              ).toEqual(false);
            });
          });
          test('pathParams are valid', () => {
            const pathParams = 'params';
            expect(
              isInvalidApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
            ).toEqual(false);
          });
        });
      });
    });
  });

  describe('validateApiPathParameter', () => {
    describe('when hidePathParams is TRUE', () => {
      const hidePathParams = true;
      describe('pathParams fieldTouched is TRUE', () => {
        const field = _.set({}, 'touched.uri.path_params', true);
        describe('pathParams are required', () => {
          const requirePathParams = true;
          test('pathParams are blank', () => {
            const pathParams = '';
            expect(
              validateApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
            ).toEqual(NO_PATH_PARAMS_PLACEHOLDER_TEXT);
          });
          test('pathParams are undefined', () => {
            const pathParams = undefined;
            expect(
              validateApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
            ).toEqual(NO_PATH_PARAMS_PLACEHOLDER_TEXT);
          });
          test('pathParams contain illegal character', () => {
            ILLEGAL_PATH_PARAMETER_CHARACTERS.forEach((char) => {
              const pathParams = `par${char}ams`;
              expect(
                validateApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
              ).toEqual(NO_PATH_PARAMS_PLACEHOLDER_TEXT);
            });
          });
          test('pathParams are valid', () => {
            const pathParams = 'params';
            expect(
              validateApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
            ).toEqual(NO_PATH_PARAMS_PLACEHOLDER_TEXT);
          });
        });
        describe('pathParams are not required', () => {
          const requirePathParams = false;
          test('pathParams are blank', () => {
            const pathParams = '';
            expect(
              validateApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
            ).toEqual(NO_PATH_PARAMS_PLACEHOLDER_TEXT);
          });
          test('pathParams are undefined', () => {
            const pathParams = undefined;
            expect(
              validateApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
            ).toEqual(NO_PATH_PARAMS_PLACEHOLDER_TEXT);
          });
          test('pathParams contain illegal character', () => {
            ILLEGAL_PATH_PARAMETER_CHARACTERS.forEach((char) => {
              const pathParams = `par${char}ams`;
              expect(
                validateApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
              ).toEqual(NO_PATH_PARAMS_PLACEHOLDER_TEXT);
            });
          });
          test('pathParams are valid', () => {
            const pathParams = 'params';
            expect(
              validateApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
            ).toEqual(NO_PATH_PARAMS_PLACEHOLDER_TEXT);
          });
        });
      });
      describe('pathParams fieldTouched is false', () => {
        const field = _.set({}, 'touched.uri.path_params', false);
        describe('pathParams are required', () => {
          const requirePathParams = true;
          test('pathParams are blank', () => {
            const pathParams = '';
            expect(
              validateApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
            ).toEqual(NO_PATH_PARAMS_PLACEHOLDER_TEXT);
          });
          test('pathParams are undefined', () => {
            const pathParams = undefined;
            expect(
              validateApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
            ).toEqual(NO_PATH_PARAMS_PLACEHOLDER_TEXT);
          });
          test('pathParams contain illegal character', () => {
            ILLEGAL_PATH_PARAMETER_CHARACTERS.forEach((char) => {
              const pathParams = `par${char}ams`;
              expect(
                validateApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
              ).toEqual(NO_PATH_PARAMS_PLACEHOLDER_TEXT);
            });
          });
          test('pathParams are valid', () => {
            const pathParams = 'params';
            expect(
              validateApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
            ).toEqual(NO_PATH_PARAMS_PLACEHOLDER_TEXT);
          });
        });
        describe('pathParams are not required', () => {
          const requirePathParams = false;
          test('pathParams are blank', () => {
            const pathParams = '';
            expect(
              validateApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
            ).toEqual(NO_PATH_PARAMS_PLACEHOLDER_TEXT);
          });
          test('pathParams are undefined', () => {
            const pathParams = undefined;
            expect(
              validateApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
            ).toEqual(NO_PATH_PARAMS_PLACEHOLDER_TEXT);
          });
          test('pathParams contain illegal character', () => {
            ILLEGAL_PATH_PARAMETER_CHARACTERS.forEach((char) => {
              const pathParams = `par${char}ams`;
              expect(
                validateApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
              ).toEqual(NO_PATH_PARAMS_PLACEHOLDER_TEXT);
            });
          });
          test('pathParams are valid', () => {
            const pathParams = 'params';
            expect(
              validateApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
            ).toEqual(NO_PATH_PARAMS_PLACEHOLDER_TEXT);
          });
        });
      });
    });
    describe('when hidePathParams is FALSE', () => {
      const hidePathParams = false;
      describe('pathParams fieldTouched is TRUE', () => {
        const field = _.set({}, 'touched.uri.path_params', true);
        describe('pathParams are required', () => {
          const requirePathParams = true;
          test('pathParams are blank', () => {
            const pathParams = '';
            expect(
              validateApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
            ).toEqual(PATH_PARAMETERS_REQUIRED_TEXT);
          });
          test('pathParams are undefined', () => {
            const pathParams = undefined;
            expect(
              validateApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
            ).toEqual(PATH_PARAMETERS_REQUIRED_TEXT);
          });
          test('pathParams contain illegal character', () => {
            ILLEGAL_PATH_PARAMETER_CHARACTERS.forEach((char) => {
              const pathParams = `par${char}ams`;
              expect(
                validateApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
              ).toEqual(PATH_PARAMETER_ILLEGAL_CHARACTER_TEXT);
            });
          });
          test('pathParams are valid', () => {
            const pathParams = 'params';
            expect(
              validateApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
            ).toEqual(undefined);
          });
        });
        describe('pathParams are not required', () => {
          const requirePathParams = false;
          test('pathParams are blank', () => {
            const pathParams = '';
            expect(
              validateApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
            ).toEqual(undefined);
          });
          test('pathParams are undefined', () => {
            const pathParams = undefined;
            expect(
              validateApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
            ).toEqual(undefined);
          });
          test('pathParams contain illegal character', () => {
            ILLEGAL_PATH_PARAMETER_CHARACTERS.forEach((char) => {
              const pathParams = `par${char}ams`;
              expect(
                validateApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
              ).toEqual(PATH_PARAMETER_ILLEGAL_CHARACTER_TEXT);
            });
          });
          test('pathParams are valid', () => {
            const pathParams = 'params';
            expect(
              validateApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
            ).toEqual(undefined);
          });
        });
      });
      describe('pathParams fieldTouched is false', () => {
        const field = _.set({}, 'touched.uri.path_params', false);
        describe('pathParams are required', () => {
          const requirePathParams = true;
          test('pathParams are blank', () => {
            const pathParams = '';
            expect(
              validateApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
            ).toEqual(undefined);
          });
          test('pathParams are undefined', () => {
            const pathParams = undefined;
            expect(
              validateApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
            ).toEqual(undefined);
          });
          test('pathParams contain illegal character', () => {
            ILLEGAL_PATH_PARAMETER_CHARACTERS.forEach((char) => {
              const pathParams = `par${char}ams`;
              expect(
                validateApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
              ).toEqual(undefined);
            });
          });
          test('pathParams are valid', () => {
            const pathParams = 'params';
            expect(
              validateApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
            ).toEqual(undefined);
          });
        });
        describe('pathParams are not required', () => {
          const requirePathParams = false;
          test('pathParams are blank', () => {
            const pathParams = '';
            expect(
              validateApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
            ).toEqual(undefined);
          });
          test('pathParams are undefined', () => {
            const pathParams = undefined;
            expect(
              validateApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
            ).toEqual(undefined);
          });
          test('pathParams contain illegal character', () => {
            ILLEGAL_PATH_PARAMETER_CHARACTERS.forEach((char) => {
              const pathParams = `par${char}ams`;
              expect(
                validateApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
              ).toEqual(undefined);
            });
          });
          test('pathParams are valid', () => {
            const pathParams = 'params';
            expect(
              validateApiPathParameter(field, hidePathParams, pathParams, requirePathParams)
            ).toEqual(undefined);
          });
        });
      });
    });
  });
});
