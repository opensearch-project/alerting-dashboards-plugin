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

import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiSpacer } from '@elastic/eui';
import FormikCheckableCard from '../../../../components/FormControls/FormikCheckableCard';
import { MONITOR_TYPE, SEARCH_TYPE } from '../../../../utils/constants';
import { FORMIK_INITIAL_VALUES } from '../../containers/CreateMonitor/utils/constants';

const onChangeDefinition = (e, form) => {
  const type = e.target.value;
  form.setFieldValue('monitor_type', type);
};

const MonitorType = ({ values }) => (
  <div>
    <EuiFlexGroup>
      <EuiFlexItem>
        <FormikCheckableCard
          name="monitorTypeQueryLevel"
          formRow
          rowProps={{
            label: 'Choose a monitor type',
            style: { paddingLeft: '10px' },
          }}
          inputProps={{
            id: 'queryLevelMonitorRadioCard',
            label: 'Query-Level Monitor',
            checked: values.monitor_type === MONITOR_TYPE.QUERY_LEVEL,
            value: MONITOR_TYPE.QUERY_LEVEL,
            onChange: (e, field, form) => {
              const searchType = _.get(values, 'searchType');
              if (searchType !== SEARCH_TYPE.GRAPH || searchType !== SEARCH_TYPE.QUERY) {
                // Clear the form when changing the monitor type from query-level to bucket-level
                // if the search type is unsupported, but keep the monitor name.
                form.setValues({ ...FORMIK_INITIAL_VALUES, name: values.name });
              }
              onChangeDefinition(e, form);
            },
          }}
        />
      </EuiFlexItem>
      <EuiFlexItem>
        <EuiSpacer />
        <FormikCheckableCard
          name="monitorTypeBucketLevel"
          formRow
          rowProps={{
            label: '',
            style: { paddingLeft: '10px' },
          }}
          inputProps={{
            id: 'bucketLevelMonitorRadioCard',
            label: 'Bucket-Level Monitor',
            checked: values.monitor_type === MONITOR_TYPE.BUCKET_LEVEL,
            value: MONITOR_TYPE.BUCKET_LEVEL,
            onChange: (e, field, form) => {
              onChangeDefinition(e, form);
            },
          }}
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  </div>
);

export default MonitorType;
