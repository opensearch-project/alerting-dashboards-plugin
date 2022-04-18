/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import _ from 'lodash';
import { connect, FieldArray } from 'formik';
import { EuiButton, EuiSpacer } from '@elastic/eui';
import { inputLimitText } from '../../../../utils/helpers';
import DocumentLevelQuery, { getInitialQueryValues } from './DocumentLevelQuery';

export const MAX_QUERIES = 10; // TODO DRAFT: Placeholder limit

class ConfigureDocumentLevelQueries extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  renderQueries = (arrayHelpers) => {
    const {
      dataTypes,
      formik: { values },
    } = this.props;
    if (_.isEmpty(values.queries)) arrayHelpers.push(_.cloneDeep(getInitialQueryValues()));
    const numOfQueries = values.queries.length;
    return (
      <div>
        {values.queries.map((query, index) => {
          return (
            <DocumentLevelQuery
              key={`query${index}`}
              dataTypes={dataTypes}
              formFieldName={`queries.${index}`}
              queryIndex={index}
              queriesArrayHelpers={arrayHelpers}
              query={query}
            />
          );
        })}

        <div style={{ paddingLeft: '10px' }}>
          <EuiButton
            fill={false}
            size={'s'}
            onClick={() => arrayHelpers.push(_.cloneDeep(getInitialQueryValues(numOfQueries)))}
            disabled={numOfQueries >= MAX_QUERIES}
          >
            {numOfQueries === 0 ? 'Add query' : 'Add another query'}
          </EuiButton>
          <EuiSpacer size={'s'} />
          {inputLimitText(numOfQueries, MAX_QUERIES, 'query', 'queries')}
        </div>
      </div>
    );
  };

  render() {
    return (
      <FieldArray name={'queries'} validateOnChange={false}>
        {(arrayHelpers) => this.renderQueries(arrayHelpers)}
      </FieldArray>
    );
  }
}

export default connect(ConfigureDocumentLevelQueries);
