import { httpClientMock } from '../../test/mocks';
import OpensearchService from './OpensearchService';

import { esDriverMock, responseMock } from './OpensearchService.mock';

describe('getIndices', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return all local indices', async () => {
    const os = new OpensearchService(esDriverMock);
    const os_resp = [
      {
        health: 'green',
        index: 'test-index-a',
        status: 'open',
      },
      {
        health: 'yellow',
        index: 'test-index-b',
        status: 'open',
      },
      {
        health: 'yellow',
        index: 'test-index-c',
        status: 'open',
      },
    ];
    esDriverMock.call.mockReturnValue(os_resp);
    const requestMock = {
      body: {
        index: '*',
      },
    };
    const resp = {
      body: {
        ok: true,
        resp: os_resp,
      },
    };
    expect(await os.getIndices(undefined, requestMock, responseMock)).toEqual(resp);
    expect(esDriverMock.call).toHaveBeenCalledWith('cat.indices', {
      format: 'json',
      h: 'health,index,status',
      index: '*',
    });
  });

  it('should return matching local indices', async () => {
    const os = new OpensearchService(esDriverMock);
    const os_resp = [
      {
        health: 'green',
        index: 'test-index-a',
        status: 'open',
      },
      {
        health: 'yellow',
        index: 'test-index-b',
        status: 'open',
      },
    ];
    esDriverMock.call.mockReturnValue(os_resp);
    const requestMock = {
      body: {
        index: 'test*',
      },
    };
    const resp = {
      body: {
        ok: true,
        resp: os_resp,
      },
    };
    expect(await os.getIndices(undefined, requestMock, responseMock)).toEqual(resp);
    expect(esDriverMock.call).toHaveBeenCalledWith('cat.indices', {
      format: 'json',
      h: 'health,index,status',
      index: 'test*',
    });
  });

  it('should return all remote indices', async () => {
    const os = new OpensearchService(esDriverMock);
    const os_resp = {
      indices: [
        {
          name: 'cl2:test_index_1',
          attributes: ['open'],
        },
        {
          name: 'cl2:test_index_2',
          attributes: ['open'],
        },
        {
          name: 'cl3:test_index_1',
          attributes: ['open'],
        },
      ],
      aliases: [],
      data_streams: [],
    };
    esDriverMock.call.mockReturnValue(os_resp);
    const requestMock = {
      body: {
        index: '*:*',
      },
    };
    const resp = {
      body: {
        ok: true,
        resp: [
          {
            health: 'undefined',
            index: 'cl2:test_index_1',
            status: 'open',
          },
          {
            health: 'undefined',
            index: 'cl2:test_index_2',
            status: 'open',
          },
          {
            health: 'undefined',
            index: 'cl3:test_index_1',
            status: 'open',
          },
        ],
      },
    };
    expect(await os.getIndices(undefined, requestMock, responseMock)).toEqual(resp);
    expect(esDriverMock.call).toHaveBeenCalledWith('transport.request', {
      method: 'GET',
      path: '/_resolve/index/*:*',
    });
  });

  it('should return matching remote indices', async () => {
    const os = new OpensearchService(esDriverMock);
    const os_resp = {
      indices: [
        {
          name: 'cl2:test_index_1',
          attributes: ['open'],
        },
        {
          name: 'cl2:test_index_2',
          attributes: ['open'],
        },
      ],
      aliases: [],
      data_streams: [],
    };
    esDriverMock.call.mockReturnValue(os_resp);
    const requestMock = {
      body: {
        index: 'cl2:test*',
      },
    };
    const resp = {
      body: {
        ok: true,
        resp: [
          {
            health: 'undefined',
            index: 'cl2:test_index_1',
            status: 'open',
          },
          {
            health: 'undefined',
            index: 'cl2:test_index_2',
            status: 'open',
          },
        ],
      },
    };
    expect(await os.getIndices(undefined, requestMock, responseMock)).toEqual(resp);
    expect(esDriverMock.call).toHaveBeenCalledWith('transport.request', {
      method: 'GET',
      path: '/_resolve/index/cl2:test*',
    });
  });
});

describe('getAliases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return all local aliases', async () => {
    const os = new OpensearchService(esDriverMock);
    const os_resp = [
      {
        alias: 'test_index',
        index: 'test_index_2',
      },
      {
        alias: 'test_index',
        index: 'test_index_1',
      },
    ];
    esDriverMock.call.mockReturnValue(os_resp);
    const requestMock = {
      body: {
        alias: '*',
      },
    };
    const resp = {
      body: {
        ok: true,
        resp: os_resp,
      },
    };
    expect(await os.getAliases(undefined, requestMock, responseMock)).toEqual(resp);
    expect(esDriverMock.call).toHaveBeenCalledWith('cat.aliases', {
      alias: '*',
      format: 'json',
      h: 'alias,index',
    });
  });

  it('should return matching local aliases', async () => {
    const os = new OpensearchService(esDriverMock);
    const os_resp = [
      {
        alias: 'test_index',
        index: 'test_index_2',
      },
      {
        alias: 'test_index',
        index: 'test_index_1',
      },
    ];
    esDriverMock.call.mockReturnValue(os_resp);
    const requestMock = {
      body: {
        alias: 'test*',
      },
    };
    const resp = {
      body: {
        ok: true,
        resp: os_resp,
      },
    };
    expect(await os.getAliases(undefined, requestMock, responseMock)).toEqual(resp);
    expect(esDriverMock.call).toHaveBeenCalledWith('cat.aliases', {
      alias: 'test*',
      format: 'json',
      h: 'alias,index',
    });
  });

  it('should return all remote aliases', async () => {
    const os = new OpensearchService(esDriverMock);
    const os_resp = {
      indices: [
        {
          name: 'cl2:test_index_1',
          aliases: ['test_index'],
          attributes: ['open'],
        },
        {
          name: 'cl2:test_index_2',
          aliases: ['test_index'],
          attributes: ['open'],
        },
        {
          name: 'cl3:test_index_1',
          aliases: ['test_index'],
          attributes: ['open'],
        },
        {
          name: 'cl3:test_index_2',
          aliases: ['test_index'],
          attributes: ['open'],
        },
      ],
      aliases: [
        {
          name: 'cl2:test_index',
          indices: ['test_index_1', 'test_index_2'],
        },
        {
          name: 'cl3:test_index',
          indices: ['test_index_1', 'test_index_2'],
        },
      ],
      data_streams: [],
    };
    esDriverMock.call.mockReturnValue(os_resp);
    const requestMock = {
      body: {
        alias: '*:*',
      },
    };
    const resp = {
      body: {
        ok: true,
        resp: [
          {
            alias: 'cl2:test_index',
            index: 'test_index_1',
          },
          {
            alias: 'cl2:test_index',
            index: 'test_index_2',
          },
          {
            alias: 'cl3:test_index',
            index: 'test_index_1',
          },
          {
            alias: 'cl3:test_index',
            index: 'test_index_2',
          },
        ],
      },
    };
    expect(await os.getAliases(undefined, requestMock, responseMock)).toEqual(resp);
    expect(esDriverMock.call).toHaveBeenCalledWith('transport.request', {
      method: 'GET',
      path: '/_resolve/index/*:*',
    });
  });

  it('should return matching remote aliases', async () => {
    const os = new OpensearchService(esDriverMock);
    const os_resp = {
      indices: [
        {
          name: 'cl2:test_index_1',
          aliases: ['test_index'],
          attributes: ['open'],
        },
        {
          name: 'cl2:test_index_2',
          aliases: ['test_index'],
          attributes: ['open'],
        },
      ],
      aliases: [
        {
          name: 'cl2:test_index',
          indices: ['test_index_1', 'test_index_2'],
        },
      ],
      data_streams: [],
    };
    esDriverMock.call.mockReturnValue(os_resp);
    const requestMock = {
      body: {
        alias: 'cl2:test*',
      },
    };
    const resp = {
      body: {
        ok: true,
        resp: [
          {
            alias: 'cl2:test_index',
            index: 'test_index_1',
          },
          {
            alias: 'cl2:test_index',
            index: 'test_index_2',
          },
        ],
      },
    };
    expect(await os.getAliases(undefined, requestMock, responseMock)).toEqual(resp);
    expect(esDriverMock.call).toHaveBeenCalledWith('transport.request', {
      method: 'GET',
      path: '/_resolve/index/cl2:test*',
    });
  });
});

describe('getMappings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return local mappings', async () => {
    const os = new OpensearchService(esDriverMock);
    const os_resp = {
      test_index_2: {
        mappings: { properties: { fieldA: { type: 'text' }, fieldB: { type: 'date' } } },
      },
      test_index_1: {
        mappings: { properties: { fieldA: { type: 'text' }, fieldB: { type: 'date' } } },
      },
    };
    esDriverMock.call.mockReturnValue(os_resp);
    const requestMock = {
      body: {
        index: ['test*'],
      },
    };
    const resp = {
      body: {
        ok: true,
        resp: os_resp,
      },
    };
    expect(await os.getMappings(undefined, requestMock, responseMock)).toEqual(resp);
    expect(esDriverMock.call).toHaveBeenCalledWith('indices.getMapping', {
      index: ['test*'],
    });
  });

  it('should return remote mappings', async () => {
    const os = new OpensearchService(esDriverMock);
    const os_resp = {
      indices: ['cl2:test_index_1', 'cl3:test_index_1', 'cl3:test_index_3'],
      fields: {
        _routing: {
          _routing: {
            type: '_routing',
            searchable: true,
            aggregatable: false,
            indices: ['cl2:test_index_1', 'cl3:test_index_1'],
          },
          unmapped: {
            type: 'unmapped',
            searchable: false,
            aggregatable: false,
            indices: ['cl3:test_index_3'],
          },
        },
        fieldA: {
          text: {
            type: 'text',
            searchable: true,
            aggregatable: false,
            indices: ['cl2:test_index_1', 'cl3:test_index_1'],
          },
          unmapped: {
            type: 'unmapped',
            searchable: false,
            aggregatable: false,
            indices: ['cl3:test_index_3'],
          },
        },
        _doc_count: {
          long: {
            type: 'long',
            searchable: false,
            aggregatable: false,
            indices: ['cl2:test_index_1', 'cl3:test_index_1'],
          },
          unmapped: {
            type: 'unmapped',
            searchable: false,
            aggregatable: false,
            indices: ['cl3:test_index_3'],
          },
        },
        _index: {
          _index: {
            type: '_index',
            searchable: true,
            aggregatable: true,
            indices: ['cl2:test_index_1', 'cl3:test_index_1'],
          },
          unmapped: {
            type: 'unmapped',
            searchable: false,
            aggregatable: false,
            indices: ['cl3:test_index_3'],
          },
        },
        _feature: {
          _feature: {
            type: '_feature',
            searchable: false,
            aggregatable: false,
            indices: ['cl2:test_index_1', 'cl3:test_index_1'],
          },
          unmapped: {
            type: 'unmapped',
            searchable: false,
            aggregatable: false,
            indices: ['cl3:test_index_3'],
          },
        },
        fieldB: {
          date: {
            type: 'date',
            searchable: true,
            aggregatable: true,
            indices: ['cl2:test_index_1', 'cl3:test_index_1'],
          },
          unmapped: {
            type: 'unmapped',
            searchable: false,
            aggregatable: false,
            indices: ['cl3:test_index_3'],
          },
        },
        _ignored: {
          _ignored: {
            type: '_ignored',
            searchable: true,
            aggregatable: false,
            indices: ['cl2:test_index_1', 'cl3:test_index_1'],
          },
          unmapped: {
            type: 'unmapped',
            searchable: false,
            aggregatable: false,
            indices: ['cl3:test_index_3'],
          },
        },
        _seq_no: {
          _seq_no: {
            type: '_seq_no',
            searchable: true,
            aggregatable: true,
            indices: ['cl2:test_index_1', 'cl3:test_index_1'],
          },
          unmapped: {
            type: 'unmapped',
            searchable: false,
            aggregatable: false,
            indices: ['cl3:test_index_3'],
          },
        },
        _nested_path: {
          _nested_path: {
            type: '_nested_path',
            searchable: true,
            aggregatable: false,
            indices: ['cl2:test_index_1', 'cl3:test_index_1'],
          },
          unmapped: {
            type: 'unmapped',
            searchable: false,
            aggregatable: false,
            indices: ['cl3:test_index_3'],
          },
        },
        _field_names: {
          _field_names: {
            type: '_field_names',
            searchable: true,
            aggregatable: false,
            indices: ['cl2:test_index_1', 'cl3:test_index_1'],
          },
          unmapped: {
            type: 'unmapped',
            searchable: false,
            aggregatable: false,
            indices: ['cl3:test_index_3'],
          },
        },
        _data_stream_timestamp: {
          _data_stream_timestamp: {
            type: '_data_stream_timestamp',
            searchable: false,
            aggregatable: false,
            indices: ['cl2:test_index_1', 'cl3:test_index_1'],
          },
          unmapped: {
            type: 'unmapped',
            searchable: false,
            aggregatable: false,
            indices: ['cl3:test_index_3'],
          },
        },
        _source: {
          _source: {
            type: '_source',
            searchable: false,
            aggregatable: false,
            indices: ['cl2:test_index_1', 'cl3:test_index_1'],
          },
          unmapped: {
            type: 'unmapped',
            searchable: false,
            aggregatable: false,
            indices: ['cl3:test_index_3'],
          },
        },
        _id: {
          _id: {
            type: '_id',
            searchable: true,
            aggregatable: true,
            indices: ['cl2:test_index_1', 'cl3:test_index_1'],
          },
          unmapped: {
            type: 'unmapped',
            searchable: false,
            aggregatable: false,
            indices: ['cl3:test_index_3'],
          },
        },
        _version: {
          _version: {
            type: '_version',
            searchable: false,
            aggregatable: false,
            indices: ['cl2:test_index_1', 'cl3:test_index_1'],
          },
          unmapped: {
            type: 'unmapped',
            searchable: false,
            aggregatable: false,
            indices: ['cl3:test_index_3'],
          },
        },
      },
    };
    esDriverMock.call.mockReturnValue(os_resp);
    const requestMock = {
      body: {
        index: ['*:test*'],
      },
    };
    const resp = {
      body: {
        ok: true,
        resp: {
          'cl2:test_index_1': {
            mappings: { properties: { fieldA: { type: 'text' }, fieldB: { type: 'date' } } },
          },
          'cl3:test_index_1': {
            mappings: { properties: { fieldA: { type: 'text' }, fieldB: { type: 'date' } } },
          },
          'cl3:test_index_3': { mappings: { properties: {} } },
        },
      },
    };
    expect(await os.getMappings(undefined, requestMock, responseMock)).toEqual(resp);
    expect(esDriverMock.call).toHaveBeenCalledWith('transport.request', {
      method: 'GET',
      path: '*:test*/_field_caps?fields=*&include_unmapped',
    });
  });
  it('should return local and remote mappings', async () => {
    const os = new OpensearchService(esDriverMock);
    const os_resp1 = {
      test_index_1: {
        mappings: { properties: { fieldA: { type: 'text' }, fieldB: { type: 'date' } } },
      },
    };
    const os_resp2 = {
      indices: ['cl2:test_index_1'],
      fields: {
        _routing: { _routing: { type: '_routing', searchable: true, aggregatable: false } },
        fieldA: { text: { type: 'text', searchable: true, aggregatable: false } },
        _doc_count: { long: { type: 'long', searchable: false, aggregatable: false } },
        _index: { _index: { type: '_index', searchable: true, aggregatable: true } },
        _feature: { _feature: { type: '_feature', searchable: false, aggregatable: false } },
        fieldB: { date: { type: 'date', searchable: true, aggregatable: true } },
        _ignored: { _ignored: { type: '_ignored', searchable: true, aggregatable: false } },
        _seq_no: { _seq_no: { type: '_seq_no', searchable: true, aggregatable: true } },
        _nested_path: {
          _nested_path: { type: '_nested_path', searchable: true, aggregatable: false },
        },
        _field_names: {
          _field_names: { type: '_field_names', searchable: true, aggregatable: false },
        },
        _data_stream_timestamp: {
          _data_stream_timestamp: {
            type: '_data_stream_timestamp',
            searchable: false,
            aggregatable: false,
          },
        },
        _source: { _source: { type: '_source', searchable: false, aggregatable: false } },
        _id: { _id: { type: '_id', searchable: true, aggregatable: true } },
        _version: { _version: { type: '_version', searchable: false, aggregatable: false } },
      },
    };
    esDriverMock.call.mockReturnValueOnce(os_resp2).mockReturnValueOnce(os_resp1);
    const requestMock = {
      body: {
        index: ['test_index_1', 'cl2:test_index_1'],
      },
    };
    const resp = {
      body: {
        ok: true,
        resp: {
          test_index_1: {
            mappings: { properties: { fieldA: { type: 'text' }, fieldB: { type: 'date' } } },
          },
          'cl2:test_index_1': {
            mappings: { properties: { fieldA: { type: 'text' }, fieldB: { type: 'date' } } },
          },
        },
      },
    };
    expect(await os.getMappings(undefined, requestMock, responseMock)).toEqual(resp);
    expect(esDriverMock.call).toHaveBeenNthCalledWith(1, 'transport.request', {
      method: 'GET',
      path: 'cl2:test_index_1/_field_caps?fields=*&include_unmapped',
    });
    expect(esDriverMock.call).toHaveBeenNthCalledWith(2, 'indices.getMapping', {
      index: ['test_index_1'],
    });
  });
});
