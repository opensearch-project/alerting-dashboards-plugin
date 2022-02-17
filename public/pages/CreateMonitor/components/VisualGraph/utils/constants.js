/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const SIZE_RANGE = [3, 3];
export const LINE_STYLES = { strokeWidth: 1 };
export const ANNOTATION_STYLES = { strokeWidth: 1, stroke: 'red' };
export const HINT_STYLES = {
  background: '#3a3a48',
  borderRadius: '5px',
  padding: '7px 10px',
  fontSize: '12px',
  fontWeight: 'bold',
  color: '#fff',
  textAlign: 'left',
  whiteSpace: 'nowrap',
  boxShadow: '0 2px 4px rgba(0,0,0,.5)',
};

// Don't want values to reach top of graph so increase by a buffer % so we always have a yDomain with a slightly higher max
export const Y_DOMAIN_BUFFER = 1.4; // 40%

export const X_DOMAIN_BUFFER = 0.2; // 40%

// Size of circle for each point on graph
export const DEFAULT_MARK_SIZE = 3;

export const BAR_PERCENTAGE = 0.015;

export const BAR_KEY_COUNT = 3;
