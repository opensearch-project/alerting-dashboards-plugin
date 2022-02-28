/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// dateFields is a string array of available time field names
export const validateTimeField = (dateFields) => (value) => {
  if (!value) return 'Select a time field.';
  if (!dateFields.filter((opt) => opt === value).length)
    return `The field "${value}" does not exist in the selected index mappings, please choose a new time field.`;
};
