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
import FormikSelect from '../../../../components/FormControls/FormikSelect/FormikSelect';
import { OS_AD_PLUGIN } from '../../../../utils/constants';

const defaultSelectDefinitions = [
  { value: 'graph', text: 'Define using visual graph' },
  { value: 'query', text: 'Define using extraction query' },
  { value: 'localUri', text: 'Define using Local URI endpoint' },
];

const bucketLevelMonitorDefinitions = [
  { value: 'graph', text: 'Define using visual graph' },
  { value: 'query', text: 'Define using extraction query' },
];

const onChangeDefinition = (e, form, resetResponse) => {
  const type = e.target.value;
  resetResponse();
  form.setFieldValue('searchType', type);
};

const selectDefinitions = (plugins, isBucketLevelMonitor) => {
  const definitionOptions = isBucketLevelMonitor
    ? bucketLevelMonitorDefinitions
    : defaultSelectDefinitions;
  return plugins === undefined || plugins.indexOf(OS_AD_PLUGIN) == -1
    ? definitionOptions
    : [...definitionOptions, { value: 'ad', text: 'Define using anomaly detector' }];
};

const MonitorDefinition = ({ resetResponse, plugins, isBucketLevelMonitor }) => (
  <div>
    <FormikSelect
      name="searchType"
      formRow
      rowProps={{
        label: 'Method of definition',
        style: { paddingLeft: '10px' },
      }}
      inputProps={{
        options: selectDefinitions(plugins, isBucketLevelMonitor),
        onChange: (e, field, form) => {
          onChangeDefinition(e, form, resetResponse);
        },
      }}
    />
  </div>
);

export default MonitorDefinition;
