/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import _ from 'lodash';
import { EuiPopover, EuiBadge, EuiPopoverTitle, EuiSpacer } from '@elastic/eui';
import { GroupByPopover } from './index';

export default function GroupByItem(
  { values, arrayHelpers, fieldOptions, expressionWidth, groupByItem, index, flyoutMode } = this
    .props
) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(groupByItem === '');
  const closePopover = () => {
    if (_.isEmpty(groupByItem)) arrayHelpers.remove(index);
    setIsPopoverOpen(false);
  };
  const badge = (
    <EuiBadge
      color="hollow"
      iconSide="right"
      iconType="cross"
      iconOnClick={() => {
        arrayHelpers.remove(index);
      }}
      iconOnClickAriaLabel="Remove group by"
      onClick={() => {
        setIsPopoverOpen(true);
      }}
      onClickAriaLabel="Edit group by"
    >
      {groupByItem}
    </EuiBadge>
  );

  if (flyoutMode) {
    return (
      <>
        {badge}
        <EuiSpacer size="s" />
        <GroupByPopover
          values={values}
          options={fieldOptions}
          closePopover={closePopover}
          expressionWidth={expressionWidth}
          index={index}
          flyoutMode={flyoutMode}
        />
      </>
    );
  }

  return (
    <EuiPopover
      id="groupBy-badge-popover"
      button={<div>{badge}</div>}
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
        options={fieldOptions}
        closePopover={closePopover}
        expressionWidth={expressionWidth}
        index={index}
      />
    </EuiPopover>
  );
}
