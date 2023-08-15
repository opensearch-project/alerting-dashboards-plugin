/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutHeader,
  EuiInMemoryTable,
  EuiTitle,
  EuiLink,
} from '@elastic/eui';

const getRelatedMonitorsTableColumns = (title) => [
  {
    name: title,
    render: ({ name, href, onClick }) => {
      const linkProps = href ? { href } : { onClick };
      return (
        <EuiLink {...linkProps} className="related-monitor-link" target="_blank">
          {name}
        </EuiLink>
      );
    },
  },
];

export const RelatedMonitorsFlyout = ({ links, flyoutData, onClose }) => {
  return (
    <EuiFlyout onClose={onClose}>
      <EuiFlyoutHeader>
        <EuiTitle>
          <h2>{flyoutData.header}</h2>
        </EuiTitle>
      </EuiFlyoutHeader>
      <EuiFlyoutBody>
        <EuiInMemoryTable
          columns={getRelatedMonitorsTableColumns(flyoutData.tableHeader)}
          items={links}
          pagination
        />
      </EuiFlyoutBody>
    </EuiFlyout>
  );
};
