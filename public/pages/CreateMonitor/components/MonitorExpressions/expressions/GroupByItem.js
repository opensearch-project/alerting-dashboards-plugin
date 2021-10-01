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
import { GroupByPopover } from './index';

export default function GroupByItem(
  { values, arrayHelpers, fieldOptions, expressionWidth, groupByItem, index } = this.props
) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(groupByItem === '');
  const closePopover = () => {
    if (_.isEmpty(groupByItem)) arrayHelpers.remove(index);
    setIsPopoverOpen(false);
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
            }}
            iconOnClickAriaLabel="Remove group by"
            onClick={() => {
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
        options={fieldOptions}
        closePopover={closePopover}
        expressionWidth={expressionWidth}
        index={index}
      />
    </EuiPopover>
  );
}
