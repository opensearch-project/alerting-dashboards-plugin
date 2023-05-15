/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const validateDestination = (destinations, isFullText) => (value) => {
  if (!value)
    return isFullText ? 'Please select a channel or remove this notification.' : 'Required.';
  // In case existing destination doesn't exist in list , invalidate the field
  const destinationMatches = destinations.filter((destination) => destination.value === value);
  if (destinationMatches.length === 0) {
    return 'Required.';
  }
};
