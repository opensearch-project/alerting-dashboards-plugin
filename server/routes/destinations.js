/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { createValidateQuerySchema } from '../services/utils/helpers';

export default function (services, router, dataSourceEnabled) {
  const { destinationsService } = services;

  const fieldValidations = {
    from: schema.maybe(schema.number()),
    size: schema.maybe(schema.number()),
    search: schema.maybe(schema.string()),
    sortField: schema.maybe(schema.string()),
    sortDirection: schema.maybe(schema.string()),
    type: schema.maybe(schema.string()),
  };
  router.get(
    {
      path: '/api/alerting/destinations',
      validate: {
        query: createValidateQuerySchema(dataSourceEnabled, fieldValidations),
      },
    },
    destinationsService.getDestinations
  );

  router.get(
    {
      path: '/api/alerting/destinations/{destinationId}',
      validate: {
        params: schema.object({
          destinationId: schema.string(),
        }),
        query: createValidateQuerySchema(dataSourceEnabled),
      },
    },
    destinationsService.getDestination
  );

  router.post(
    {
      path: '/api/alerting/destinations',
      validate: {
        body: schema.any(),
        query: createValidateQuerySchema(dataSourceEnabled),
      },
    },
    destinationsService.createDestination
  );

  const destinationsFieldValidation = {
    ifSeqNo: schema.string(),
    ifPrimaryTerm: schema.string(),
  };

  router.put(
    {
      path: '/api/alerting/destinations/{destinationId}',
      validate: {
        params: schema.object({
          destinationId: schema.string(),
        }),
        query: createValidateQuerySchema(dataSourceEnabled, destinationsFieldValidation),
        body: schema.any(),
      },
    },
    destinationsService.updateDestination
  );

  router.delete(
    {
      path: '/api/alerting/destinations/{destinationId}',
      validate: {
        params: schema.object({
          destinationId: schema.string(),
        }),
        query: createValidateQuerySchema(dataSourceEnabled),
      },
    },
    destinationsService.deleteDestination
  );

  const queryValidationFields = {
    search: schema.maybe(schema.string()),
    size: schema.number(),
  };
  router.get(
    {
      path: '/api/alerting/destinations/email_accounts',
      validate: {
        query: createValidateQuerySchema(dataSourceEnabled, queryValidationFields),
      },
    },
    destinationsService.getEmailAccounts
  );

  router.post(
    {
      path: '/api/alerting/destinations/email_accounts',
      validate: {
        body: schema.any(),
        query: createValidateQuerySchema(dataSourceEnabled, queryValidationFields),
      },
    },
    destinationsService.createEmailAccount
  );

  router.get(
    {
      path: '/api/alerting/destinations/email_accounts/{id}',
      validate: {
        params: schema.object({
          id: schema.string(),
        }),
        query: createValidateQuerySchema(dataSourceEnabled, queryValidationFields),
      },
    },
    destinationsService.getEmailAccount
  );

  router.put(
    {
      path: '/api/alerting/destinations/email_accounts/{id}',
      validate: {
        params: schema.object({
          id: schema.string(),
        }),
        query: createValidateQuerySchema(dataSourceEnabled, destinationsFieldValidation),
        body: schema.any(),
      },
    },
    destinationsService.updateEmailAccount
  );

  router.delete(
    {
      path: '/api/alerting/destinations/email_accounts/{id}',
      validate: {
        params: schema.object({
          id: schema.string(),
        }),
        query: createValidateQuerySchema(dataSourceEnabled),
      },
    },
    destinationsService.deleteEmailAccount
  );

  router.get(
    {
      path: '/api/alerting/destinations/email_groups',
      validate: {
        query: createValidateQuerySchema(dataSourceEnabled, queryValidationFields),
      },
    },
    destinationsService.getEmailGroups
  );

  router.post(
    {
      path: '/api/alerting/destinations/email_groups',
      validate: {
        body: schema.any(),
        query: createValidateQuerySchema(dataSourceEnabled),
      },
    },
    destinationsService.createEmailGroup
  );

  router.get(
    {
      path: '/api/alerting/destinations/email_groups/{id}',
      validate: {
        params: schema.object({
          id: schema.string(),
        }),
        query: createValidateQuerySchema(dataSourceEnabled),
      },
    },
    destinationsService.getEmailGroup
  );

  router.put(
    {
      path: '/api/alerting/destinations/email_groups/{id}',
      validate: {
        params: schema.object({
          id: schema.string(),
        }),
        query: createValidateQuerySchema(dataSourceEnabled, destinationsFieldValidation),
        body: schema.any(),
      },
    },
    destinationsService.updateEmailGroup
  );

  router.delete(
    {
      path: '/api/alerting/destinations/email_groups/{id}',
      validate: {
        params: schema.object({
          id: schema.string(),
        }),
        query: createValidateQuerySchema(dataSourceEnabled),
      },
    },
    destinationsService.deleteEmailGroup
  );
}
