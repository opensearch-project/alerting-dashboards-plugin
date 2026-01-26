/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// Severity filter options for PPL monitors
export const PPL_SEVERITY_FILTER_OPTIONS = [
  { value: 'ALL', text: 'All severity levels' },
  { value: 'critical', text: 'Critical' },
  { value: 'high', text: 'High' },
  { value: 'medium', text: 'Medium' },
  { value: 'low', text: 'Low' },
  { value: 'info', text: 'Info' },
  { value: 'error', text: 'Error' },
];

// Normalize severity strings/numbers to canonical PPL values
export const normalizePPLSeverity = (severity) => {
  if (severity === undefined || severity === null) return undefined;
  const value = String(severity).trim().toLowerCase();

  if (['info', 'low', 'medium', 'high', 'critical', 'error'].includes(value)) {
    return value;
  }

  switch (value) {
    case '0':
      return 'info';
    case '1':
      return 'low';
    case '2':
      return 'medium';
    case '3':
      return 'high';
    case '4':
      return 'critical';
    default:
      return undefined;
  }
};
