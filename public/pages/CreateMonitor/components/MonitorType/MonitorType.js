/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import _ from 'lodash';
import { EuiFlexGrid, EuiFlexItem, EuiText } from '@elastic/eui';
import FormikCheckableCard from '../../../../components/FormControls/FormikCheckableCard';
import { MONITOR_TYPE, SEARCH_TYPE } from '../../../../utils/constants';
import { FORMIK_INITIAL_TRIGGER_VALUES } from '../../../CreateTrigger/containers/CreateTrigger/utils/constants';
import {
  DEFAULT_DOCUMENT_LEVEL_QUERY,
  FORMIK_INITIAL_VALUES,
} from '../../containers/CreateMonitor/utils/constants';

export const MONITOR_TYPE_CARD_WIDTH = 400; // TODO DRAFT: Determine width

const onChangeDefinition = (e, form) => {
  const type = e.target.value;
  form.setFieldValue('monitor_type', type);

  // Clearing various form fields when changing monitor types.
  // TODO: Implement modal that confirms the change before clearing.
  form.setFieldValue('index', FORMIK_INITIAL_VALUES.index);
  form.setFieldValue('triggerDefinitions', FORMIK_INITIAL_TRIGGER_VALUES.triggerConditions);
  switch (type) {
    case MONITOR_TYPE.DOC_LEVEL:
      form.setFieldValue('query', DEFAULT_DOCUMENT_LEVEL_QUERY);
      break;
    default:
      form.setFieldValue('query', FORMIK_INITIAL_VALUES.query);
  }
};

const queryLevelDescription = (
  <EuiText color={'subdued'} size={'xs'} style={{ paddingBottom: '10px', paddingTop: '0px' }}>
    Per query monitors run a specified query and define triggers that check the results of that
    query.
  </EuiText>
);

const bucketLevelDescription = (
  <EuiText color={'subdued'} size={'xs'} style={{ paddingBottom: '10px', paddingTop: '0px' }}>
    Per bucket monitors allow you to group results into buckets and define triggers that check each
    bucket.
  </EuiText>
);

const clusterMetricsDescription = (
  <EuiText color={'subdued'} size={'xs'} style={{ paddingBottom: '10px', paddingTop: '0px' }}>
    Per cluster metrics monitors allow you to alert based on responses to common REST APIs.
  </EuiText>
);

const documentLevelDescription = ( // TODO DRAFT: confirm wording
  <EuiText color={'subdued'} size={'xs'} style={{ paddingBottom: '10px', paddingTop: '0px' }}>
    Per document monitors allow you to run queries on new documents as they're indexed.
  </EuiText>
);

const MonitorType = ({ values }) => (
  <EuiFlexGrid alignItems={'flexStart'} gutterSize={'m'}>
    <EuiFlexItem grow={false}>
      <FormikCheckableCard
        name="monitorTypeQueryLevel"
        formRow
        rowProps={{ label: 'Monitor type' }}
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
        rowProps={{ hasEmptyLabelSpace: true }}
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
    <EuiFlexItem grow={false}>
      <FormikCheckableCard
        name="monitorTypeClusterMetrics"
        formRow
        rowProps={{ hasEmptyLabelSpace: true }}
        inputProps={{
          id: 'clusterMetricsMonitorRadioCard',
          label: 'Per cluster metrics monitor',
          checked: values.monitor_type === MONITOR_TYPE.CLUSTER_METRICS,
          value: MONITOR_TYPE.CLUSTER_METRICS,
          onChange: (e, field, form) => {
            form.setFieldValue('searchType', SEARCH_TYPE.CLUSTER_METRICS);
            onChangeDefinition(e, form);
          },
          children: clusterMetricsDescription,
          'data-test-subj': 'clusterMetricsMonitorRadioCard',
        }}
      />
    </EuiFlexItem>
    <EuiFlexItem grow={false}>
      <FormikCheckableCard
        name="monitorTypeDocLevel"
        formRow
        rowProps={{ hasEmptyLabelSpace: true }}
        inputProps={{
          id: 'docLevelMonitorRadioCard',
          label: 'Per document monitor',
          checked: values.monitor_type === MONITOR_TYPE.DOC_LEVEL,
          value: MONITOR_TYPE.DOC_LEVEL,
          onChange: (e, field, form) => {
            onChangeDefinition(e, form);
          },
          children: documentLevelDescription,
          'data-test-subj': 'docLevelMonitorRadioCard',
        }}
      />
    </EuiFlexItem>
  </EuiFlexGrid>
);

export default MonitorType;
