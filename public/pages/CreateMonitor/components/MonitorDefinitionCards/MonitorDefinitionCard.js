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
import FormikCheckableCard from '../../../../components/FormControls/FormikCheckableCard/FormikCheckableCard';
import { OS_AD_PLUGIN, MONITOR_TYPE, SEARCH_TYPE } from '../../../../utils/constants';

const onChangeDefinition = (e, form) => {
  const type = e.target.value;
  form.setFieldValue('searchType', type, false);
};

const MonitorDefinitionCard = ({ values, resetResponse, plugins }) => {
  const hasADPlugin = plugins.indexOf(OS_AD_PLUGIN) !== -1;
  const isBucketLevelMonitor = values.monitor_type === MONITOR_TYPE.BUCKET_LEVEL;
  return (
    <div>
      <EuiFlexGroup>
        <EuiFlexItem>
          <FormikCheckableCard
            name="searchTypeGraph"
            formRow
            rowProps={{
              label: 'Choose a monitor defining method',
              style: { paddingLeft: '10px' },
            }}
            inputProps={{
              id: 'visualEditorRadioCard',
              label: 'Visual editor',
              checked: values.searchType === SEARCH_TYPE.GRAPH,
              value: SEARCH_TYPE.GRAPH,
              onChange: (e, field, form) => {
                onChangeDefinition(e, form);
              },
            }}
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiSpacer />
          <FormikCheckableCard
            name="searchTypeQuery"
            formRow
            rowProps={{
              label: '',
              style: { paddingLeft: '10px' },
            }}
            inputProps={{
              id: 'extractionQueryEditorRadioCard',
              label: 'Extraction query editor',
              checked: values.searchType === SEARCH_TYPE.QUERY,
              value: SEARCH_TYPE.QUERY,
              onChange: (e, field, form) => {
                onChangeDefinition(e, form);
              },
            }}
          />
        </EuiFlexItem>
        {/*// Only show the anomaly detector option when anomaly detection plugin is present, but not for bucket-level monitors.*/}
        {hasADPlugin && !isBucketLevelMonitor && (
          <EuiFlexItem>
            <EuiSpacer />
            <FormikCheckableCard
              name="searchTypeAD"
              inputProps={{
                id: 'anomalyDetectorRadioCard',
                label: 'Anomaly detector',
                checked: values.searchType === SEARCH_TYPE.AD,
                value: SEARCH_TYPE.AD,
                onChange: (e, field, form) => {
                  onChangeDefinition(e, form);
                },
              }}
            />
          </EuiFlexItem>
        )}
      </EuiFlexGroup>
    </div>
  );
};

export default MonitorDefinitionCard;
