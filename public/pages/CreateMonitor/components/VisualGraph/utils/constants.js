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

/*
 *   Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 *   Licensed under the Apache License, Version 2.0 (the "License").
 *   You may not use this file except in compliance with the License.
 *   A copy of the License is located at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   or in the "license" file accompanying this file. This file is distributed
 *   on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 *   express or implied. See the License for the specific language governing
 *   permissions and limitations under the License.
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
