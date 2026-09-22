/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import OpensearchService from './OpensearchService';

const buildService = (clientImpl) => {
  const service = new OpensearchService(
    /* osDriver */ { asScoped: jest.fn() },
    /* dataSourceEnabled */ false,
    /* logger */ { error: jest.fn(), warn: jest.fn(), info: jest.fn() }
  );
  service.enforceWorkspaceAcl = jest.fn().mockResolvedValue(null);
  service.getClientBasedOnDataSource = jest.fn().mockResolvedValue(clientImpl);
  return service;
};

const buildRes = () => ({ ok: jest.fn((payload) => payload) });

describe('OpensearchService.getDataStreams', () => {
  test('resolves data stream names into index-shaped options', async () => {
    const client = jest.fn().mockResolvedValue({
      data_streams: [
        { name: 'repro-ds-logs', status: 'GREEN' },
        { name: 'other-ds', status: 'YELLOW' },
      ],
    });
    const service = buildService(client);

    const result = await service.getDataStreams(
      {},
      { body: { dataStream: 'repro-ds*' }, query: {} },
      buildRes()
    );

    // Queries the data stream API with the wildcard preserved.
    const [method, callArgs] = client.mock.calls[0];
    expect(method).toBe('transport.request');
    expect(callArgs.method).toBe('GET');
    expect(callArgs.path).toBe('/_data_stream/repro-ds*');

    expect(result.body.ok).toBe(true);
    expect(result.body.resp).toEqual([
      { health: 'green', index: 'repro-ds-logs', status: 'open' },
      { health: 'yellow', index: 'other-ds', status: 'open' },
    ]);
  });

  test('strips path separators from the pattern to prevent escaping the endpoint', async () => {
    const client = jest.fn().mockResolvedValue({ data_streams: [] });
    const service = buildService(client);

    await service.getDataStreams({}, { body: { dataStream: '../_nodes' }, query: {} }, buildRes());

    const [, callArgs] = client.mock.calls[0];
    expect(callArgs.path).toBe('/_data_stream/.._nodes');
  });

  test('treats a 404 (no matching data streams) as an empty result', async () => {
    const client = jest.fn().mockRejectedValue({ statusCode: 404 });
    const service = buildService(client);

    const result = await service.getDataStreams(
      {},
      { body: { dataStream: 'nope*' }, query: {} },
      buildRes()
    );

    expect(result.body).toEqual({ ok: true, resp: [] });
  });

  test('returns ok:false with the error message for non-404 errors', async () => {
    const client = jest.fn().mockRejectedValue({ statusCode: 500, message: 'boom' });
    const service = buildService(client);

    const result = await service.getDataStreams(
      {},
      { body: { dataStream: '*' }, query: {} },
      buildRes()
    );

    expect(result.body).toEqual({ ok: false, resp: 'boom' });
  });

  test('returns an empty result when the response has no data_streams field', async () => {
    const client = jest.fn().mockResolvedValue({});
    const service = buildService(client);

    const result = await service.getDataStreams(
      {},
      { body: { dataStream: '*' }, query: {} },
      buildRes()
    );

    expect(result.body).toEqual({ ok: true, resp: [] });
  });

  test('strips URL metacharacters (not just path separators) from the pattern', async () => {
    const client = jest.fn().mockResolvedValue({ data_streams: [] });
    const service = buildService(client);

    await service.getDataStreams(
      {},
      { body: { dataStream: 're?pro #x%*' }, query: {} },
      buildRes()
    );

    const [, callArgs] = client.mock.calls[0];
    // '?', whitespace, '#', and '%' removed; the '*' wildcard is preserved.
    expect(callArgs.path).toBe('/_data_stream/reprox*');
  });
});
