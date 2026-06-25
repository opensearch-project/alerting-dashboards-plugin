/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// Export flattenKeys for testing
const flattenKeys = (obj, prefix = '') => {
  const keys = [];
  if (obj == null || typeof obj !== 'object') return keys;
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    keys.push(path);
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
      keys.push(...flattenKeys(value[0], `${path}.0`));
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...flattenKeys(value, path));
    }
  }
  return keys;
};

module.exports = { flattenKeys };
