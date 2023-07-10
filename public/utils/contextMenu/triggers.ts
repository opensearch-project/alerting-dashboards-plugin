/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Trigger } from '../../../../../src/plugins/ui_actions/public';

export const ALERTING_TRIGGER_AD_ID = 'ALERTING_TRIGGER_AD_ID';

declare module '../../../../../src/plugins/ui_actions/public' {
  export interface TriggerContextMapping {
    [ALERTING_TRIGGER_AD_ID]: {};
  }
}

export const alertingTriggerAd: Trigger = {
  id: ALERTING_TRIGGER_AD_ID,
};
