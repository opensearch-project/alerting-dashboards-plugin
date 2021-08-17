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
import { GroupByPopover } from './index';
import { Expressions } from './utils/constants';

export default function GroupByItem(
  {
    values,
    onMadeChanges,
    arrayHelpers,
    fieldOptions,
    expressionWidth,
    groupByItem,
    index,
    openExpression,
    closeExpression,
  } = this.props
) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(groupByItem === '');
  const closePopover = () => {
    setIsPopoverOpen(false);
    closeExpression(Expressions.GROUP_BY);
  };

  return (
    <EuiPopover
      id="groupBy-badge-popover"
      button={
        <div>
          <EuiBadge
            color="hollow"
            iconSide="right"
            iconType="cross"
            iconOnClick={() => {
              arrayHelpers.remove(index);
              onMadeChanges();
            }}
            iconOnClickAriaLabel="Remove group by"
            onClick={() => {
              openExpression(Expressions.GROUP_BY);
              setIsPopoverOpen(true);
            }}
            onClickAriaLabel="Edit group by"
          >
            {groupByItem}
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
      <EuiPopoverTitle> ADD GROUP BY </EuiPopoverTitle>
      <GroupByPopover
        values={values}
        onMadeChanges={onMadeChanges}
        arrayHelpers={arrayHelpers}
        options={fieldOptions}
        closePopover={closePopover}
        expressionWidth={expressionWidth}
        index={index}
        groupByItem={groupByItem}
      />
    </EuiPopover>
  );
}
