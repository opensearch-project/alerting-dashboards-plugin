/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';

export default function (services, router) {
  const { destinationsService } = services;

  router.get(
    {
      path: '/api/alerting/destinations',
      validate: {
        query: schema.object({
          from: schema.maybe(schema.number()),
          size: schema.maybe(schema.number()),
          search: schema.maybe(schema.string()),
          sortField: schema.maybe(schema.string()),
          sortDirection: schema.maybe(schema.string()),
          type: schema.maybe(schema.string()),
        }),
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
      },
    },
    destinationsService.getDestination
  );

  router.post(
    {
      path: '/api/alerting/destinations',
      validate: {
        body: schema.any(),
      },
    },
    destinationsService.createDestination
  );

  router.put(
    {
      path: '/api/alerting/destinations/{destinationId}',
      validate: {
        params: schema.object({
          destinationId: schema.string(),
        }),
        query: schema.object({
          ifSeqNo: schema.string(),
          ifPrimaryTerm: schema.string(),
        }),
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
      },
    },
    destinationsService.deleteDestination
  );

  router.get(
    {
      path: '/api/alerting/destinations/email_accounts',
      validate: {
        query: schema.object({
          search: schema.maybe(schema.string()),
          size: schema.number(),
        }),
      },
    },
    destinationsService.getEmailAccounts
  );

  router.post(
    {
      path: '/api/alerting/destinations/email_accounts',
      validate: {
        body: schema.any(),
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
        query: schema.object({
          ifSeqNo: schema.number(),
          ifPrimaryTerm: schema.number(),
        }),
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
      },
    },
    destinationsService.deleteEmailAccount
  );

  router.get(
    {
      path: '/api/alerting/destinations/email_groups',
      validate: {
        query: schema.object({
          search: schema.maybe(schema.string()),
          size: schema.number(),
        }),
      },
    },
    destinationsService.getEmailGroups
  );

  router.post(
    {
      path: '/api/alerting/destinations/email_groups',
      validate: {
        body: schema.any(),
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
        query: schema.object({
          ifSeqNo: schema.number(),
          ifPrimaryTerm: schema.number(),
        }),
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
      },
    },
    destinationsService.deleteEmailGroup
  );
}
