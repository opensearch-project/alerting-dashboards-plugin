/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

import { EuiLink, EuiPopover, EuiSpacer, EuiText } from '@elastic/eui';

export default function QueryPopover(queries) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const onButtonClick = () => setIsPopoverOpen(!isPopoverOpen);
  const closePopover = () => setIsPopoverOpen(false);

  const popoverContent = queries.queries.map((query, index) => {
    return (
      <div key={`${query.name}${index}`}>
        {index > 0 && <EuiSpacer size={'s'} />}
        <EuiText size={'s'}>
          <strong>{query.name}</strong>
          <p>{query.query}</p>
        </EuiText>
      </div>
    );
  });

  return (
    <EuiPopover
      button={<EuiLink onClick={onButtonClick}>{`${queries.queries.length} Queries`}</EuiLink>}
      isOpen={isPopoverOpen}
      closePopover={closePopover}
    >
      {popoverContent}
    </EuiPopover>
  );
}
