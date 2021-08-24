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
 * Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

import React from 'react';
import _ from 'lodash';
import { EuiFlexGroup, EuiFlexItem, EuiText } from '@elastic/eui';
import FormikCheckableCard from '../../../../components/FormControls/FormikCheckableCard';
import { MONITOR_TYPE, SEARCH_TYPE } from '../../../../utils/constants';
import { FORMIK_INITIAL_TRIGGER_VALUES } from '../../../CreateTrigger/containers/CreateTrigger/utils/constants';

export const MONITOR_TYPE_CARD_WIDTH = 400;

const onChangeDefinition = (e, form) => {
  const type = e.target.value;
  form.setFieldValue('monitor_type', type);

  // Clearing trigger definitions when changing monitor types.
  // TODO: Implement modal that confirms the change before clearing.
  form.setFieldValue('triggerDefinitions', FORMIK_INITIAL_TRIGGER_VALUES.triggerConditions);
};

const queryLevelDescription = (
  <EuiText color={'subdued'} size={'xs'} style={{ paddingBottom: '10px', paddingTop: '0px' }}>
    Per query monitors run a specified query and allow you to define triggers based on the result of
    that query.
  </EuiText>
);

const bucketLevelDescription = (
  <EuiText color={'subdued'} size={'xs'} style={{ paddingBottom: '10px', paddingTop: '0px' }}>
    Per bucket monitors allow you to group results into buckets and define triggers that run per
    bucket.
  </EuiText>
);

const MonitorType = ({ values }) => (
  <EuiFlexGroup alignItems={'flexEnd'} gutterSize={'m'}>
    <EuiFlexItem grow={false}>
      <FormikCheckableCard
        name="monitorTypeQueryLevel"
        formRow
        rowProps={{
          label: 'Choose a monitor type',
          style: { width: `${MONITOR_TYPE_CARD_WIDTH}px` },
        }}
        inputProps={{
          id: 'queryLevelMonitorRadioCard',
          label: 'Per query monitor',
          checked: values.monitor_type === MONITOR_TYPE.QUERY_LEVEL,
          value: MONITOR_TYPE.QUERY_LEVEL,
          onChange: (e, field, form) => {
            onChangeDefinition(e, form);
          },
          children: queryLevelDescription,
          'data-test-subj': 'queryLevelMonitorRadioCard',
        }}
      />
    </EuiFlexItem>
    <EuiFlexItem grow={false}>
      <FormikCheckableCard
        name="monitorTypeBucketLevel"
        formRow
        rowProps={{ style: { width: '400px' } }}
        inputProps={{
          id: 'bucketLevelMonitorRadioCard',
          label: 'Per bucket monitor',
          checked: values.monitor_type === MONITOR_TYPE.BUCKET_LEVEL,
          value: MONITOR_TYPE.BUCKET_LEVEL,
          onChange: (e, field, form) => {
            const searchType = _.get(values, 'searchType');
            // Setting search type to graph when changing monitor type from query-level to bucket-level,
            // and the search type is not supported by bucket-level monitors.
            if (searchType !== SEARCH_TYPE.GRAPH || searchType !== SEARCH_TYPE.QUERY)
              form.setFieldValue('searchType', SEARCH_TYPE.GRAPH);
            onChangeDefinition(e, form);
          },
          children: bucketLevelDescription,
          'data-test-subj': 'bucketLevelMonitorRadioCard',
        }}
      />
    </EuiFlexItem>
  </EuiFlexGroup>
);

export default MonitorType;
