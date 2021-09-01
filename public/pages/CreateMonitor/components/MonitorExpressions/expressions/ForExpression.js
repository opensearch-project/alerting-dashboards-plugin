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

/*
 *   Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 *   Licensed under the Apache License, Version 2.0 (the "License").
 *   You may not use this file except in compliance with the License.
 *   A copy of the License is located at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   or in the "license" file accompanying this file. This file is distributed
 *   on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 *   express or implied. See the License for the specific language governing
 *   permissions and limitations under the License.
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'formik';
import { EuiText, EuiFlexGroup, EuiFlexItem, EuiPopover, EuiExpression } from '@elastic/eui';
import { Expressions, POPOVER_STYLE, UNITS_OF_TIME, EXPRESSION_STYLE } from './utils/constants';
import { selectOptionValueToText } from './utils/helpers';
import { FormikFieldNumber, FormikSelect } from '../../../../../components/FormControls';

class ForExpression extends Component {
  onChangeWrapper = (e, field) => {
    this.props.onMadeChanges();
    field.onChange(e);
  };

  render() {
    return (
      <div>
        <EuiText size="xs">
          <h4>For the last</h4>
        </EuiText>
        <EuiFlexGroup style={{ maxWidth: 600, ...EXPRESSION_STYLE }}>
          <EuiFlexItem grow={false} style={{ width: 100 }}>
            <FormikFieldNumber name="bucketValue" inputProps={{ onChange: this.onChangeWrapper }} />
          </EuiFlexItem>
          <EuiFlexItem grow={false} style={{ width: 150 }}>
            <FormikSelect
              name="bucketUnitOfTime"
              inputProps={{
                onChange: this.onChangeWrapper,
                options: UNITS_OF_TIME,
              }}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>
    );
  }
}

ForExpression.propTypes = {
  formik: PropTypes.object.isRequired,
  onMadeChanges: PropTypes.func.isRequired,
};

export default connect(ForExpression);
