/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import { connect, FieldArray } from 'formik';
import { EuiButtonEmpty, EuiSpacer, EuiText } from '@elastic/eui';
import { inputLimitText } from '../../../../utils/helpers';
import DocumentLevelQueryTag, { DOC_LEVEL_TAG_TOOLTIP } from './DocumentLevelQueryTag';
import IconToolTip from '../../../../components/IconToolTip';
import _ from 'lodash';
import { FormikFormRow } from '../../../../components/FormControls';
import { hasError, isInvalid } from '../../../../utils/validate';

export const MAX_TAGS = 10; // TODO DRAFT: Placeholder limit

class ConfigureDocumentLevelQueryTags extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  renderTags(arrayHelpers) {
    const {
      formik: { errors, values },
      formFieldName = '',
      query,
      queryIndex,
    } = this.props;
    const numOfTags = query.tags.length;
    const tagsErrors = _.get(errors, `${formFieldName}.tags`, []);
    const containsErrors = !_.isEmpty(tagsErrors);
    return (
      <div>
        <EuiText size={'xs'} color={containsErrors ? 'danger' : undefined}>
          <strong>Tags</strong>
          <i> - optional </i>
          <IconToolTip content={DOC_LEVEL_TAG_TOOLTIP} iconType={'questionInCircle'} />
        </EuiText>
        <EuiSpacer size={'s'} />

        {_.isEmpty(query.tags) && (
          <div>
            <EuiText size={'xs'}>No tags defined.</EuiText>
          </div>
        )}

        <FormikFormRow
          form={this.props.formik}
          name={`${formFieldName}.tags`}
          rowProps={{ error: hasError, isInvalid }}
        >
          <div>
            {values.queries[queryIndex].tags.map((tag, index) => {
              return (
                <span style={{ paddingRight: '5px' }} key={`${formFieldName}.tags.${index}`}>
                  <DocumentLevelQueryTag
                    tag={tag}
                    tagIndex={index}
                    queryIndex={queryIndex}
                    arrayHelpers={arrayHelpers}
                    formFieldName={`${formFieldName}.tags.${index}`}
                  />
                </span>
              );
            })}
          </div>
        </FormikFormRow>

        <EuiButtonEmpty
          size={'xs'}
          onClick={() => arrayHelpers.push('')}
          disabled={numOfTags >= MAX_TAGS}
          style={{ paddingTop: '5px' }}
          data-test-subj={`addDocLevelQueryTagButton_query${queryIndex}`}
        >
          + Add tag
        </EuiButtonEmpty>
        {inputLimitText(numOfTags, MAX_TAGS, 'tag', 'tags')}
      </div>
    );
  }

  render() {
    const { formFieldName } = this.props;
    return (
      <FieldArray name={`${formFieldName}.tags`} validateOnChange={true}>
        {(arrayHelpers) => this.renderTags(arrayHelpers)}
      </FieldArray>
    );
  }
}

export default connect(ConfigureDocumentLevelQueryTags);
