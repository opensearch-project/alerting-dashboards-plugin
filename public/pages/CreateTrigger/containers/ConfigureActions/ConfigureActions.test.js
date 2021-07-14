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
 *   Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
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

import { checkForError } from './ConfigureActions';

const error =
  'java.io.IOException: Failed: HttpResponseProxy{HTTP/1.1 403 Forbidden [Content-Type: application/json, Content-Length: 82, Connection: keep-alive, Date: Fri, 02 Jul 2021 03:54:57 GMT, x-amzn-ErrorType: ForbiddenException';

const noErrorInResponse = {
  resp: {
    monitor_name: 'TestMonitor',
    period_start: 1625198037084,
    period_end: 1625198097084,
    error: null,
    input_results: {
      results: [],
      error: null,
    },
    trigger_results: {
      PgxaZXoB3e90jg4z8ga8: {
        name: '',
        triggered: true,
        error: null,
        action_results: {
          PwxaZXoB3e90jg4z8ga8: {
            id: 'PwxaZXoB3e90jg4z8ga8',
            name: 'sdlkmdslfdsfds',
            output: {},
            throttled: false,
            executionTime: 1625198097035,
            error: null,
          },
        },
      },
    },
  },
};

const errorInActionResponse = {
  resp: {
    monitor_name: 'TestMonitor',
    period_start: 1625198037084,
    period_end: 1625198097084,
    error: null,
    input_results: {
      results: [],
      error: null,
    },
    trigger_results: {
      PgxaZXoB3e90jg4z8ga8: {
        name: '',
        triggered: true,
        error: null,
        action_results: {
          PwxaZXoB3e90jg4z8ga8: {
            id: 'PwxaZXoB3e90jg4z8ga8',
            name: 'sdlkmdslfdsfds',
            output: {},
            throttled: false,
            executionTime: 1625198097035,
            error: error,
          },
        },
      },
    },
  },
};

const errorInTriggerResponse = {
  resp: {
    monitor_name: 'TestMonitor',
    period_start: 1625198037084,
    period_end: 1625198097084,
    error: null,
    input_results: {
      results: [],
      error: null,
    },
    trigger_results: {
      PgxaZXoB3e90jg4z8ga8: {
        name: '',
        triggered: true,
        error: error,
        action_results: {
          PwxaZXoB3e90jg4z8ga8: {
            id: 'PwxaZXoB3e90jg4z8ga8',
            name: 'sdlkmdslfdsfds',
            output: {},
            throttled: false,
            executionTime: 1625198097035,
            error: null,
          },
        },
      },
    },
  },
};

describe('checkForError', () => {
  test('return no error in response', () => {
    expect(checkForError(noErrorInResponse, null)).toBe(null);
  });

  test('return error in action response', () => {
    expect(checkForError(errorInActionResponse, null)).toBe(error);
  });

  test('return error in trigger response', () => {
    expect(checkForError(errorInTriggerResponse, null)).toBe(error);
  });
});
