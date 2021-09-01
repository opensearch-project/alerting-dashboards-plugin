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
import { EuiFlexGroup, EuiFlexItem, EuiSpacer } from '@elastic/eui';
import FormikCheckableCard from '../../../../components/FormControls/FormikCheckableCard/FormikCheckableCard';
import { OS_AD_PLUGIN, MONITOR_TYPE, SEARCH_TYPE } from '../../../../utils/constants';
import { MONITOR_TYPE_CARD_WIDTH } from '../MonitorType/MonitorType';

const MONITOR_DEFINITION_CARD_WIDTH =
  (MONITOR_TYPE_CARD_WIDTH * _.keys(MONITOR_TYPE).length) / _.keys(SEARCH_TYPE).length;

const onChangeDefinition = (e, form) => {
  const type = e.target.value;
  form.setFieldValue('searchType', type, false);
};

const MonitorDefinitionCard = ({ values, resetResponse, plugins }) => {
  const hasADPlugin = plugins.indexOf(OS_AD_PLUGIN) !== -1;
  const isBucketLevelMonitor = values.monitor_type === MONITOR_TYPE.BUCKET_LEVEL;

  return (
    <div>
      <EuiFlexGroup alignItems={'flexEnd'} gutterSize={'s'}>
        <EuiFlexItem grow={false} style={{ width: `${MONITOR_DEFINITION_CARD_WIDTH}px` }}>
          <FormikCheckableCard
            name="searchTypeGraph"
            formRow
            rowProps={{ label: 'Choose a monitor defining method' }}
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
        <EuiFlexItem grow={false} style={{ width: `${MONITOR_DEFINITION_CARD_WIDTH}px` }}>
          <EuiSpacer />
          <FormikCheckableCard
            name="searchTypeQuery"
            formRow
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
          <EuiFlexItem grow={false} style={{ width: `${MONITOR_DEFINITION_CARD_WIDTH}px` }}>
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
