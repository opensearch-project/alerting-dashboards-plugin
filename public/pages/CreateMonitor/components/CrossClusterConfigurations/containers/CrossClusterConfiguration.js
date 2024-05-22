/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import _ from 'lodash';
import { EuiHealth, EuiLink, EuiSpacer, EuiText } from '@elastic/eui';
import { FormikComboBox } from '../../../../../components/FormControls';
import { MONITOR_TYPE } from '../../../../../utils/constants';
import { connect } from 'formik';
import { validateIndex } from '../../../../../utils/validate';
import { getDataSourceQueryObj } from '../../../../utils/helpers';
export const CROSS_CLUSTER_SETUP_LINK =
  'https://opensearch.org/docs/latest/security/access-control/cross-cluster-search/';

export const HEALTH_TO_COLOR = {
  green: 'success',
  yellow: 'warning',
  red: 'danger',
  undefined: 'subdued',
};

export const GENERIC_LOCAL_CLUSTER_KEY = '_localCluster';
export class CrossClusterConfiguration extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loadedInitialValues: false,
      loading: true,
      localClusterName: '',
      clusterCount: 0,
      clusterOptions: [],
      selectedClusters: [],
      indexOptions: [],
      selectedIndexes: [],
    };
  }

  componentDidMount() {
    this.getIndexes();
  }

  componentDidUpdate(prevProps, prevState) {
    const { loadedInitialValues, selectedClusters } = this.state;
    if (prevState.selectedClusters !== selectedClusters && loadedInitialValues) this.getIndexes();
  }

  async getIndexes() {
    const { httpClient } = this.props;
    const { loadedInitialValues, selectedClusters } = this.state;
    this.setState({ loading: true });
    try {
      const indexes = selectedClusters.map((cluster) =>
        cluster.hub_cluster ? '*' : `${cluster.cluster}:*`
      );
      const query = {
        indexes: indexes.length === 0 ? '*,*:*' : indexes.join(','),
        include_mappings: !loadedInitialValues,
        dataSourceId: getDataSourceQueryObj()?.query?.dataSourceId,
      };
      const response = await httpClient.get(`../api/alerting/remote/indexes`, { query: query });
      if (response.ok) {
        this.parseOptions(response.resp);
      } else {
        console.log('Error getting clusters:', response);
      }
    } catch (e) {
      console.error(e);
    }
    this.setState({ loading: false });
  }

  parseOptions = (clusterInfos = {}) => {
    const {
      formik: { values },
    } = this.props;
    const { loadedInitialValues } = this.state;
    const clusterOptions = [];
    const categorizedClusterOptions = {
      Local: [],
      Remote: [],
    };
    const categorizedIndexOptions = {};
    const selectedClusters = this.state.selectedClusters;
    const selectedIndexes = this.state.selectedIndexes;
    let localClusterName = '';

    // Parse the selected clusters and indexes when editing a monitor.
    const indexes = {};
    if (!loadedInitialValues && !selectedIndexes.length && (values.index || []).length) {
      // In 'values', 'index' consists of an array of '{ label: index-name }' objects.
      values?.index.forEach(({ label }) => {
        if (label.includes(':')) {
          // Splits the index from 'cluster-name:index-name' format to an array with the cluster
          // name as entry 0, and index name as entry 1.
          const clusterName = label.split(':')[0];
          const indexName = label.split(':')[1];
          if (!indexes[clusterName]) indexes[clusterName] = [];
          indexes[clusterName].push(indexName);
        } else {
          // Indexes in `index-name` format indicate the local cluster
          if (!indexes[GENERIC_LOCAL_CLUSTER_KEY]) indexes[GENERIC_LOCAL_CLUSTER_KEY] = [];
          indexes[GENERIC_LOCAL_CLUSTER_KEY].push(label);
        }
      });
    }

    const getClusterOptionLabel = (clusterInfo) =>
      `${clusterInfo.cluster} ${clusterInfo.hub_cluster ? '(Local)' : '(Remote)'}`;

    Object.entries(clusterInfos).forEach(([clusterName, clusterInfo]) => {
      const clusterLabel = getClusterOptionLabel(clusterInfo);
      const clusterOption = {
        label: clusterLabel,
        cluster: clusterInfo.cluster,
        health: clusterInfo.health,
        hub_cluster: clusterInfo.hub_cluster,
        latency: clusterInfo.latency,
      };
      clusterOptions.push(clusterOption);
      if (clusterOption.hub_cluster) {
        localClusterName = clusterOption.cluster;
        categorizedClusterOptions.Local.push(clusterOption);

        // To simplify iterations, consolidate any indexes listed under GENERIC_LOCAL_CLUSTER_KEY
        // with the local cluster, then delete the GENERIC_LOCAL_CLUSTER_KEY entry.
        indexes[localClusterName] = (indexes[localClusterName] || []).concat(
          indexes[GENERIC_LOCAL_CLUSTER_KEY] || []
        );
        delete indexes[GENERIC_LOCAL_CLUSTER_KEY];
      } else {
        categorizedClusterOptions.Remote.push(clusterOption);
      }

      if (!loadedInitialValues) {
        // Parse the selected clusters when editing a monitor.
        switch (values.monitor_type) {
          case MONITOR_TYPE.CLUSTER_METRICS:
            if ((values.clusterNames || []).includes(clusterName))
              selectedClusters.push(clusterOption);
            break;
          default:
            if (Object.keys(indexes).includes(clusterName)) selectedClusters.push(clusterOption);
        }

        // Select the local cluster by default if there are no other selected clusters.
        if (!selectedClusters.length && clusterInfo.hub_cluster) {
          selectedClusters.push(clusterOption);
          this.setState({ selectedClusters: selectedClusters });
        }
      }

      // Only display indexes for the selected clusters
      if (selectedClusters.some((option) => option.cluster === clusterName)) {
        const clusterIndexOptions =
          clusterInfo.indexes === undefined
            ? []
            : Object.entries(clusterInfo.indexes).map(([_, indexInfo]) => {
                const indexOption = {
                  label: indexInfo.name,
                  health: indexInfo.health,
                  index: indexInfo.name,
                  cluster: clusterInfo.cluster,
                  value:
                    clusterInfo.cluster === undefined || clusterInfo.hub_cluster
                      ? indexInfo.name
                      : `${clusterInfo.cluster}:${indexInfo.name}`,
                };

                // Parse the selected indexes when editing a monitor.
                if (
                  !loadedInitialValues &&
                  (indexes[clusterName] || []).includes(indexOption.index)
                )
                  selectedIndexes.push(indexOption);
                return indexOption;
              });

        if (!categorizedIndexOptions[clusterInfo.cluster])
          categorizedIndexOptions[clusterInfo.cluster] = { label: clusterLabel, options: [] };

        categorizedIndexOptions[clusterInfo.cluster].options = _.orderBy(
          clusterIndexOptions,
          ['index'],
          ['asc']
        );
      }
    });

    categorizedClusterOptions.Remote = _.orderBy(
      categorizedClusterOptions.Remote,
      ['hub_cluster', 'cluster'],
      [`desc`, 'asc']
    );

    let outputState = {};
    if (!loadedInitialValues) {
      // Create generic indexOptions for any pre-selected indexes that have not yet been added to selectedIndexes.
      Object.entries(indexes).forEach(([clusterName, indexList = []]) => {
        indexList.forEach((index) => {
          const includesIndex = (categorizedIndexOptions[clusterName].options || []).some(
            (option) => option.index === index
          );
          if (!includesIndex) {
            const isLocalCluster = clusterName === localClusterName;
            const newOption = {
              label: index,
              health: undefined,
              index: index,
              cluster: clusterName,
              value: isLocalCluster ? index : `${clusterName}:${index}`,
            };
            selectedIndexes.push(newOption);
          }
        });
      });

      outputState = {
        clusterCount: clusterOptions.length,
        clusterOptions: Object.entries(categorizedClusterOptions).map(([category, clusters]) => ({
          label: category,
          options: clusters,
        })),
        loadedInitialValues: true,
        localClusterName: localClusterName,
        selectedClusters: selectedClusters,
        selectedIndexes: this.renderSelectedClusterIndexesOptions(selectedIndexes),
      };
    }

    let indexOptions = Object.entries(categorizedIndexOptions).map(
      ([_, clusterIndexOptions]) => clusterIndexOptions
    );
    indexOptions = _.orderBy(indexOptions, ['label'], ['asc']);
    this.setState({
      ...outputState,
      indexOptions: indexOptions,
    });
  };

  renderClusterOption = (option) => {
    const { label, health } = option;
    return <EuiHealth color={HEALTH_TO_COLOR[health?.toLowerCase()]}>{label}</EuiHealth>;
  };

  onClustersChange = (options = [], field, form) => {
    const { clusterOptions, selectedClusters, selectedIndexes } = this.state;
    // If no clusters are selected, select the local cluster.
    if (!options.length) {
      const localClusterOption = clusterOptions.find((category) => category.label === 'Local')
        ?.options[0];
      options.push(localClusterOption);
    }

    // Remove index selections for cluster that are no longer selected.
    if (options.length && options.some((option) => !selectedClusters.includes(option))) {
      const clusterNames = options.map((clusterOption) => clusterOption.cluster);
      const matchingIndexes = selectedIndexes.filter((indexOption) =>
        clusterNames.includes(indexOption.cluster)
      );
      this.onIndexesChange(matchingIndexes, { name: 'index' }, form);
    }

    form.setFieldValue(
      field.name,
      options.map((option) => option.cluster)
    );
    this.setState({ selectedClusters: options });
  };

  renderClusterIndexesOption = (option) => {
    const { label, health } = option;
    return <EuiHealth color={HEALTH_TO_COLOR[health?.toLowerCase()]}>{label}</EuiHealth>;
  };

  renderSelectedClusterIndexesOptions = (options = []) => {
    // If the cluster name in the option is undefined, it indicates the index is on the local cluster.
    const getLabel = ({ cluster, index }) =>
      `${index} (${cluster ? cluster : this.state.localClusterName})`;
    return options.map((option) => ({
      ...option,
      label: getLabel(option),
    }));
  };

  onIndexesChange = (options, field, form) => {
    const selectedIndexes = this.renderSelectedClusterIndexesOptions(options);
    form.setFieldValue(field.name, selectedIndexes);
    this.setState({ selectedIndexes: selectedIndexes });
  };

  onCreateOption = (value, field, form) => {
    const { localClusterName, selectedIndexes } = this.state;
    let clusterName = localClusterName;
    let indexName = value;
    if (value.includes(':')) {
      const splitValue = value.split(':');
      clusterName = splitValue[0];
      indexName = splitValue[1];
    }
    selectedIndexes.push({
      label: indexName,
      health: undefined,
      index: indexName,
      cluster: clusterName,
      value: clusterName === localClusterName ? indexName : `${clusterName}:${indexName}`,
    });
    form.setFieldValue(field.name, selectedIndexes);
    this.setState({ selectedIndexes: selectedIndexes });
  };

  render() {
    const { monitorType } = this.props;
    const {
      loading,
      clusterCount,
      clusterOptions,
      selectedClusters,
      indexOptions,
      selectedIndexes,
    } = this.state;

    return (
      <>
        <FormikComboBox
          name={'clusterNames'}
          formRow={true}
          rowProps={{
            label: (
              <div>
                <EuiText size={'xs'}>
                  <strong>Select clusters</strong>
                </EuiText>
                <EuiText color={'subdued'} size={'xs'}>
                  Select a local cluster or remote clusters from cross-cluster connections.{' '}
                  <EuiLink external href={CROSS_CLUSTER_SETUP_LINK} target={'_blank'}>
                    Learn more
                  </EuiLink>
                </EuiText>
              </div>
            ),
            style: { paddingLeft: '10px' },
          }}
          inputProps={{
            isLoading: loading,
            // Disable cluster selection field when loading, or when there is only 1 cluster.
            isDisabled: loading || clusterCount <= 1,
            options: clusterOptions,
            renderOption: this.renderClusterOption,
            onChange: this.onClustersChange,
            selectedOptions: selectedClusters,
            'data-test-subj': 'clustersComboBox',
          }}
        />

        <EuiSpacer />

        {monitorType !== MONITOR_TYPE.CLUSTER_METRICS && (
          <FormikComboBox
            name={'index'}
            formRow={true}
            fieldProps={{ validate: validateIndex }}
            rowProps={{
              label: (
                <div>
                  <EuiText size={'xs'}>
                    <strong>Indexes</strong>
                  </EuiText>
                  <EuiText color={'subdued'} size={'xs'}>
                    Select one or more indexes or wildcard patterns
                  </EuiText>
                </div>
              ),
              helpText:
                'You can use * as a wildcard or date math index resolution in your index pattern.',
              style: { paddingLeft: '10px' },
            }}
            inputProps={{
              isLoading: loading,
              isDisabled: loading || selectedClusters.length < 1,
              options: indexOptions,
              renderOption: this.renderClusterIndexesOption,
              onChange: this.onIndexesChange,
              onCreateOption: this.onCreateOption,
              selectedOptions: selectedIndexes,
              'data-test-subj': 'indicesComboBox',
            }}
          />
        )}
      </>
    );
  }
}

export default connect(CrossClusterConfiguration);
