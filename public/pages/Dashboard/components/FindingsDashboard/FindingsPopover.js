/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import _ from 'lodash';

import { EuiLink, EuiPopover, EuiSpacer, EuiText } from '@elastic/eui';

export default function FindingsPopover({ docIds = [], queries = [] }) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const onButtonClick = () => setIsPopoverOpen(!isPopoverOpen);
  const closePopover = () => setIsPopoverOpen(false);

  let header;
  let popoverContent;
  let count;

  if (!_.isEmpty(docIds)) {
    header = 'Documents';
    popoverContent = docIds.map((docId, index) => (
      <div key={`${docId}${index}`}>
        {index > 0 && <EuiSpacer size={'s'} />}
        <EuiText size={'s'}>
          <p>{docId}</p>
        </EuiText>
      </div>
    ));
    count = popoverContent.length;
  } else {
    header = 'Queries';
    popoverContent = queries.map((query, index) => (
      <div key={`${query.name}${index}`}>
        {index > 0 && <EuiSpacer size={'s'} />}
        <EuiText size={'s'}>
          <strong>{query.name}</strong>
          <p>{query.query}</p>
        </EuiText>
      </div>
    ));
    count = popoverContent.length;
  }

  const buttonContent = `${count} ${header}`;

  return (
    <EuiPopover
      button={<EuiLink onClick={onButtonClick}>{buttonContent}</EuiLink>}
      isOpen={isPopoverOpen}
      closePopover={closePopover}
    >
      {popoverContent}
    </EuiPopover>
  );
}
