/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiFlexGrid,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormLabel,
  EuiCompressedFormRow,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
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
  form.setFieldValue('searchType', FORMIK_INITIAL_VALUES.searchType);
  form.setFieldValue('triggerDefinitions', FORMIK_INITIAL_TRIGGER_VALUES.triggerConditions);
  switch (type) {
    case MONITOR_TYPE.COMPOSITE_LEVEL:
      form.setFieldValue('searchType', SEARCH_TYPE.GRAPH);
      break;
    case MONITOR_TYPE.CLUSTER_METRICS:
      form.setFieldValue('searchType', SEARCH_TYPE.CLUSTER_METRICS);
      break;
    case MONITOR_TYPE.DOC_LEVEL:
      form.setFieldValue('query', DEFAULT_DOCUMENT_LEVEL_QUERY);
      break;
    default:
      form.setFieldValue('query', FORMIK_INITIAL_VALUES.query);
  }
};

const queryLevelDescription = (
  <EuiText color={'subdued'} size={'xs'} style={{ paddingBottom: '10px', paddingTop: '0px' }}>
    Per query monitors run a query and generate alerts based on trigger criteria that match query
    results.
  </EuiText>
);

const bucketLevelDescription = (
  <EuiText color={'subdued'} size={'xs'} style={{ paddingBottom: '10px', paddingTop: '0px' }}>
    Per bucket monitors run a query that evaluates trigger criteria based on aggregated values in
    the dataset.
  </EuiText>
);

const clusterMetricsDescription = (
  <EuiText color={'subdued'} size={'xs'} style={{ paddingBottom: '10px', paddingTop: '0px' }}>
    Per cluster metrics monitors run API requests to monitor the cluster’s health.
  </EuiText>
);

const documentLevelDescription = // TODO DRAFT: confirm wording
  (
    <EuiText color={'subdued'} size={'xs'} style={{ paddingBottom: '10px', paddingTop: '0px' }}>
      Per document monitors run queries that return individual documents matching the trigger
      conditions.
    </EuiText>
  );

const compositeLevelDescription = (
  <EuiText color={'subdued'} size={'xs'} style={{ paddingBottom: '10px', paddingTop: '0px' }}>
    Composite monitors chain the outputs of different monitor types and focus trigger conditions to
    reduce alert noise and generate finer results.
  </EuiText>
);

const MonitorType = ({ values }) => (
  <>
    <EuiFormLabel>Monitor type</EuiFormLabel>
    <EuiSpacer size="xs" />
    <EuiFlexGrid gutterSize={'m'}>
      <EuiFlexItem grow={false} style={{ width: 350 }}>
        <FormikCheckableCard
          name="monitorTypeQueryLevel"
          inputProps={{
            id: 'queryLevelMonitorRadioCard',
            label: 'Per query monitor',
            checked: values.monitor_type === MONITOR_TYPE.QUERY_LEVEL,
            value: MONITOR_TYPE.QUERY_LEVEL,
            onChange: (e, field, form) => onChangeDefinition(e, form),
            children: queryLevelDescription,
            'data-test-subj': 'queryLevelMonitorRadioCard',
          }}
        />
      </EuiFlexItem>
      <EuiFlexItem grow={false} style={{ width: 350 }}>
        <FormikCheckableCard
          name="monitorTypeBucketLevel"
          inputProps={{
            id: 'bucketLevelMonitorRadioCard',
            label: 'Per bucket monitor',
            checked: values.monitor_type === MONITOR_TYPE.BUCKET_LEVEL,
            value: MONITOR_TYPE.BUCKET_LEVEL,
            onChange: (e, field, form) => onChangeDefinition(e, form),
            children: bucketLevelDescription,
            'data-test-subj': 'bucketLevelMonitorRadioCard',
          }}
        />
      </EuiFlexItem>
      <EuiFlexItem grow={false} style={{ width: 350 }}>
        <FormikCheckableCard
          name="monitorTypeClusterMetrics"
          inputProps={{
            id: 'clusterMetricsMonitorRadioCard',
            label: 'Per cluster metrics monitor',
            checked: values.monitor_type === MONITOR_TYPE.CLUSTER_METRICS,
            value: MONITOR_TYPE.CLUSTER_METRICS,
            onChange: (e, field, form) => onChangeDefinition(e, form),
            children: clusterMetricsDescription,
            'data-test-subj': 'clusterMetricsMonitorRadioCard',
          }}
        />
      </EuiFlexItem>
      <EuiFlexItem grow={false} style={{ width: 350 }}>
        <FormikCheckableCard
          name="monitorTypeDocLevel"
          inputProps={{
            id: 'docLevelMonitorRadioCard',
            label: 'Per document monitor',
            checked: values.monitor_type === MONITOR_TYPE.DOC_LEVEL,
            value: MONITOR_TYPE.DOC_LEVEL,
            onChange: (e, field, form) => onChangeDefinition(e, form),
            children: documentLevelDescription,
            'data-test-subj': 'docLevelMonitorRadioCard',
          }}
        />
      </EuiFlexItem>
      <EuiFlexItem grow={false} style={{ width: 350 }}>
        <FormikCheckableCard
          name="monitorTypeCompositeLevel"
          inputProps={{
            id: 'compositeLevelMonitorRadioCard',
            label: 'Composite monitor',
            checked: values.monitor_type === MONITOR_TYPE.COMPOSITE_LEVEL,
            value: MONITOR_TYPE.COMPOSITE_LEVEL,
            onChange: (e, field, form) => onChangeDefinition(e, form),
            children: compositeLevelDescription,
            'data-test-subj': 'compositeLevelMonitorRadioCard',
          }}
        />
      </EuiFlexItem>
    </EuiFlexGrid>
  </>
);

export default MonitorType;
