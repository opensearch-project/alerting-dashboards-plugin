/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import DefineMonitor from './DefineMonitor';
import { SEARCH_TYPE } from '../../../../utils/constants';

const buildInstance = (values) => {
  const inst = new DefineMonitor({
    values,
    httpClient: {},
    notifications: {},
    flyoutMode: '',
    errors: {},
  });
  // Stub the collaborators componentDidMount would otherwise invoke so the test
  // exercises only the PPL timestamp-field detection branch.
  inst.getPlugins = jest.fn();
  inst.getSettings = jest.fn();
  inst.initializePplIndices = jest.fn();
  inst.detectPplTimestampFields = jest.fn();
  inst.onQueryMappings = jest.fn();
  inst.onRunQuery = jest.fn();
  inst.getSupportedApiList = jest.fn();
  return inst;
};

describe('DefineMonitor PPL timestamp-field detection on mount', () => {
  test('detects timestamp fields for the hydrated query when editing a PPL monitor', () => {
    const inst = buildInstance({
      searchType: SEARCH_TYPE.PPL,
      index: [],
      timeField: '',
      pplQuery: 'source=logs',
    });
    inst.componentDidMount();
    expect(inst.initializePplIndices).toHaveBeenCalled();
    expect(inst.detectPplTimestampFields).toHaveBeenCalledWith('source=logs');
  });

  test('skips detection when the PPL query is empty', () => {
    const inst = buildInstance({
      searchType: SEARCH_TYPE.PPL,
      index: [],
      timeField: '',
      pplQuery: '',
    });
    inst.componentDidMount();
    expect(inst.initializePplIndices).toHaveBeenCalled();
    expect(inst.detectPplTimestampFields).not.toHaveBeenCalled();
  });

  test('does not run PPL detection for non-PPL monitors', () => {
    const inst = buildInstance({
      searchType: SEARCH_TYPE.QUERY,
      index: [],
      timeField: '',
      pplQuery: 'source=logs',
    });
    inst.componentDidMount();
    expect(inst.initializePplIndices).not.toHaveBeenCalled();
    expect(inst.detectPplTimestampFields).not.toHaveBeenCalled();
  });
});
