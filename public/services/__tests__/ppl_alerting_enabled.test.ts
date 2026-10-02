/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { isPplAlertingEnabled, setApplication, setDataSourceMetadata } from '../services';

const withCapability = (pplV2: boolean) =>
  setApplication({ capabilities: { alertingDashboards: { pplV2 } } } as any);

describe('isPplAlertingEnabled', () => {
  afterEach(() => {
    setDataSourceMetadata(null);
  });

  test('is on for an engine at or above the PPL alerting baseline', () => {
    withCapability(false);
    setDataSourceMetadata({ dataSourceVersion: '3.7.0' });
    expect(isPplAlertingEnabled()).toBe(true);

    setDataSourceMetadata({ dataSourceVersion: '3.5.0' });
    expect(isPplAlertingEnabled()).toBe(true);
  });

  test('is off for an engine below the baseline even when the pplV2 capability is on', () => {
    // The backend on 2.x has no PPL monitor type: a create request fails with an opaque 500,
    // so the card must not be offered regardless of the deployment-level capability.
    withCapability(true);
    setDataSourceMetadata({ dataSourceVersion: '2.19.0' });
    expect(isPplAlertingEnabled()).toBe(false);

    withCapability(false);
    expect(isPplAlertingEnabled()).toBe(false);
  });

  test('is on for a serverless collection regardless of version metadata', () => {
    withCapability(false);
    setDataSourceMetadata({ dataSourceEngineType: 'OpenSearch Serverless' });
    expect(isPplAlertingEnabled()).toBe(true);
  });

  test('falls back to the pplV2 capability when no data source version is known', () => {
    setDataSourceMetadata(null);
    withCapability(true);
    expect(isPplAlertingEnabled()).toBe(true);

    withCapability(false);
    expect(isPplAlertingEnabled()).toBe(false);
  });
});
