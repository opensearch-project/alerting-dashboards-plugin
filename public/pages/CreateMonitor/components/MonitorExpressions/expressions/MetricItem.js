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

import React, { useState } from 'react';
import _ from 'lodash';
import { EuiPopover, EuiBadge, EuiPopoverTitle } from '@elastic/eui';
import MetricPopover from './MetricPopover';

export default function MetricItem(
  { arrayHelpers, fieldOptions, expressionWidth, aggregation, index } = this.props
) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(aggregation.fieldName === '');
  const closePopover = () => {
    if (_.isEmpty(aggregation.fieldName)) arrayHelpers.remove(index);
    setIsPopoverOpen(false);
  };

  return (
    <EuiPopover
      id="metric-badge-popover"
      button={
        <div>
          <EuiBadge
            color="hollow"
            iconSide="right"
            iconType="cross"
            iconOnClick={() => arrayHelpers.remove(index)}
            iconOnClickAriaLabel="Remove metric"
            onClick={() => {
              setIsPopoverOpen(true);
            }}
            onClickAriaLabel="Edit metric"
          >
            {aggregation.aggregationType.toUpperCase()} OF {aggregation.fieldName}
          </EuiBadge>
        </div>
      }
      isOpen={isPopoverOpen}
      closePopover={closePopover}
      panelPaddingSize="none"
      ownFocus
      withTitle
      anchorPosition="downLeft"
    >
      <EuiPopoverTitle> ADD METRIC </EuiPopoverTitle>
      <MetricPopover
        options={fieldOptions}
        closePopover={closePopover}
        expressionWidth={expressionWidth}
        index={index}
      />
    </EuiPopover>
  );
}
