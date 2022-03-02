/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

export const validateDestination = (destinations) => (value) => {
  if (!value) return 'Required.';
  // In case existing destination doesn't exist in list , invalidate the field
  const destinationMatches = destinations.filter((destination) => destination.value === value);
  if (destinationMatches.length === 0) {
    return 'Required.';
  }
};
