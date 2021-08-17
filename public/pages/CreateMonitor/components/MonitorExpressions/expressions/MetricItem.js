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
import { EuiPopover, EuiBadge, EuiPopoverTitle } from '@elastic/eui';
import MetricPopover from './MetricPopover';
import { Expressions } from './utils/constants';

export default function MetricItem(
  {
    values,
    onMadeChanges,
    arrayHelpers,
    fieldOptions,
    expressionWidth,
    aggregation,
    index,
    openExpression,
    closeExpression,
  } = this.props
) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(aggregation.fieldName === '');
  const closePopover = () => {
    setIsPopoverOpen(false);
    closeExpression(Expressions.METRICS);
  };

  // TODO: Commenting this out for now since the 'count_of_all_documents` metric is malformed
  //The first metric is read only
  // if (index == 0)
  //   return (
  //     <EuiBadge>
  //       {aggregation.aggregationType} of {aggregation.fieldName}
  //     </EuiBadge>
  //   );

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
              //TODO: Set options to the current agg values
              openExpression(Expressions.METRICS);
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
        values={values}
        onMadeChanges={onMadeChanges}
        arrayHelpers={arrayHelpers}
        options={fieldOptions}
        closePopover={closePopover}
        expressionWidth={expressionWidth}
        aggregation={aggregation}
        index={index}
      />
    </EuiPopover>
  );
}
