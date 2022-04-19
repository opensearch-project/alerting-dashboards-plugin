/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import _ from 'lodash';
import { connect } from 'formik';
import {
  EuiBadge,
  EuiButtonEmpty,
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPopover,
  EuiPopoverTitle,
  EuiSpacer,
} from '@elastic/eui';
import { FormikFieldText } from '../../../../components/FormControls';
import { hasError, isInvalid, required } from '../../../../utils/validate';
import { EXPRESSION_STYLE, POPOVER_STYLE } from '../MonitorExpressions/expressions/utils/constants';

export const DOC_LEVEL_TAG_TOOLTIP = 'Tags to associate with your queries.'; // TODO DRAFT: Placeholder wording
export const TAG_PLACEHOLDER_TEXT = 'Enter the search term'; // TODO DRAFT: Placeholder wording

class DocumentLevelQueryTag extends Component {
  constructor(props) {
    super(props);
    const { tag } = props;
    this.state = {
      isPopoverOpen: _.isEmpty(tag),
    };
    this.closePopover = this.closePopover.bind(this);
    this.openPopover = this.openPopover.bind(this);
  }

  closePopover() {
    const { arrayHelpers, tag, tagIndex } = this.props;
    if (_.isEmpty(tag)) arrayHelpers.remove(tagIndex);
    this.setState({ isPopoverOpen: false });
  }

  openPopover() {
    this.setState({ isPopoverOpen: true });
  }

  renderPopover() {
    const { formFieldName } = this.props;
    return (
      <div
        style={{
          width: 250,
          height: 160,
          ...POPOVER_STYLE,
          ...EXPRESSION_STYLE,
        }}
      >
        <FormikFieldText
          name={formFieldName}
          formRow
          fieldProps={{ validate: required }} // TODO DRAFT: What constraints should we implement?
          rowProps={{
            style: { maxWidth: '100%' },
            isInvalid,
            error: hasError,
          }}
          inputProps={{
            placeholder: TAG_PLACEHOLDER_TEXT,
            fullWidth: true,
            isInvalid,
          }}
        />
        <EuiSpacer size={'l'} />
        <EuiFlexGroup alignItems={'center'} justifyContent={'flexEnd'}>
          <EuiFlexItem>
            <EuiButtonEmpty onClick={this.closePopover}>Cancel</EuiButtonEmpty>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiButton fill onClick={this.closePopover}>
              Save
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>
    );
  }

  render() {
    const { arrayHelpers, tag = '', tagIndex = 0 } = this.props;
    const { isPopoverOpen } = this.state;
    return (
      <EuiPopover
        id={'tag-badge-popover'}
        button={
          <div>
            <EuiBadge
              color={'hollow'}
              iconSide={'right'}
              iconType={'cross'}
              iconOnClick={() => arrayHelpers.remove(tagIndex)}
              iconOnClickAriaLabel={'Remove tag'}
              onClick={this.openPopover}
              onClickAriaLabel={'Edit tag'}
            >
              {_.isEmpty(tag) ? TAG_PLACEHOLDER_TEXT : tag}
            </EuiBadge>
          </div>
        }
        isOpen={isPopoverOpen}
        closePopover={this.closePopover}
        panelPaddingSize={'none'}
        ownFocus
        withTitle
        anchorPosition={'downLeft'}
      >
        <EuiPopoverTitle> ADD TAG </EuiPopoverTitle>
        {this.renderPopover()}
      </EuiPopover>
    );
  }
}

export default connect(DocumentLevelQueryTag);
