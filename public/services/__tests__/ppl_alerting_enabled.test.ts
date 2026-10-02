/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  isPplAlertingAvailableForDataSource,
  isPplAlertingEnabled,
  isPplAlertingSupportedByDataSource,
  setApplication,
  setDataSourceMetadata,
} from '../services';

const withCapability = (pplV2: boolean) =>
  setApplication({ capabilities: { alertingDashboards: { pplV2 } } } as any);

describe('isPplAlertingEnabled (deployment switch)', () => {
  afterEach(() => {
    setDataSourceMetadata(null);
  });

  test('follows the pplV2 capability only', () => {
    withCapability(true);
    expect(isPplAlertingEnabled()).toBe(true);
    withCapability(false);
    expect(isPplAlertingEnabled()).toBe(false);
  });

  test('is not affected by whatever data source the Alerting app last resolved', () => {
    // The Explore "Create monitor" action calls this; leftover Alerting metadata for a 2.x
    // data source must not hide the action for a 3.x dataset (and vice versa).
    withCapability(true);
    setDataSourceMetadata({ dataSourceVersion: '2.19.0' });
    expect(isPplAlertingEnabled()).toBe(true);

    withCapability(false);
    setDataSourceMetadata({ dataSourceVersion: '3.7.0' });
    expect(isPplAlertingEnabled()).toBe(false);
  });
});

describe('isPplAlertingSupportedByDataSource (engine gate)', () => {
  afterEach(() => {
    setDataSourceMetadata(null);
  });

  test('is on for an engine at or above the PPL alerting baseline', () => {
    setDataSourceMetadata({ dataSourceVersion: '3.7.0' });
    expect(isPplAlertingSupportedByDataSource()).toBe(true);

    setDataSourceMetadata({ dataSourceVersion: '3.5.0' });
    expect(isPplAlertingSupportedByDataSource()).toBe(true);
  });

  test('is off for an engine below the baseline', () => {
    // The backend on 2.x has no PPL monitor type: a create request fails with an opaque 500.
    setDataSourceMetadata({ dataSourceVersion: '2.19.0' });
    expect(isPplAlertingSupportedByDataSource()).toBe(false);
  });

  test('is on for a serverless collection regardless of version metadata', () => {
    setDataSourceMetadata({ dataSourceEngineType: 'OpenSearch Serverless' });
    expect(isPplAlertingSupportedByDataSource()).toBe(true);
  });

  test('is on when no version is known (local cluster, or metadata not loaded yet)', () => {
    setDataSourceMetadata(null);
    expect(isPplAlertingSupportedByDataSource()).toBe(true);
    setDataSourceMetadata({ dataSourceVersion: '' });
    expect(isPplAlertingSupportedByDataSource()).toBe(true);
  });
});

describe('isPplAlertingAvailableForDataSource (create flow)', () => {
  afterEach(() => {
    setDataSourceMetadata(null);
  });

  test('needs both the capability and a capable engine', () => {
    withCapability(true);
    setDataSourceMetadata({ dataSourceVersion: '2.19.0' });
    expect(isPplAlertingAvailableForDataSource()).toBe(false);

    setDataSourceMetadata({ dataSourceVersion: '3.7.0' });
    expect(isPplAlertingAvailableForDataSource()).toBe(true);

    withCapability(false);
    expect(isPplAlertingAvailableForDataSource()).toBe(false);
  });
});
