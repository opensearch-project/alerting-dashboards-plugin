/*
* Copyright OpenSearch Contributors
* SPDX-License-Identifier: Apache-2.0
*/

export interface Comment {
  id: string;
  entity_id: string;
  content: string
  created_time: number;
  last_updated_time: number | null;
  user: string | null;
}