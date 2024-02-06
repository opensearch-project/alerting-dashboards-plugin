/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  API_ROUTE_PREFIX,
  MONITOR_BASE_API,
  DESTINATION_BASE_API,
  EMAIL_ACCOUNT_BASE_API,
  EMAIL_GROUP_BASE_API,
  WORKFLOW_BASE_API,
  CROSS_CLUSTER_BASE_API,
} from '../../services/utils/constants';

export default function alertingPlugin(Client, config, components) {
  const ca = components.clientAction.factory;

  Client.prototype.alerting = components.clientAction.namespaceFactory();
  const alerting = Client.prototype.alerting.prototype;

  alerting.getFindings = ca({
    url: {
      fmt: `${API_ROUTE_PREFIX}/findings/_search`,
    },
    needBody: true,
    method: 'GET',
  });

  alerting.getWorkflow = ca({
    url: {
      fmt: `${API_ROUTE_PREFIX}/workflows/<%=monitorId%>`,
      req: {
        monitorId: {
          type: 'string',
          required: true,
        },
      },
    },
    method: 'GET',
  });

  alerting.getMonitor = ca({
    url: {
      fmt: `${MONITOR_BASE_API}/<%=monitorId%>`,
      req: {
        monitorId: {
          type: 'string',
          required: true,
        },
      },
    },
    method: 'GET',
  });

  alerting.createMonitor = ca({
    url: {
      fmt: `${MONITOR_BASE_API}?refresh=wait_for`,
    },
    needBody: true,
    method: 'POST',
  });

  alerting.createWorkflow = ca({
    url: {
      fmt: `${API_ROUTE_PREFIX}/workflows?refresh=wait_for`,
    },
    needBody: true,
    method: 'POST',
  });

  alerting.deleteMonitor = ca({
    url: {
      fmt: `${MONITOR_BASE_API}/<%=monitorId%>`,
      req: {
        monitorId: {
          type: 'string',
          required: true,
        },
      },
    },
    method: 'DELETE',
  });

  alerting.deleteWorkflow = ca({
    url: {
      fmt: `${WORKFLOW_BASE_API}/<%=workflowId%>`,
      req: {
        workflowId: {
          type: 'string',
          required: true,
        },
      },
    },
    method: 'DELETE',
  });

  // TODO DRAFT: May need to add 'refresh' assignment here again.
  alerting.updateMonitor = ca({
    url: {
      fmt: `${MONITOR_BASE_API}/<%=monitorId%>`,
      req: {
        monitorId: {
          type: 'string',
          required: true,
        },
      },
    },
    needBody: true,
    method: 'PUT',
  });

  // TODO DRAFT: May need to add 'refresh' assignment here again.
  alerting.updateWorkflow = ca({
    url: {
      fmt: `${API_ROUTE_PREFIX}/workflows/<%=monitorId%>`,
      req: {
        monitorId: {
          type: 'string',
          required: true,
        },
      },
    },
    needBody: true,
    method: 'PUT',
  });

  alerting.getMonitors = ca({
    url: {
      fmt: `${MONITOR_BASE_API}/_search`,
    },
    needBody: true,
    method: 'POST',
  });

  alerting.acknowledgeAlerts = ca({
    url: {
      fmt: `${MONITOR_BASE_API}/<%=monitorId%>/_acknowledge/alerts`,
      req: {
        monitorId: {
          type: 'string',
          required: true,
        },
      },
    },
    needBody: true,
    method: 'POST',
  });

  alerting.acknowledgeChainedAlerts = ca({
    url: {
      fmt: `${WORKFLOW_BASE_API}/<%=workflowId%>/_acknowledge/alerts`,
      req: {
        workflowId: {
          type: 'string',
          required: true,
        },
      },
    },
    needBody: true,
    method: 'POST',
  });

  alerting.getAlerts = ca({
    url: {
      fmt: `${MONITOR_BASE_API}/alerts`,
    },
    method: 'GET',
  });

  alerting.executeMonitor = ca({
    url: {
      fmt: `${MONITOR_BASE_API}/_execute?dryrun=<%=dryrun%>`,
      req: {
        dryrun: {
          type: 'string',
          required: true,
        },
      },
    },
    needBody: true,
    method: 'POST',
  });

  alerting.getDestination = ca({
    url: {
      fmt: `${DESTINATION_BASE_API}/<%=destinationId%>`,
      req: {
        destinationId: {
          type: 'string',
          required: true,
        },
      },
    },
    method: 'GET',
  });

  alerting.searchDestinations = ca({
    url: {
      fmt: `${DESTINATION_BASE_API}`,
    },
    method: 'GET',
  });

  alerting.createDestination = ca({
    url: {
      fmt: `${DESTINATION_BASE_API}?refresh=wait_for`,
    },
    needBody: true,
    method: 'POST',
  });

  alerting.updateDestination = ca({
    url: {
      fmt: `${DESTINATION_BASE_API}/<%=destinationId%>?if_seq_no=<%=ifSeqNo%>&if_primary_term=<%=ifPrimaryTerm%>&refresh=wait_for`,
      req: {
        destinationId: {
          type: 'string',
          required: true,
        },
        ifSeqNo: {
          type: 'string',
          required: true,
        },
        ifPrimaryTerm: {
          type: 'string',
          required: true,
        },
      },
    },
    needBody: true,
    method: 'PUT',
  });

  alerting.deleteDestination = ca({
    url: {
      fmt: `${DESTINATION_BASE_API}/<%=destinationId%>`,
      req: {
        destinationId: {
          type: 'string',
          required: true,
        },
      },
    },
    method: 'DELETE',
  });

  alerting.getEmailAccount = ca({
    url: {
      fmt: `${EMAIL_ACCOUNT_BASE_API}/<%=emailAccountId%>`,
      req: {
        emailAccountId: {
          type: 'string',
          required: true,
        },
      },
    },
    method: 'GET',
  });

  alerting.getEmailAccounts = ca({
    url: {
      fmt: `${EMAIL_ACCOUNT_BASE_API}/_search`,
    },
    needBody: true,
    method: 'POST',
  });

  alerting.createEmailAccount = ca({
    url: {
      fmt: `${EMAIL_ACCOUNT_BASE_API}?refresh=wait_for`,
    },
    needBody: true,
    method: 'POST',
  });

  alerting.updateEmailAccount = ca({
    url: {
      fmt: `${EMAIL_ACCOUNT_BASE_API}/<%=emailAccountId%>?if_seq_no=<%=ifSeqNo%>&if_primary_term=<%=ifPrimaryTerm%>&refresh=wait_for`,
      req: {
        emailAccountId: {
          type: 'string',
          required: true,
        },
        ifSeqNo: {
          type: 'string',
          required: true,
        },
        ifPrimaryTerm: {
          type: 'string',
          required: true,
        },
      },
    },
    needBody: true,
    method: 'PUT',
  });

  alerting.deleteEmailAccount = ca({
    url: {
      fmt: `${EMAIL_ACCOUNT_BASE_API}/<%=emailAccountId%>`,
      req: {
        emailAccountId: {
          type: 'string',
          required: true,
        },
      },
    },
    method: 'DELETE',
  });

  alerting.getEmailGroup = ca({
    url: {
      fmt: `${EMAIL_GROUP_BASE_API}/<%=emailGroupId%>`,
      req: {
        emailGroupId: {
          type: 'string',
          required: true,
        },
      },
    },
    method: 'GET',
  });

  alerting.getEmailGroups = ca({
    url: {
      fmt: `${EMAIL_GROUP_BASE_API}/_search`,
    },
    needBody: true,
    method: 'POST',
  });

  alerting.createEmailGroup = ca({
    url: {
      fmt: `${EMAIL_GROUP_BASE_API}?refresh=wait_for`,
    },
    needBody: true,
    method: 'POST',
  });

  alerting.updateEmailGroup = ca({
    url: {
      fmt: `${EMAIL_GROUP_BASE_API}/<%=emailGroupId%>?if_seq_no=<%=ifSeqNo%>&if_primary_term=<%=ifPrimaryTerm%>&refresh=wait_for`,
      req: {
        emailGroupId: {
          type: 'string',
          required: true,
        },
        ifSeqNo: {
          type: 'string',
          required: true,
        },
        ifPrimaryTerm: {
          type: 'string',
          required: true,
        },
      },
    },
    needBody: true,
    method: 'PUT',
  });

  alerting.deleteEmailGroup = ca({
    url: {
      fmt: `${EMAIL_GROUP_BASE_API}/<%=emailGroupId%>`,
      req: {
        emailGroupId: {
          type: 'string',
          required: true,
        },
      },
    },
    method: 'DELETE',
  });

  alerting.getWorkflowAlerts = ca({
    url: {
      fmt: `${WORKFLOW_BASE_API}/alerts?workflowIds=<%=workflowIds%>&getAssociatedAlerts=<%=getAssociatedAlerts%>&sortString=<%=sortString%>&sortOrder=<%=sortOrder%>&startIndex=<%=startIndex%>&size=<%=size%>&severityLevel=<%=severityLevel%>&alertState=<%=alertState%>&searchString=<%=searchString%>&alertIds=<%=alertIds%>`,
      req: {
        workflowIds: {
          type: 'string',
          required: true,
        },
        alertIds: {
          type: 'string',
          required: true,
        },
        getAssociatedAlerts: {
          type: 'boolean',
          required: true,
        },
        sortString: {
          type: 'string',
          required: true,
        },
        sortOrder: {
          type: 'string',
          required: true,
        },
        startIndex: {
          type: 'number',
          required: true,
        },
        size: {
          type: 'number',
          required: true,
        },
        severityLevel: {
          type: 'string',
          required: false,
        },
        alertState: {
          type: 'string',
          required: false,
        },
        searchString: {
          type: 'string',
          required: false,
        },
      },
    },
    method: 'GET',
  });

  alerting.getRemoteIndexes = ca({
    url: {
      fmt: `${CROSS_CLUSTER_BASE_API}/indexes?indexes=<%=indexes%>&include_mappings=<%=include_mappings%>`,
      req: {
        indexes: {
          type: 'string',
          required: true,
        },
        include_mappings: {
          type: 'boolean',
          required: false,
        },
      },
    },
    needBody: true,
    method: 'GET',
  });
}
