/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const historyMock = {
  action: 'REPLACE', // PUSH, REPLACE, POP
  block: jest.fn(), // prevents navigation
  createHref: jest.fn(),
  go: jest.fn(), // moves the pointer in the history stack by n entries
  goBack: jest.fn(), // equivalent to go(-1)
  goForward: jest.fn(), // equivalent to go(1)
  length: 0, // number of entries in the history stack
  listen: jest.fn(),
  location: {
    hash: '', // URL hash fragment
    pathname: '', // path of URL
    search: '', // URL query string
    state: undefined, // location-specific state that was provided to e.g. push(path, state) when this location was pushed onto the stack
  },
  push: jest.fn(), // pushes new entry onto history stack
  replace: jest.fn(), // replaces current entry on history stack
};

export default historyMock;
