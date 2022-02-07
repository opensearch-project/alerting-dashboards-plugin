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
import { EuiFlexGroup, EuiFlexItem, EuiLink, EuiText } from '@elastic/eui';
import FormikCheckableCard from '../../../../components/FormControls/FormikCheckableCard/FormikCheckableCard';
import { OS_AD_PLUGIN, MONITOR_TYPE, SEARCH_TYPE } from '../../../../utils/constants';
import { MONITOR_TYPE_CARD_WIDTH } from '../MonitorType/MonitorType';
import { URL } from '../../../../../utils/constants';

const monitorDefinitionCardWidth = (hasADPlugin = false) => {
  const numSearchTypes = hasADPlugin ? _.keys(SEARCH_TYPE).length : _.keys(SEARCH_TYPE).length - 1;
  return (MONITOR_TYPE_CARD_WIDTH * _.keys(MONITOR_TYPE).length) / numSearchTypes;
};

const onChangeDefinition = (e, form) => {
  const type = e.target.value;
  form.setFieldValue('searchType', type, false);
};

const MonitorDefinitionCard = ({ values, plugins }) => {
  const hasADPlugin = plugins.indexOf(OS_AD_PLUGIN) !== -1;
  const isBucketLevelMonitor = values.monitor_type === MONITOR_TYPE.BUCKET_LEVEL;

  return (
    <div>
      <EuiText size={'xs'} style={{ paddingBottom: '0px', marginBottom: '0px' }}>
        <h4>Monitor defining method</h4>
      </EuiText>
      <EuiText color={'subdued'} size={'xs'}>
        Specify the way you want to define your query and triggers.{' '}
        <EuiLink external href={URL.CREATE_MONITOR_DOCUMENTATION} target="_blank">
          Learn more
        </EuiLink>
      </EuiText>
      <EuiFlexGroup
        alignItems={'flexStart'}
        gutterSize={'s'}
        style={{ paddingTop: '0px', marginTop: '0px' }}
      >
        <EuiFlexItem grow={false} style={{ width: `${monitorDefinitionCardWidth(hasADPlugin)}px` }}>
          <FormikCheckableCard
            name="searchTypeGraph"
            formRow
            inputProps={{
              id: 'visualEditorRadioCard',
              label: 'Visual editor',
              checked: values.searchType === SEARCH_TYPE.GRAPH,
              value: SEARCH_TYPE.GRAPH,
              onChange: (e, field, form) => {
                onChangeDefinition(e, form);
              },
              'data-test-subj': 'visualEditorRadioCard',
            }}
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false} style={{ width: `${monitorDefinitionCardWidth(hasADPlugin)}px` }}>
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
              'data-test-subj': 'extractionQueryEditorRadioCard',
            }}
          />
        </EuiFlexItem>
        {/*// Do not display the local uri option for bucket-level monitors.*/}
        {!isBucketLevelMonitor && (
          <EuiFlexItem
            grow={false}
            style={{ width: `${monitorDefinitionCardWidth(hasADPlugin)}px` }}
          >
            <FormikCheckableCard
              name="searchTypeLocalUri"
              formRow
              inputProps={{
                id: 'localUriRadioCard',
                label: 'Local URI',
                checked: values.searchType === SEARCH_TYPE.LOCAL_URI,
                value: SEARCH_TYPE.LOCAL_URI,
                onChange: (e, field, form) => {
                  onChangeDefinition(e, form);
                },
                'data-test-subj': 'localUriRadioCard',
              }}
            />
          </EuiFlexItem>
        )}
        {/*// Only show the anomaly detector option when anomaly detection plugin is present, but not for bucket-level monitors.*/}
        {hasADPlugin && !isBucketLevelMonitor && (
          <EuiFlexItem
            grow={false}
            style={{ width: `${monitorDefinitionCardWidth(hasADPlugin)}px` }}
          >
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
                'data-test-subj': 'anomalyDetectorRadioCard',
              }}
            />
          </EuiFlexItem>
        )}
      </EuiFlexGroup>
    </div>
  );
};

export default MonitorDefinitionCard;
