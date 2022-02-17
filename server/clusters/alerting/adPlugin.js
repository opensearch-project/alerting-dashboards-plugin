/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AD_BASE_API } from '../../services/utils/constants';

export default function alertingADPlugin(Client, config, components) {
  const ca = components.clientAction.factory;

  Client.prototype.alertingAD = components.clientAction.namespaceFactory();
  const alertingAD = Client.prototype.alertingAD.prototype;

  alertingAD.getDetector = ca({
    url: {
      fmt: `${AD_BASE_API}/<%=detectorId%>`,
      req: {
        detectorId: {
          type: 'string',
          required: true,
        },
      },
    },
    method: 'GET',
  });

  alertingAD.searchDetectors = ca({
    url: {
      fmt: `${AD_BASE_API}/_search`,
    },
    needBody: true,
    method: 'POST',
  });
  alertingAD.previewDetector = ca({
    url: {
      fmt: `${AD_BASE_API}/<%=detectorId%>/_preview`,
      req: {
        detectorId: {
          type: 'string',
          required: true,
        },
      },
    },
    needBody: true,
    method: 'POST',
  });
  alertingAD.searchResults = ca({
    url: {
      fmt: `${AD_BASE_API}/results/_search`,
    },
    needBody: true,
    method: 'POST',
  });
}
