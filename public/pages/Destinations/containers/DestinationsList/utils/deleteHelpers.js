/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const isDeleteAllowedQuery = (type, id) => ({
  size: 0,
  query: {
    nested: {
      path: `monitor.triggers.actions`,
      query: {
        bool: {
          filter: {
            term: {
              [`monitor.triggers.actions.destination_id`]: id,
            },
          },
        },
      },
    },
  },
});
