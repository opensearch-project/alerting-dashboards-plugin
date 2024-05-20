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
});

describe('getRoles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const os_resp = {
    manage_snapshots: {
      hosts: [],
      users: [],
      reserved: false,
      hidden: false,
      backend_roles: ['snapshotrestore'],
      and_backend_roles: [],
    },
    logstash: {
      hosts: [],
      users: [],
      reserved: false,
      hidden: false,
      backend_roles: ['logstash'],
      and_backend_roles: [],
    },
    own_index: {
      hosts: [],
      users: ['*'],
      reserved: false,
      hidden: false,
      backend_roles: [],
      and_backend_roles: [],
      description: 'Allow full access to an index named like the username',
    },
    alerting_full_access: {
      hosts: [],
      users: [],
      reserved: false,
      hidden: false,
      backend_roles: ['test_bk_role_1', 'test_bk_role_2'],
      and_backend_roles: [],
    },
    all_access: {
      hosts: [],
      users: [],
      reserved: false,
      hidden: false,
      backend_roles: ['admin'],
      and_backend_roles: [],
      description: 'Maps admin to all_access',
    },
    readall: {
      hosts: [],
      users: [],
      reserved: false,
      hidden: false,
      backend_roles: ['readall', 'test_bk_role_2'],
      and_backend_roles: [],
    },
  };

  const user_role_os_resp = {
    user_name: 'test_user_1',
    is_reserved: false,
    is_hidden: false,
    is_internal_user: true,
    user_requested_tenant: null,
    backend_roles: ['test_bk_role_2', 'test_bk_role_1'],
    custom_attribute_names: [],
    tenants: { test_user_1: true },
    roles: ['manage_snapshots', 'own_index', 'alerting_full_access', 'readall'],
  };

  it('should return all cluster roles', async () => {
    const os = new OpensearchService(esDriverMock);
    esDriverMock.call.mockReturnValue(os_resp);
    const requestMock = {
      body: {
        role: [],
      },
    };
    const resp = {
      body: {
        ok: true,
        resp: [
          'snapshotrestore',
          'logstash',
          'test_bk_role_1',
          'test_bk_role_2',
          'admin',
          'readall',
        ],
      },
    };
    expect(await os.getRoles(undefined, requestMock, responseMock)).toEqual(resp);
    expect(esDriverMock.call).toHaveBeenCalledWith('transport.request', {
      method: 'GET',
      path: '_plugins/_security/api/rolesmapping',
    });
  });

  it('should return specific cluster role', async () => {
    const os = new OpensearchService(esDriverMock);
    esDriverMock.call.mockReturnValue(os_resp);
    const requestMock = {
      body: {
        role: ['test_bk_role_1'],
      },
    };
    const resp = {
      body: {
        ok: true,
        resp: ['test_bk_role_1'],
      },
    };
    expect(await os.getRoles(undefined, requestMock, responseMock)).toEqual(resp);
    expect(esDriverMock.call).toHaveBeenCalledWith('transport.request', {
      method: 'GET',
      path: '_plugins/_security/api/rolesmapping',
    });
  });

  it('should return all user roles', async () => {
    const os = new OpensearchService(esDriverMock);
    esDriverMock.call.mockRejectedValueOnce(new Error('Authorization Exception'));
    esDriverMock.call.mockReturnValueOnce(user_role_os_resp);
    const requestMock = {
      body: {
        role: [],
      },
    };
    const resp = {
      body: {
        ok: true,
        resp: ['test_bk_role_2', 'test_bk_role_1'],
      },
    };
    expect(await os.getRoles(undefined, requestMock, responseMock)).toEqual(resp);
    expect(esDriverMock.call).toHaveBeenCalledWith('transport.request', {
      method: 'GET',
      path: '_plugins/_security/api/rolesmapping',
    });
    expect(esDriverMock.call).toHaveBeenCalledWith('transport.request', {
      method: 'GET',
      path: '_plugins/_security/api/account',
    });
  });

  it('should return specific user role', async () => {
    const os = new OpensearchService(esDriverMock);
    esDriverMock.call.mockRejectedValueOnce(new Error('Authorization Exception'));
    esDriverMock.call.mockReturnValueOnce(user_role_os_resp);
    const requestMock = {
      body: {
        role: ['test_bk_role_1'],
      },
    };
    const resp = {
      body: {
        ok: true,
        resp: ['test_bk_role_1'],
      },
    };
    expect(await os.getRoles(undefined, requestMock, responseMock)).toEqual(resp);
    expect(esDriverMock.call).toHaveBeenCalledWith('transport.request', {
      method: 'GET',
      path: '_plugins/_security/api/rolesmapping',
    });
    expect(esDriverMock.call).toHaveBeenCalledWith('transport.request', {
      method: 'GET',
      path: '_plugins/_security/api/account',
    });
  });
});
