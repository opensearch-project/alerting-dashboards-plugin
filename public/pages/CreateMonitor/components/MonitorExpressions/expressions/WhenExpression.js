/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import { connect } from 'formik';
import { EuiPopover, EuiExpression } from '@elastic/eui';

import { Expressions, POPOVER_STYLE, AGGREGATION_TYPES, EXPRESSION_STYLE } from './utils/constants';
import { selectOptionValueToText } from './utils/helpers';
import { FormikSelect } from '../../../../../components/FormControls';

class WhenExpression extends Component {
  onChangeWrapper = (e, field) => {
    this.props.onMadeChanges();
    field.onChange(e);
  };

  renderPopover = () => (
    <div style={{ width: 180, ...POPOVER_STYLE, ...EXPRESSION_STYLE }}>
      <FormikSelect
        name="aggregationType"
        inputProps={{
          onChange: this.onChangeWrapper,
          options: AGGREGATION_TYPES,
        }}
      />
    </div>
  );

  render() {
    const {
      formik: { values },
      openedStates,
      closeExpression,
      openExpression,
    } = this.props;
    return (
      <EuiPopover
        id="when-popover"
        button={
          <EuiExpression
            description="when"
            value={selectOptionValueToText(values.aggregationType, AGGREGATION_TYPES)}
            isActive={openedStates.WHEN}
            onClick={() => openExpression(Expressions.WHEN)}
          />
        }
        isOpen={openedStates.WHEN}
        closePopover={() => closeExpression(Expressions.WHEN)}
        panelPaddingSize="none"
        ownFocus
        withTitle
        anchorPosition="downLeft"
      >
        {this.renderPopover()}
      </EuiPopover>
    );
  }
}

export default connect(WhenExpression);
