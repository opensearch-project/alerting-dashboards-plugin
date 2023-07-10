/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import _ from 'lodash';
import { EuiPopover, EuiBadge, EuiPopoverTitle, EuiSpacer } from '@elastic/eui';
import MetricPopover from './MetricPopover';

export default function MetricItem(
  { arrayHelpers, fieldOptions, expressionWidth, aggregation, index, flyoutMode } = this.props
) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(aggregation.fieldName === '');
  const closePopover = () => {
    if (_.isEmpty(aggregation.fieldName)) arrayHelpers.remove(index);
    setIsPopoverOpen(false);
  };

  if (flyoutMode) {
    let metricText = `${aggregation.aggregationType.toUpperCase()} OF ${aggregation.fieldName}`;
    if (_.isEmpty(aggregation.fieldName) && _.isEmpty(aggregation.aggregationType)) {
      metricText = '';
    }
    return (
      <div>
        <EuiBadge color="hollow">{metricText}</EuiBadge>
        <EuiSpacer size="s" />
        <MetricPopover
          options={fieldOptions}
          closePopover={closePopover}
          expressionWidth={expressionWidth}
          index={index}
          flyoutMode={flyoutMode}
        />
      </div>
    );
  }

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
