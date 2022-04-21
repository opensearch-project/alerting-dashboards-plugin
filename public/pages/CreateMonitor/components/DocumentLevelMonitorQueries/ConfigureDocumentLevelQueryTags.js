/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import { connect, FieldArray } from 'formik';
import { EuiButtonEmpty } from '@elastic/eui';
import { inputLimitText } from '../../../../utils/helpers';
import DocumentLevelQueryTag from './DocumentLevelQueryTag';

export const MAX_TAGS = 10; // TODO DRAFT: Placeholder limit

class ConfigureDocumentLevelQueryTags extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  renderTags(arrayHelpers) {
    const {
      formik: { values },
      formFieldName = '',
      query,
      queryIndex,
    } = this.props;
    const numOfTags = query.tags.length;
    return (
      <div>
        {values.queries[queryIndex].tags.map((tag, index) => {
          return (
            <span style={{ paddingRight: '5px' }} key={`${formFieldName}.tags.${index}`}>
              <DocumentLevelQueryTag
                tag={tag}
                tagIndex={index}
                arrayHelpers={arrayHelpers}
                formFieldName={`${formFieldName}.tags.${index}`}
              />
            </span>
          );
        })}
        <div>
          <EuiButtonEmpty
            size={'xs'}
            onClick={() => arrayHelpers.push('')}
            disabled={numOfTags >= MAX_TAGS}
            style={{ paddingTop: '5px' }}
          >
            + Add tag
          </EuiButtonEmpty>
          {inputLimitText(numOfTags, MAX_TAGS, 'tag', 'tags')}
        </div>
      </div>
    );
  }

  render() {
    const { formFieldName } = this.props;
    return (
      <FieldArray name={`${formFieldName}.tags`} validateOnChange={false}>
        {(arrayHelpers) => this.renderTags(arrayHelpers)}
      </FieldArray>
    );
  }
}

export default connect(ConfigureDocumentLevelQueryTags);
