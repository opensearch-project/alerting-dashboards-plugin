/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiCallOut, EuiLink, EuiSpacer } from '@elastic/eui';

export const REMOTE_MONITORING_ENABLED_SETTING_PATH = 'plugins.alerting.remote_monitoring_enabled';

export const ExperimentalBanner = () => {
  return (
    <>
      <EuiCallOut title="Experimental Feature" iconType="beaker">
        <p>
          The feature is experimental and should not be used in a production environment. Any index
          patterns, visualization, and observability panels will be impacted if the feature is
          deactivated. For more information see&nbsp;
          <EuiLink
            href="https://opensearch.org/docs/latest/observing-your-data/alerting/monitors/"
            target="_blank"
          >
            Alerting Documentation
          </EuiLink>
          . To leave feedback, visit&nbsp;
          <EuiLink target="_blank" href="https://forum.opensearch.org/">
            forum.opensearch.org
          </EuiLink>
          .
        </p>
      </EuiCallOut>
      <EuiSpacer />
    </>
  );
};
