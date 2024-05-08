/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import queryString from 'query-string';
import {
  APP_PATH,
  DESTINATION_ACTIONS,
  MONITOR_ACTIONS,
  TRIGGER_ACTIONS,
} from '../../utils/constants';
import { createQueryObject } from '../../pages/utils/helpers';

export async function getBreadcrumbs(httpClient, history, location) {
  const { state: routeState } = location;
  const rawBreadcrumbs = await getBreadcrumbsData(window.location.hash, routeState, httpClient);

  return rawBreadcrumbs.map((breadcrumb) => createEuiBreadcrumb(breadcrumb, history));
}

export function createEuiBreadcrumb(breadcrumb, history) {
  const { text, href } = breadcrumb;
  return {
    text,
    href: `#${href}`,
    onClick: (e) => {
      e.preventDefault();
      history.push(href);
    },
  };
}

export async function getBreadcrumbsData(hash, routeState, httpClient) {
  const routes = parseLocationHash(hash);
  const asyncBreadcrumbs = await Promise.all(
    routes.map((route) => getBreadcrumb(route, routeState, httpClient))
  );
  const breadcrumbs = _.flatten(asyncBreadcrumbs).filter((breadcrumb) => !!breadcrumb);
  return breadcrumbs;
}

export function parseLocationHash(hash) {
  return hash.split('/').filter((route) => !!route);
}

export async function getBreadcrumb(route, routeState, httpClient) {
  const [base, queryParams] = route.split('?');
  if (!base) return null;
  // This condition is true for any auto generated 20 character long,
  // URL-safe, base64-encoded document ID by opensearch
  if (RegExp(/^[0-9a-z_-]{20}$/i).test(base)) {
    const { action, type, monitorType } = queryString.parse(`?${queryParams}`);
    switch (action) {
      case DESTINATION_ACTIONS.UPDATE_DESTINATION:
        const destinationName = _.get(routeState, 'destinationToEdit.name', base);
        const destinationBreadcrumbs = [{ text: destinationName, href: `/destinations/${base}` }];
        if (action === DESTINATION_ACTIONS.UPDATE_DESTINATION) {
          destinationBreadcrumbs.push({ text: 'Update destination', href: '/' });
        }
        return destinationBreadcrumbs;
      default:
        // TODO::Everything else is considered as monitor, we should break this.
        let monitorName = base;
        try {
          const searchPool =
            type === 'workflow' || monitorType === 'composite' ? 'workflows' : 'monitors';
          const dataSourceQuery = createQueryObject();
          // Construct the full URL with the query parameters
          let url = `../api/alerting/${searchPool}/${base}`;

          const response = await httpClient.get(url, {
            ...(dataSourceQuery ? { query: dataSourceQuery } : {}),
          });

          if (response.ok) {
            monitorName = response.resp.name;
          }
        } catch (err) {
          console.error(err);
        }
        const breadcrumbs = [{ text: monitorName, href: `/monitors/${base}` }];
        if (action === MONITOR_ACTIONS.UPDATE_MONITOR)
          breadcrumbs.push({ text: 'Update monitor', href: '/' });
        if (action === TRIGGER_ACTIONS.CREATE_TRIGGER)
          breadcrumbs.push({ text: 'Create trigger', href: '/' });
        if (action === TRIGGER_ACTIONS.UPDATE_TRIGGER)
          breadcrumbs.push({ text: 'Update trigger', href: '/' });
        return breadcrumbs;
    }
  }

  return {
    '#': { text: 'Alerting', href: '/' },
    monitors: { text: 'Monitors', href: '/monitors' },
    dashboard: { text: 'Alerts', href: '/dashboard' },
    destinations: { text: 'Destinations', href: '/destinations' },
    'create-monitor': [
      { text: 'Monitors', href: '/monitors' },
      { text: 'Create monitor', href: APP_PATH.CREATE_MONITOR },
    ],
    'create-destination': [
      { text: 'Destinations', href: '/destinations' },
      { text: 'Create destination', href: APP_PATH.CREATE_DESTINATION },
    ],
  }[base];
}
