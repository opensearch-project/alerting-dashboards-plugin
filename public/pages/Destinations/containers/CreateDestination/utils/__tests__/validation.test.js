/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { validateDestinationName } from '../validations';

describe('destinations Validations', () => {
  const httpClient = {
    get: jest.fn(),
  };
  beforeEach(() => {
    jest.resetAllMocks();
  });
  describe('validateDestinationName', () => {
    httpClient.get.mockResolvedValue({
      totalDestinations: 0,
      relation: 'eq',
    });
    test('should be undefined if name is valid', () => {
      return expect(
        validateDestinationName(httpClient, null)('Valid Name')
      ).resolves.toBeUndefined();
    });
    test('should reject if name is empty', () => {
      return expect(validateDestinationName(httpClient, null)('')).resolves.toEqual('Required');
    });
    test('should reject if name already is being in used', () => {
      httpClient.get.mockResolvedValue({
        totalDestinations: 1,
        relation: 'eq',
      });
      return expect(validateDestinationName(httpClient, null)('destinationName')).resolves.toEqual(
        'Destination name is already used'
      );
    });
    test('should reject if name already is being in used while editing destination', () => {
      httpClient.get.mockResolvedValue({
        totalDestinations: 1,
        relation: 'eq',
      });
      return expect(
        validateDestinationName(httpClient, { name: 'destinationName' })('destinationName Existing')
      ).resolves.toEqual('Destination name is already used');
    });
    test('should rejects if network request has some error', () => {
      httpClient.get.mockRejectedValue({
        resp: { ok: false, error: 'There was an issue' },
      });
      return expect(validateDestinationName(httpClient, null)('destinationName')).resolves.toEqual(
        'There was a problem validating destination name. Please try again.'
      );
    });
  });
});
