/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import AnomalyDetectorService from './AnomalyDetectorService';

const buildService = (clientImpl) => {
  const service = new AnomalyDetectorService(/* osDriver */ { asScoped: jest.fn() }, false);
  service.getClientBasedOnDataSource = jest.fn().mockResolvedValue(clientImpl);
  return service;
};
const buildRes = () => ({ ok: jest.fn((payload) => payload) });
const availability = async (client) =>
  (await buildService(client).getAvailability({}, { query: {} }, buildRes())).body;

// test/setup.jest.js spies on console.error for every test.
describe('AnomalyDetectorService.getAvailability', () => {
  test('asks with a size-0 detectors search: one cheap call, no documents', async () => {
    const client = jest.fn().mockResolvedValue({ hits: { total: { value: 3 }, hits: [] } });
    expect(await availability(client)).toEqual({ ok: true, available: true });
    const [method, args] = client.mock.calls[0];
    expect(method).toBe('alertingAD.searchDetectors');
    expect(args.body.size).toBe(0);
  });

  test('AD installed with no detector yet (no config index) is available', async () => {
    const client = jest.fn().mockRejectedValue({
      statusCode: 404,
      body: { error: { type: 'index_not_found_exception' } },
    });
    expect(await availability(client)).toEqual({ ok: true, available: true });
  });

  test('a user without permission to read detectors still has AD available', async () => {
    const client = jest.fn().mockRejectedValue({ statusCode: 403 });
    expect(await availability(client)).toEqual({ ok: true, available: true });
  });

  test('no AD (no handler for the route) is not available, and nothing is logged', async () => {
    const client = jest.fn().mockRejectedValue({
      statusCode: 400,
      body: { error: 'no handler found for uri [/_plugins/_anomaly_detection/detectors/_search]' },
    });
    expect(await availability(client)).toEqual({ ok: true, available: false });
    expect(console.error).not.toHaveBeenCalled();
  });
});
