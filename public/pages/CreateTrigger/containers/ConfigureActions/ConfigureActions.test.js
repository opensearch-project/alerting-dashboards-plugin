/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
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
